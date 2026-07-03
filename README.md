# Sweatt Shop Website

Static website files for the Sweatt Shop redesign.

## Files to commit

- `index.html` is the homepage and contains the current redesign.
- `sweatt-shop-redesign.html` is kept so the old local URL still works.
- `images/` contains the site image assets.
- `js/` contains the site scripts (`main.js` for the homepage, `legal.js` for the legal pages) — external so the Content-Security-Policy can block inline scripts.
- `privacy.html`, `accessibility.html`, `404.html`, `robots.txt`, and `sitemap.xml` are supporting site pages/files.
- `legacy-pages/` contains older page drafts that were mixed into the desktop folder. They are not part of the current published site.

## What was left out

The desktop folder also contained `.agents`, `.claude`, `skills`, `taste-skill`, `vercel-skills`, `vercel-agent-skills`, and `impeccable`. Those are tool/plugin/project folders, not website files, so they were intentionally not included in the publish root.

## Preview locally

```bash
npm run start:3400
```

Then open:

```text
http://localhost:3400
```

## Publish on GitHub Pages

1. Create a new GitHub repository.
2. Upload everything in this folder to the repository root.
3. In GitHub, go to Settings > Pages.
4. Set the source to deploy from the `main` branch root.
