# Validation report — 29 October 2026

Passed:
- Local reference validator: 3 HTML pages and 37 local file/fragment references.
- All seven partner SVGs parse as valid XML.
- Original homepage JavaScript matches the extracted source; Node syntax check passed.
- Extracted styles match the original CSS except the necessary relative poster URL adjustment.
- Both original pages retain their HTML content after extraction and structural whitespace formatting.
- All original images, SVGs, poster and MP4 are byte-for-byte identical to the supplied published source.
- Video verified with ffprobe: H.264, 1920×1080, 9.375 seconds, 6,148,259 bytes.
- No runtime references to ChatGPT Sites or source-repository hosting.
- Local legacy privacy redirect destinations exist.
- Archive CRC and per-file SHA-256 checks passed.

Not performed:
- Browser rendering/interaction checks: the environment's preview service is unavailable.
- Cloudflare deployment, GitHub push, DNS setup or real HTTP redirect/header validation.
- Live Google Maps and clipboard interaction checks.

Resolved: the obsolete cookie-information image link that returned HTTP 404 was removed from the privacy policy. The remaining policy text has not been legally reviewed.
