# Deploy NBCS LT through GitHub to Cloudflare Pages

## 1. Put the extracted project in GitHub

Create an empty GitHub repository, for example `nbcs-lt`. In a terminal, enter the extracted `nbcs-lt` folder (the one containing `public/` and `wrangler.toml`). Replace `YOUR_ACCOUNT` below:

```sh
git init
git add .
git commit -m "Prepare NBCS LT for Cloudflare Pages"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/nbcs-lt.git
git push -u origin main
```

A private repository is supported. If using GitHub's web uploader instead, upload the extracted folder's contents, including the contents of `public/`, not the ZIP itself. Ensure `wrangler.toml` is at repository root. No Git LFS is needed for the included approximately 6 MB video.

## 2. Connect Cloudflare Pages

1. Open Cloudflare **Workers & Pages** and choose **Create application → Pages → Connect to Git / Import an existing Git repository**.
2. Authorize the GitHub integration for your repository and select it.
3. Choose production branch `main`, project name `nbcs-lt`, framework **None**, build command `exit 0`, output directory `public`, and leave root directory empty.
4. No environment variables or secrets are needed. Select **Save and Deploy**.
5. Open the resulting `https://YOUR_PROJECT.pages.dev` URL.

This is a **Pages** project, not a Worker application. `wrangler.toml` declares the same `public` output directory. If the name `nbcs-lt` is unavailable, choose another name and update the `name` field in that file to match. Git provider and production-branch selection are done in the dashboard; the file does not authorize GitHub access.

The source is already deployable static HTML; `exit 0` is intentionally a no-op. Future pushes to `main` trigger production deployments through the native integration. A GitHub Actions deployment workflow is not needed. Non-production branches can receive preview deployments according to your Pages settings.

## 3. Check the Pages URL

- Home page, local logos, video poster and playback/pause.
- Mouse-reactive 3D title and entrance animation; reduced-motion setting.
- Mobile navigation and section links, including the privacy footer link.
- Every expandable project and the expand-all control.
- Copy details over HTTPS; verify pasted line breaks and account numbers.
- Maps and directions; email, phone and Service Desk links.
- `/privatumo-politika/` and the old `/index.php/privatumo_politika/` redirect.
- A nonexistent path should show the custom 404 page.

Browser layout, Maps loading and clipboard behavior still require this live check. No Cloudflare deployment was created while preparing the archive.

## 4. Connect nbcs.lt when ready

In the Pages project, open **Custom domains → Set up a domain**, add `nbcs.lt`, and follow Cloudflare's DNS steps. Add `www.nbcs.lt` separately if required. For an apex domain, Cloudflare's documented setup requires the domain to be a zone in the same Cloudflare account using Cloudflare nameservers. Register the domain in Pages before applying the requested DNS records.

Preserve existing email MX/TXT records and the separate `pagalba.nbcs.lt` Service Desk DNS records. This export is the marketing site only. Keep the old website available until the Pages preview is accepted. After activation, verify HTTPS and both chosen hostnames. If one hostname should redirect to the other, configure that explicitly in Cloudflare after both domains are attached.

Cloudflare Pages publishes a public website by default; the previous ChatGPT Sites owner-only access does not migrate. Use Cloudflare Access separately if you need a restricted staging site. A private GitHub repository alone does not restrict website visitors.

## Troubleshooting

- **Missing home page:** output directory must be `public`, not repository root.
- **Missing images:** keep all of `public/assets/`; paths are case-sensitive.
- **Missing files after upload:** extract the ZIP first; don't commit a ZIP as the website.
- **Nested repository folder:** move its contents to the repository root, or set Cloudflare's root directory to that folder.
- **Video does not autoplay:** browser policy or reduced-motion preference may prevent playback; use the playback control.
- **Privacy policy:** the obsolete cookie-image link has been removed; review the remaining policy against actual site behavior.
- **Redirects don't work locally:** Python's static server doesn't interpret Pages rules.

## Official references (checked 29 October 2026)

- https://developers.cloudflare.com/pages/get-started/git-integration/
- https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- https://developers.cloudflare.com/pages/functions/wrangler-configuration/
- https://developers.cloudflare.com/pages/configuration/redirects/
- https://developers.cloudflare.com/pages/configuration/headers/
- https://developers.cloudflare.com/pages/configuration/custom-domains/
