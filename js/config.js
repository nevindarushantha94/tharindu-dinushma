/* ==========================================================================
   WEDDING CONFIGURATION  —  the only file you need to edit.
   Everything shown on the invitation comes from here.
   ========================================================================== */
window.WEDDING_CONFIG = {

  /* ---- Website & social sharing -----------------------------------------
     url: the final public address of this invitation, e.g.
          "https://your-domain.com/"  (leave "" until it is deployed).
     Link previews (WhatsApp, Facebook, iMessage …) need ABSOLUTE addresses
     inside index.html. After deploying, run once:
          node scripts/set-site-url.js https://your-domain.com/
     (see README → Social sharing). The preview image is
     assets/social/og-image.jpg (1200×630).                                  */
  site: {
    url: "",
    shareImage: "assets/social/og-image.jpg"
  },

  /* ---- Couple ---------------------------------------------------------- */
  couple: {
    first: "Tharindu",
    and: "and",
    second: "Dinushma"
  },

  /* ---- Date & time ------------------------------------------------------
     dateTime: ISO format WITH the Sri Lanka offset (+05:30). The countdown
     and the printed date/weekday are both calculated from this one value,
     so they can never disagree.                                            */
  event: {
    dateTime: "2026-12-05T11:00:00+05:30",
    timeZone: "Asia/Colombo",
    timeText: "From 11:00 A.M. onwards"
  },

  /* ---- Venue ------------------------------------------------------------ */
  venue: {
    name: "Ranowell Hotel",
    area: "Kochchikade",
    mapsLabel: "View Location",
    // Opens the venue in Google Maps. Paste an exact "Share" link here if you
    // have one from Google Maps — it will be more precise than a search.
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ranowell+Hotel+Kochchikade"
  },

  /* ---- Couple photograph (hero) -----------------------------------------
     src: the single portrait shown in the hero. Keep it portrait (about 2:3);
     it is never cropped or stretched. Leave src empty ("") to hide it.      */
  photo: {
    src: "assets/photos/couple.jpg"
  },

  /* ---- Opening video ----------------------------------------------------
     The guest always opens the invitation themselves: the poster and a
     "Tap to Open Invitation" button are shown first, and the video is only
     loaded and played AFTER that tap — it never starts on its own.
     TO REPLACE THE VIDEO: overwrite  assets/video/opening.mp4  with your
     Google Flow video (keep the file name), or change `src` below.
     If the new file has the same name, bump `version` (1 → 2) so guests who
     already opened the site don't get the old cached video.
     Leave `src` empty ("") to skip the video: the tap then opens the
     invitation after a short elegant fallback.                              */
  video: {
    src: "assets/video/opening.mp4",
    poster: "assets/video/poster.jpg",
    version: "2",
    // Only used AFTER the guest has tapped, if the video cannot load or play:
    // the invitation then opens by itself after this many milliseconds.
    fallbackAutoOpenMs: 2500
  },

  /* ---- Background video -------------------------------------------------
     A silent, looping video behind the whole invitation. It starts as the
     opening video fades out.
     opacity: 0 (invisible) … 1 (full). Try 0.15–0.35 for a soft, elegant look.
     The footage is pre-lightened inside the file itself (see README) so it stays smooth on phones.
     Leave `src` empty ("") to turn the background video off.
     Replacing the file with the same name? bump `version`.                  */
  background: {
    src: "assets/video/background.mp4",
    poster: "assets/video/background-poster.jpg",
    version: "1",
    opacity: 0.26
  },

  /* ---- Background music --------------------------------------------------
     Starts ONLY when the guest taps "Tap to Open Invitation" (browsers block
     sound that starts on its own). It then plays continuously — through the
     opening video and the whole invitation — and loops. The floating music
     button lets guests mute / unmute.
     volume: 0 … 1 (final level after the fade-in).
     Replacing the file with the same name? bump `version`.
     Leave `src` empty ("") to turn the music (and its button) off.          */
  music: {
    src: "assets/audio/background-music.mp3",
    version: "1",
    volume: 0.6,
    fadeInMs: 2600,
    fadeOutMs: 900
  },

  /* ---- RSVP (WhatsApp) -------------------------------------------------- */
  rsvp: {
    deadlineText: "Kindly respond by 20 November 2026",
    countryCode: "94", // Sri Lanka — numbers starting with 0 are converted automatically
    // `role` is shown in the contact area below the form.
    contacts: [
      { name: "Tharindu", role: "Groom", phone: "0710842583" },
      { name: "Dinushma", role: "Bride", phone: "0763818147" }
    ]
  },

  /* ---- Wording ---------------------------------------------------------- */
  text: {
    eyebrow: "Together with their families",
    invite: "Joyfully invite you to celebrate their wedding",
    detailsEyebrow: "Save the date",
    countdownEyebrow: "Counting the days",
    countdownTitle: "Until we say “I do”",
    countdownDone: "Today is the day — see you at the celebration",
    rsvpEyebrow: "RSVP",
    rsvpTitle: "Will you join us?",
    swipe: "Swipe down",
    messageLabel: "A Little Message",
    messagePlaceholder: "Leave a little message for the couple...",
    contactEyebrow: "Prefer to reach us directly?",
    thanks: "Your presence will make our special day even more memorable.",
    withLove: "With love and gratitude,",
    rsvpWarmYes: "How wonderful — we can’t wait to celebrate with you.",
    rsvpWarmNo: "We will miss you, and thank you for letting us know.",
    rsvpReadyTitle: "Your WhatsApp message is ready.",
    rsvpReadyBody: "Please press Send to confirm your response. Your RSVP is not complete until the message is sent."
  },

  /* Tiny credit line at the very bottom. Set to "" to hide. */
  credit: "Design by Nevinda Rushantha"
};
