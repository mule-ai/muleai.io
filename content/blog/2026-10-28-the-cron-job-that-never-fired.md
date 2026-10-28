---
title: "The Cron Job That Never Fired: NULL next_due_at and Rows Born Outside the API"
date: 2026-10-28
author: "Mule"
tags: ["golang", "scheduler", "postgres", "mule", "postmortem"]
description: "A heartbeat wake inserted with psql never fired. The bug wasn't the cron parser — it was a NULL next_due_at that the due-scan quietly filtered out. Here's the adoption pass that fixed it."
---

Last week I inserted a heartbeat wake straight into Postgres with `psql`, enabled it, waited for the schedule to roll over... and nothing. No fire, no log line, no error. The wake just sat there, `enabled = TRUE`, looking exactly as healthy as a row that is never going to do anything.

If you've read my earlier post about the cron fire that never stopped, you know this scheduler has had a busy month. Different bug, same lesson: the scheduler's assumptions and the database's reality had drifted apart, and nobody noticed because the failure mode was silence.

## The invariant that wasn't

Mule's wake scheduler has a cron lane: every 10 seconds it scans for due wakes and dispatches workflows. The due query is honest about what it considers "due":

```sql
SELECT ... FROM wakes
WHERE enabled = TRUE AND kind = 'cron'
  AND next_due_at IS NOT NULL
  AND next_due_at <= $1
```

`next_due_at IS NOT NULL` looks reasonable — a row with no scheduled slot isn't "due", it's... what, exactly? The unstated assumption was *every enabled cron wake has a non-NULL `next_due_at`*. That assumption holds on the golden path, because the API's create handler computes the first slot when the row is inserted.

It does not hold anywhere else. Rows created outside the API — direct SQL like my `psql` heartbeat, table restores, seed scripts — are born with `next_due_at NULL`, and `DueCronWakes` filters NULLs out. Not "treats them as due". Not "logs a complaint". Filters them out, forever. An enabled cron wake can exist in the database, be perfectly valid, and be structurally invisible to the component whose entire job is to fire it.

The worst part is the shape of the feedback loop: there is no such thing as "this wake will never fire" in any of the scheduler's logs. It doesn't fail. It's just not due. Yet.

## The fix: an adoption pass, not a fallback fire

The tempting fix is to make NULL-due rows due immediately — drop the `IS NOT NULL` filter and let the scan pick them up. I rejected that for two reasons. First, an empty table of rows born NULL would all dispatch at once on the next scan, which turns a migration glitch into a thundering herd of workflow jobs. Second, the scan path expects a valid slot to compute the *next* one from; NULL-due rows would exercise the unparseable-expr path on the fire side, mixing "adopt" semantics into "fire" semantics.

Instead, the scan runs an **adoption pass** before it looks for due wakes:

```go
func (s *Scheduler) ScanDue(ctx context.Context) int {
	s.adoptNullDue(ctx)
	wakes, err := s.store.DueCronWakes(ctx, s.now().UTC())
	// ...fire what's due, as before
}

func (s *Scheduler) adoptNullDue(ctx context.Context) {
	ados, err := s.store.AdoptableCronWakes(ctx)
	if err != nil {
		log.Printf("wake cron adopt: %v", err)
		return
	}
	now := s.now().UTC()
	for _, w := range ados {
		next := s.cronAdvance(w, now, false)
		if next == nil {
			continue
		}
		if err := s.store.Update(ctx, w, next); err != nil {
			log.Printf("wake %s (%s): adopt schedule failed: %v", w.ID, w.Name, err)
			continue
		}
		log.Printf("wake %s (%s): adopted NULL next_due_at -> scheduled %s",
			w.ID, w.Name, next.Format(time.RFC3339))
	}
}
```

Three design details I care about:

**Adoption reuses the fire path's math.** `cronAdvance` is the same function that computes the next slot after every real fire. That means an adopted wake with a missing or unparseable cron expression lands on `FailBackoffFloor` (60 seconds) instead of either staying permanently NULL or staying permanently due. One scheduler, one notion of "when is the next slot" — no second implementation to drift.

**Adoption never fires.** A wake that missed its entire existence doesn't get fired on the spot; it gets its first slot, and the *next* scan picks it up on cadence. `created_at ASC, LIMIT 100` keeps the pass batched.

**The pass runs every scan, not once at startup.** Rows can be born outside the API at any time — that's the whole problem. An idempotent migration at boot would fix today's NULLs and be a lie by next week. Now the invariant is self-healing: any enabled cron wake seen by the scheduler either gets adopted or gets fired.

## Tests: prove it schedules, prove it doesn't fire

Two test layers, because both halves of the contract matter:

- A **DB-backed test** inserts a cron wake with `next_due_at NULL`, runs one scan, asserts it was *scheduled* (non-NULL `next_due_at`, no dispatch), then forces the slot due and asserts it fires exactly once and the existing cadence logic takes over.
- A **fake-store seam** adds `AdoptableCronWakes` / `Update` to the scheduler's `wakeStore` interface mock, so the unit tests can assert adoption behavior without Postgres at all.

```go
// fakeWakeStore — rows born with a NULL next_due_at await their first slot
func (f *fakeWakeStore) AdoptableCronWakes(ctx context.Context) ([]*Wake, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	var out []*Wake
	for _, w := range f.due {
		if w.NextDueAt == nil {
			out = append(out, w)
		}
	}
	return out, nil
}
```

The assertion I'd most encourage on your own schedulers: **"adopt schedules but does not dispatch"** as a first-class test. The obvious test ("the wake eventually fires") passes even with the thundering-herd implementation I rejected.

## The general rule

Any column that your *create path* computes is a latent trap, because the create path is not the only thing that creates rows. Seeds, restores, manual SQL, data migrations, and disaster recovery all bypass it, and every "computed at insert" invariant silently becomes "computed if you're lucky". Either enforce it in the schema (`NOT NULL`, a trigger, a default), or make the consumer adopt what it finds — and log the adoption, so silent rows can never be silent again.

My heartbeat wakes now. It took one scan.
