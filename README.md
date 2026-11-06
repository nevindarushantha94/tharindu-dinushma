# Tharindu & Dinushma — Digital Wedding Invitation

Static site (HTML + CSS + vanilla JS). No build step, no database, no paid services.

```
index.html          page markup
css/styles.css      design system, layout, animation
js/config.js        ★ ALL wedding details + video path — the only file you edit
js/logic.js         countdown / date / WhatsApp helpers (pure functions)
js/main.js          intro video, reveals, countdown, RSVP
assets/video/       opening.mp4  ← replace with the Google Flow video
                    poster.jpg   ← frame shown while the video loads
assets/botanical/   SVG leaf artwork
vercel.json         caching + security headers
```

## Replace the opening video
1. Export the Google Flow video as **MP4 (H.264), 9:16 vertical** — 1080×1920 (or 720×1280 for faster loading), no audio, ideally under ~6 MB.
2. Overwrite `assets/video/opening.mp4` (keep the name) — or point `video.src` in `js/config.js` to a new path.
3. If you kept the same file name, change `video.version` in `js/config.js` (e.g. `"1"` → `"2"`) so returning guests don't see the old cached video.
4. Optional: replace `assets/video/poster.jpg` with the first frame of the new video.

The site never depends on the video length: it moves on when the video ends, so any duration works.
Leave `video.src` as `""` to skip the video and use the elegant fallback.

## Edit details
Names, date/time, venue, map link, RSVP numbers, deadline and all wording are in `js/config.js`.
The date, weekday and countdown are all calculated from `event.dateTime` (`2026-12-05T11:00:00+05:30`).
Note: the `<title>` and social-preview tags in `index.html` also contain the names — change them there too if names ever change.

## Deploy to Vercel
- Drag the folder into https://vercel.com/new, or: `npm i -g vercel && vercel --prod` from this folder.
- Framework preset: **Other**. Build command: none. Output directory: leave empty (root).

## Test locally
`python3 -m http.server 8000` → open http://localhost:8000 (a server is needed for the video; opening the file directly may not work).
Add `#rsvp` (or any `#section`) to the URL to skip the opening video.
