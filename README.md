# Tharindu & Dinushma — Digital Wedding Invitation

Static site (HTML + CSS + vanilla JS). No build step, no database, no paid services.

```
index.html          page markup
css/styles.css      design system, layout, animation
js/config.js        ★ ALL wedding details + video path — the only file you edit
js/logic.js         countdown / date / WhatsApp helpers (pure functions)
js/main.js          tap-to-open intro, reveals, countdown, RSVP, contacts
scripts/set-site-url.js   makes social-share tags absolute once you have your domain
assets/social/      og-image.jpg  ← 1200×630 link-preview image
assets/video/       opening.mp4            ← opening video (Google Flow)
                    poster.jpg             ← frame shown while the opening video loads
                    background.mp4         ← looping forest background (silent)
                    background-poster.jpg  ← still frame used if the background can't play
assets/audio/       background-music.mp3   ← background music (128 kbps, plays after the guest taps open)
assets/botanical/   divider.svg (sprig divider) · sprig.svg (single eucalyptus sprig ornament)
vercel.json         caching + security headers
```

## v9 — premium experience refinement

- **Immediate opening:** the poster is in the HTML; once it has painted, the 2.48 MB opening video is prepared quietly (`preload="auto"`, source assigned once, never autoplay). The tap calls `video.play()` straight away. The poster stays until real frames are painted. On Data Saver / 2G the pre-fetch is skipped and the tap loads it.
- **Bandwidth:** the background video is requested only when the invitation is revealed (via the existing background controller), never at the tap. Music still starts only after the tap.
- **Typography:** self-hosted Bodoni Moda / Cormorant Garamond / Jost; Pinyon Script removed.
- **Motion:** a small system of different movements per element (mask rise for names, photo settle, line draw, divider unfold, sequential countdown, focus-in RSVP title, staggered form), all opacity/transform; botanicals sway very slightly; everything is switched off for `prefers-reduced-motion`.
- **Photo:** original file untouched; a light warm grade and faint ivory matte are applied in CSS (`.portrait__photo`).
- **RSVP micro-interactions:** sweep-fill choices, growing input underline, nudge + eased error message, staggered confirmation.

## Design refinements (v8)
Everything is layered on the existing design; no content, assets or RSVP flow changed.
- **Hero:** larger names, soft champagne glow behind the portrait. Shorter screens get a tighter hero so *Swipe down* stays in view.
- **Botanicals:** the two sprigs and the closing sprig sway slowly and drift a few pixels with the scroll (`data-parallax` in `index.html`, `initParallax()` in `js/main.js`). Switched off for guests with *reduce motion*.
- **Countdown:** framed by fine gold rules.
- **RSVP:** selected attendance shows a small champagne tick; an invalid field is marked in a soft red and nudges once; after WhatsApp opens, a warm line is shown above the *press Send* note (`text.rsvpWarmYes / rsvpWarmNo` in `js/config.js`). The note still says the RSVP is not complete until the guest presses Send.
- **Closing:** the signature is revealed as if written.
- **Desktop (≥ 900px):** the invitation sits in an ivory paper column over the forest.
- The opening poster is also preloaded in `index.html` — keep its `?v=` equal to `video.version`.
- The opening button now has a solid ivory backing (the `.btn` rule used to make it transparent).

