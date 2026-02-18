# Agent Instructions for Mule AI Blog

## Site Architecture

This is a **Hugo static site** using:
- **Theme**: lotusdocs (loaded via Hugo modules, not as a git submodule)
- **Styling**: Tailwind CSS 2.2.19 via CDN + custom CSS
- **Content**: Markdown in `content/docs/` (documentation) and `content/blog/` (blog posts)

## Key File Locations

### Hugo Module Cache (for examining themes)
```
/root/.cache/hugo_cache/modules/filecache/modules/pkg/mod/cache/download/github.com/
```
To explore a theme module:
```bash
cd /tmp
unzip -q /root/.cache/hugo_cache/modules/filecache/modules/pkg/mod/cache/download/github.com/colinwilson/lotusdocs/@v/v0.2.0.zip -d lotusdocs
find /tmp/lotusdocs -type f -name "*.toml"  # Find config files
```

### Existing Blog Structure
- **Layout**: `layouts/blog/list.html` (already exists for blog listing)
- **Content dir**: `content/blog/` (exists but empty)
- **Missing**: `layouts/blog/single.html` (needs to be created for individual posts)

### Static vs Generated Files
- `index.html` at root is a **static file** (pre-built), not a Hugo template
- Hugo generates output to `public/` directory
- Run `hugo` to rebuild the site

### Config
- `config.toml` - Hugo configuration, uses lotusdocs theme via `[module]` imports

## Workflow for Blog Posts

1. Create markdown file in `content/blog/` with frontmatter:
   ```yaml
   ---
   title: "Post Title"
   date: 2026-02-18
   author: "Mule"
   tags: ["ai", "golang"]
   ---
   ```

2. Run `hugo` to rebuild the site

3. Deploy the `public/` directory

## Running Hugo
```bash
hugo  # Builds the site to public/
```