# NBCS LT — GitHub / Cloudflare Pages

Complete static website export, prepared 29 October 2026. Start with [DEPLOYMENT.md](DEPLOYMENT.md).

## Quick settings

| Cloudflare Pages setting | Value |
| --- | --- |
| Project name | `nbcs-lt` (or update `wrangler.toml` to match your chosen name) |
| Production branch | `main` |
| Framework preset | None |
| Build command | `exit 0` |
| Build output directory | `public` |
| Root directory | Leave blank when this folder's contents are at the repository root |
| Environment variables | None |

No compilation, npm install, database, API key or server function is required. `public/` contains both editable source and deployment-ready files. Do not upload just the ZIP to GitHub: extract it and commit the contents of `nbcs-lt/`.

## Included

- Lithuanian home page, six non-clickable solution cards, company information.
- Seven local SVG partner logos and Dell Platinum Partner label.
- Four ISO descriptions, 14 expandable project entries.
- Contact details, copy-company-details button, bank accounts, Service Desk link.
- Google Maps embed and directions link.
- Separate complete privacy policy with expandable detail, plus a 404 page.
- Local server-room MP4 and poster; transparent NBCS logo.
- CSS and JavaScript for the 3D hero, subtle text entrance, reduced-motion support, mobile menu and video controls.
- Pages redirects and headers, Wrangler configuration, validation script and asset inventory.

## Edit and preview

- Home page: `public/index.html`
- Home styles: `public/assets/css/site.css`
- Interactions/animations: `public/assets/js/site.js`
- Privacy page: `public/privatumo-politika/index.html`
- Privacy styles: `public/assets/css/privacy.css`
- Images, logos and video: `public/assets/`

With Python 3 installed, from this folder:

```sh
python3 scripts/validate.py
python3 -m http.server 8080 --directory public
```

Open http://localhost:8080/ (Windows can use `py -3` instead of `python3`). Do not double-click HTML files: root-relative links need an HTTP server. Python's server does not implement Pages `_headers` or `_redirects`; test those after the Pages deployment. JavaScript syntax can be checked with `node --check public/assets/js/site.js` if Node.js is available.

## Export scope

Based on the latest published source commit `958c3d2578482ec2fc563e5fda3557d132e3aa0c`. Existing appearance and content are preserved; inline CSS/JS were moved into editable files. The proposed broader visual-style unification had not been implemented in that published revision and is not represented as complete in this export.

Sites-specific hosting identifiers, Git history, credentials, temporary downloads and unrelated source uploads are intentionally excluded. The exported website has no dependency on ChatGPT Sites. This package does not create a GitHub repository, deploy anything, change DNS or transfer the nbcs.lt domain.

## External services and one known legacy link

Google Maps remains an online third-party embed. Directions, `https://pagalba.nbcs.lt`, email and telephone links still open their corresponding external services. The rest of the site's visual assets are local.

The supplied privacy-policy text links to `https://nbcs.lt/wp-content/uploads/2021/09/slap.png`. That legacy cookie-information image returned HTTP 404 during packaging, so it could not be included. Its original link and policy text are preserved. Replace that link with a recovered local image or updated policy material before going live; do not expect switching DNS to restore that WordPress file. The policy's supplied last-updated date (2021-09-13) is unchanged.

The copy button uses the Clipboard API over HTTPS with an existing manual-copy fallback. Autoplay depends on browser settings; the poster is included as fallback. This is a static presentation site, not an implementation of the external Service Desk.

## Verification

See `VALIDATION.md` for the performed checks and remaining browser/deployment checks. See `ASSETS.md` for asset provenance. `SHA256SUMS.txt` records the packaged files (excluding itself).
