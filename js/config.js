/* ==========================================================================
   WEDDING CONFIGURATION  —  the only file you need to edit.
   Everything shown on the invitation comes from here.
   ========================================================================== */
window.WEDDING_CONFIG = {

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

  /* ---- Opening video ----------------------------------------------------
     TO REPLACE THE VIDEO: overwrite  assets/video/opening.mp4  with your
     Google Flow video (keep the file name), or change `src` below.
     If the new file has the same name, bump `version` (1 → 2) so guests who
     already opened the site don't get the old cached video.
     Leave `src` empty ("") to skip the video and show the elegant fallback. */
  video: {
    src: "assets/video/opening.mp4",
    poster: "assets/video/poster.jpg",
    version: "1",
    // If the video can't load, the invitation opens by itself after this many
    // milliseconds (set to 0 to wait for the "Open Invitation" button instead).
    fallbackAutoOpenMs: 5000
  },

  /* ---- RSVP (WhatsApp) -------------------------------------------------- */
  rsvp: {
    deadlineText: "Kindly respond by 20 November 2026",
    maxGuests: 10,
    countryCode: "94", // Sri Lanka — numbers starting with 0 are converted automatically
    contacts: [
      { name: "Tharindu", phone: "0710842583" },
      { name: "Dinushma", phone: "0763818147" }
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
    thanks: "Your presence will make our special day even more memorable.",
    withLove: "With love,"
  },

  /* Tiny credit line at the very bottom. Set to "" to hide. */
  credit: "Design by Nevinda Rushantha"
};