## Background music
`assets/audio/background-music.mp3` (settings in `js/config.js → music`).
- It **never autoplays**. It starts only when the guest taps **Tap to Open Invitation**, with a gentle fade-in, together with the opening video (the video's own sound is ignored — it is muted).
- The same audio keeps playing, without restarting, when the opening video ends and while the guest scrolls; it loops.
- A small floating button (bottom-right, above the phone's safe area) mutes / unmutes with a fade. Muting pauses the audio quietly; unmuting resumes from the same place. Music also pauses while the page is hidden (tab switch / screen lock) and resumes when it returns.
- For links that skip the opening (e.g. `…/#rsvp`) the button appears switched off; tapping it starts the music.
- `volume` (0–1), `fadeInMs`, `fadeOutMs` can be changed in `js/config.js`. Replacing the file under the same name? Bump `music.version`. Set `music.src` to `""` to remove the music and its button.
- iPhone Safari ignores `audio.volume`, so there the fade goes through a Web Audio gain node; if that is unavailable the music simply plays at full volume without a fade.

## Couple photograph
The single hero portrait is `assets/photos/couple.jpg` (path in `js/config.js → photo.src`). It is shown whole (never cropped or stretched) at its own 2:3 shape as a printed photograph: thin champagne-gold frame, ivory mat, fine hairline around the print and a soft shadow. To change it, overwrite the file with another portrait photo of about the same shape; set `photo.src` to `""` to hide it.

## How the opening works
1. The poster (`video.poster`) and a **Tap to Open Invitation** button appear straight away.
2. The video is not loaded or played until the guest taps. It starts from the beginning; the poster fades only once frames are really rendering; when it ends, the invitation appears.
3. If the video can't load/play (or `video.src` is `""`), the elegant names fallback shows and — because the guest has already tapped — the invitation opens after `video.fallbackAutoOpenMs`.
4. Guests with "reduce motion" switched on skip the film: the tap opens the invitation directly.
5. Links that point at a section (e.g. `…/#rsvp`) skip the opening, which is handy for testing.

## Replace the opening video
1. Export the Google Flow video as **MP4 (H.264), 9:16 vertical** — 1080×1920 (or 720×1280 for faster loading), no audio, ideally under ~6 MB.
2. Overwrite `assets/video/opening.mp4` (keep the name) — or point `video.src` in `js/config.js` to a new path.
3. If you kept the same file name, change `video.version` in `js/config.js` (e.g. `"1"` → `"2"`) so returning guests don't see the old cached video.
4. Optional: replace `assets/video/poster.jpg` with the first frame of the new video.

The site never depends on the video length: it moves on when the video ends, so any duration works.
Leave `video.src` as `""` to skip the video and use the elegant fallback.

## RSVP & contacts
The form (name → attendance → optional *A Little Message* → who to send to → button) collects only the guest's name, attendance and the optional message; it opens a pre-filled WhatsApp chat with the chosen person (Tharindu / Dinushma). After the guest sends the form, WhatsApp opens with the message pre-filled and a quiet note appears under the button (*"Your WhatsApp message is ready. Please press Send to confirm your response."*) — the RSVP is only complete once the guest presses Send in WhatsApp. The wording is in `js/config.js → text.rsvpReadyTitle / rsvpReadyBody`. Below the form, each of them has a compact **Call** (`tel:`) and **WhatsApp** (`wa.me`) link. Names, roles and numbers live in `js/config.js → rsvp.contacts`.

## Background video (looping)
A silent, looping video sits behind the whole invitation at low opacity. It starts fading in as the opening video fades out.
- Strength: change `background.opacity` in `js/config.js` (0.15 = very faint, 0.35 = clearly visible; currently 0.26).
- Turn it off: set `background.src` to `""`.
- If the file is missing, or the guest has "reduce motion" on, the page quietly shows a plain ivory background / still frame.
- The loop is seamless (the last second is cross-faded into the first), and the footage is pre-lightened so it reads as a soft texture. To prepare a different clip the same way (720×1280, no audio, ~11 s, seamless loop):
  ```
  ffmpeg -i source.mp4 -filter_complex "[0:v]scale=720:1280,fps=30,lutrgb=r='clip(val*1.6,0,255)':g='clip(val*1.6,0,255)':b='clip(val*1.6,0,255)',eq=saturation=0.85,split=3[h][m][t];[t]trim=start=11:end=12,setpts=PTS-STARTPTS[tail];[h]trim=start=0:end=1,setpts=PTS-STARTPTS[head];[m]trim=start=1:end=11,setpts=PTS-STARTPTS[mid];[tail][head]xfade=transition=fade:duration=1:offset=0[x];[x][mid]concat=n=2:v=1:a=0,format=yuv420p[v]" -map "[v]" -c:v libx264 -crf 27 -movflags +faststart -an assets/video/background.mp4
  ```
  (this assumes a 12-second source; adjust the trim times for other lengths). Then bump `background.version`.

## Edit details
Names, date/time, venue, map link, RSVP numbers, deadline and all wording (including the closing line `text.withLove`) are in `js/config.js`.
The date, weekday and countdown are all calculated from `event.dateTime` (`2026-12-05T11:00:00+05:30`).
Note: the `<title>` and social-preview tags in `index.html` also contain the names — change them there too if names ever change.

## Social sharing (link previews)
Title, description and the preview image (`assets/social/og-image.jpg`, 1200×630) are already set in `index.html`. Link-preview crawlers need **absolute** addresses and don't run JavaScript, so once you know your final address run, once:
```
node scripts/set-site-url.js https://your-domain.com/
```
It fills in `og:url`, `og:image`, `twitter:image`, the canonical link and `site.url` in `js/config.js`. Until then the tags hold site-relative paths (the page itself works normally). After sharing, WhatsApp/Facebook cache previews — use Facebook's Sharing Debugger to refresh.

## Deploy to Vercel
- Drag the folder into https://vercel.com/new, or: `npm i -g vercel && vercel --prod` from this folder.
- Framework preset: **Other**. Build command: none. Output directory: leave empty (root).

## Test locally
`python3 -m http.server 8000` → open http://localhost:8000 (a server is needed for the video; opening the file directly may not work).
Add `#rsvp` (or any `#section`) to the URL to skip the opening video.

## Typography
Pinyon Script for the couple's names, the "and" and the sign-off (the printed card is set in Edwardian Script ITC, a commercial font; Pinyon Script is the closest free match — to use the real thing, add your licensed `.woff2` to `assets/fonts/` and point the `--script` font stack in `css/styles.css` at it) · Cormorant Garamond for the date, venue, time, headings and statements · Jost for descriptions, labels, buttons and form fields · Bodoni Moda remains available as `--display`. All are self-hosted in `assets/fonts/` (latin subset) and declared in `css/styles.css`; no external font requests.


## RSVP flow (v10)

The RSVP is a staged flow: **choose** (Joyfully Accept / Regretfully Decline) → a warm reply appears and the details open (name, optional message, who to RSVP with) → once all three are filled, **"Your place is waiting."** and the **Send RSVP via WhatsApp** button appear. Nothing is sent until the guest presses that button and then Send inside WhatsApp.

- All wording lives in `js/config.js → text` (and `rsvp.contacts[].side` for the "RSVP with" labels).
- The WhatsApp message is written in `js/logic.js → buildMessage`: a note addressed to whichever of the couple the guest picked, e.g. *"Hello Tharindu, … I'm delighted to confirm that I'll be joining you and Dinushma for your wedding celebration. … — Guest Name"*.
- On phones the button hands off in the same tab so the WhatsApp app opens; on desktop it opens a new tab.

## What's new in v11

- **Arched hero portrait** — hairline arch with a gold diamond, gold frame, ivory mat, a slow ray of champagne light travelling round the arch, a barely-there zoom on the photo and two eucalyptus sprigs at its feet. Styles: `css/styles.css` → "Couple portrait". The photo is never cropped.
- **Before we say "I do" + Our Families** — wording in `js/config.js → text.families*`, names in `families` (Son of Mr & Mrs Perera · Daughter of Mr & Mrs Padhidiliyan).
- **Save the Date** — downloads a calendar file (`.ics`) with the event (Sat 5 Dec 2026, 11:00 A.M., Ranowell Hotel) and **two reminders**: two days before, and on the day at 8:00 AM ("Today is the day!"). Edit title, length, reminder wording and times in `js/config.js → calendar`. Apple Calendar and Outlook apply the reminders; Google Calendar may use its own default reminders instead.
- **Hero gold dust**, a **scroll hairline** along the top edge, and **corner brackets** that settle around the venue name.

## What's new in v12
- Hero and closing names: the script letters no longer peek out before their reveal animation.
- Details order: date → time → Save the Date → venue → View Location.
- "View Location" now uses the same engraved-card button as "Save the Date" (same size and look; sub-line in js/config.js → venue.mapsSub).
- Closing signature stacks as Name / & / Name on every screen size.
- "Design by Nevinda Rushantha" opens WhatsApp (js/config.js → creditUrl).

## What's new in v13
- "Save the Date" and "View Location" are now sage-green pills with ivory text and a gold glow, matching the selected "Joyfully Accept" button.

## What's new in v14
- Directions button: opens Google's directions link (navigation from the guest's location, opens the Maps app). Add the hotel's exact pin in js/config.js → venue.coordinates ("lat,lng") for full precision.
- Music button shows a small "Music on / off" label.
- The countdown numbers count up from zero once, when first seen.
- Credit: "Designed with ♥ by" over "Nevinda Rushantha" with a WhatsApp icon (tap opens WhatsApp).
- Small "Scroll" hints at the end of the first sections, a light vibration on opening (Android), and a venue · date closing line.
- Light colour scheme declared so dark-mode browsers don't recolour the form.

## What's new in v15
- Directions button now uses the hotel's exact Google Maps pin (js/config.js → venue.coordinates).
