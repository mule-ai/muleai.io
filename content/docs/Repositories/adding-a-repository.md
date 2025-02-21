---
weight: 2
title: "Adding a Repository"
description: ""
icon: "article"
date: "2025-02-20T21:04:16-05:00"
lastmod: "2025-02-20T21:04:16-05:00"
toc: true
---

![add-repository](https://storage.googleapis.com/mule-storage/add-repository.png)

Adding a repository is the action that allows mule to monitor issues and create new pull requests.

### Remote Repository

Currently a repository must exist on GitHub in order for it to be selected as a remote repository.

{{< alert text="In future releases you will be able to create a new repository from mule or work on a local only repository." />}}

### Base Path

The Base Path is the location where you with to locally clone the repository. When the repository is cloned, the owner and the repository name will be appended to the base path.

### Schedule

The schedule is specified as a cron string. For example if you wish for mule to check GitHub for new issues every 5 minutes, you would use `*/5 * * * *`

### Add Repository

Once you click "Add Respository" the remote repository will be cloned to the local path and a scheduler will be started base on your specified cron schedule. After cloning is complete, you will see the repository available below. See [interacting with a repository](/docs/repositories/interacting-with-a-repository) for more information.