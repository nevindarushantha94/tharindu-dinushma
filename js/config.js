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

  /* ---- Families ----------------------------------------------------------
     Shown under "Before we say I do". Each entry: role, name, relation ("Son of" /
     "Daughter of") and parents. Use " & " between the parents' names.        */
  families: [
    { role: "Groom", name: "Tharindu", relation: "Son of",      parents: "Mr & Mrs Perera" },
    { role: "Bride", name: "Dinushma", relation: "Daughter of", parents: "Mr & Mrs Padhidiliyan" }
  ],

  /* ---- Save the Date (calendar booking) ----------------------------------
     The "Save the Date" button downloads a calendar file (.ics) that opens in
     Apple Calendar / Outlook / most phone calendars with the event already filled in.
     durationHours: how long the event block is (the card only says "from 11:00 A.M.").
     reminders:     daysBefore + optional `at` ("HH:MM", event time zone).
                    { daysBefore: 2 }              -> exactly two days before the start time
                    { daysBefore: 0, at: "08:00" } -> on the day itself at 8:00 AM          */
  calendar: {
    title: "Tharindu & Dinushma’s Wedding",
    fileName: "Tharindu-and-Dinushma-Wedding.ics",
    durationHours: 5,
    description: "Together with their families, Tharindu and Dinushma joyfully invite you to celebrate their wedding.",
    reminders: [
      { daysBefore: 2, message: "Two days to go! Tharindu & Dinushma’s wedding is this Saturday, 5 December — from 11:00 A.M. at Ranowell Hotel, Kochchikade." },
      { daysBefore: 0, at: "08:00", message: "Today is the day! Tharindu & Dinushma’s wedding — from 11:00 A.M. at Ranowell Hotel, Kochchikade." }
    ]
  },

  /* ---- Venue ------------------------------------------------------------ */
  venue: {
    name: "Ranowell Hotel",
    area: "Kochchikade",
    mapsLabel: "Get Directions",
    mapsSub: "Navigate in Google Maps",
    // The button opens Google's directions link: it starts navigation from the guest's own
    // location and opens the Maps app on phones. Where it points, in order of priority:
    //   1. mapsUrl       - paste a full Google Maps link here to override everything
    //   2. coordinates   - exact pin as "latitude,longitude" (most precise; right-click the
    //                      hotel in Google Maps and tap the numbers at the top to copy them)
    //   3. mapsDestination - hotel name + address (used until a pin is added)
    mapsUrl: "",
    coordinates: "7.2686897,79.8615583",   // exact pin of Ranowell Hotel (from the shared Google Maps link)
    mapsDestination: "Ranowell Hotel, 162/4 Chilaw - Colombo Main Road, Negombo"
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
    version: "5",          // bump when the video file changes (cache-busting)
    posterVersion: "5",    // poster = first frame of opening.mp4; keep in step with the ?v= in index.html
    // The opening video is ALWAYS silent (muted in code and in the file). The wedding music
    // starts at the OPEN INVITATION tap and plays straight through the film into the invitation.
    // Guests can tap anywhere on the film (or "Skip Intro") to go straight to the invitation;
    // the music is never touched by that.
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
     Starts ONLY from the guest's "Tap to Open Invitation" tap (browsers block
     sound that starts on its own): inside that tap it starts from 0:00 and plays
     under the silent opening video, then carries on — the same playback, never
     restarted — into the invitation, and loops. The floating music button lets
     guests mute / unmute (unmuting resumes from the same position).
     volume: 0 … 1 (final level after the fade-in).
     Replacing the file with the same name? bump `version`.
     Leave `src` empty ("") to turn the music (and its button) off.          */
  music: {
    src: "assets/audio/background-music.mp3",
    version: "1",
    volume: 0.6,
    fadeInMs: 900,         // short, gentle swell at the very start (the music still starts at the tap)
    fadeOutMs: 600
  },

  /* ---- RSVP (WhatsApp) -------------------------------------------------- */
  rsvp: {
    deadlineText: "Kindly respond by 20 November 2026",
    countryCode: "94", // Sri Lanka — numbers starting with 0 are converted automatically
    // `side` is the small label on the "RSVP with" choice; `role` is shown in the contact area.
    // The WhatsApp message is addressed to whoever the guest picks (see js/logic.js → buildMessage).
    contacts: [
      { name: "Tharindu", role: "Groom", side: "Groom’s Side", phone: "0710842583" },
      { name: "Dinushma", role: "Bride", side: "Bride’s Side", phone: "0763818147" }
    ]
  },

  /* ---- Wording ---------------------------------------------------------- */
  text: {
    eyebrow: "Together with their families",
    invite: "Joyfully invite you to celebrate their wedding",
    detailsEyebrow: "Join us on",
    countdownEyebrow: "Counting the days",
    countdownTitle: "Until we say “I do”",
    countdownDone: "Today is the day — see you at the celebration",
    rsvpEyebrow: "RSVP",
    rsvpTitle: "Will you join us?",
    swipe: "Swipe down",
    scrollCue: "Scroll",
    musicOn: "Music on",
    musicOff: "Music off",
    skipIntro: "Skip Intro",
    // Before we say "I do" + families
    familiesEyebrow: "Before we say",
    familiesHeading: "“I Do”…",
    familiesQuote: "From two separate journeys to one beautiful beginning — we are grateful to share this moment with the people who mean the most to us.",
    familiesTogether: "Together with our families",
    familiesInvite: "We invite you to celebrate with us as we begin this beautiful chapter together.",
    // Save the Date
    saveDate: "Save the Date",
    saveDateSub: "Add to calendar · with reminders",
    saveDateDone: "Added — reminders included",
    // RSVP — step 1: the choice
    rsvpChoiceLabel: "Will you be joining us?",
    rsvpTapHint: "Tap to reply",
    // RSVP — step 2: shown right after a choice is made, then the details open
    rsvpAcceptEcho: "We’re so happy to have you with us.",
    rsvpAcceptAsk: "May we know who’s joining us?",
    rsvpDeclineEcho: "We’ll miss celebrating this moment with you.",
    rsvpDeclineAsk: "May we know who you are?",
    nameLabel: "Your Name",
    namePlaceholder: "Enter your full name",
    messageLabel: "A Message for Tharindu & Dinushma",
    messagePlaceholder: "Write a few words…",
    optional: "(optional)",
    rsvpWithLabel: "RSVP With",
    // RSVP — step 3: confirmation, then the WhatsApp button
    rsvpAcceptTitle: "Your place is waiting.",
    rsvpAcceptSub: "Thank you for being part of this moment.",
    rsvpDeclineTitle: "Thank you for letting us know.",
    rsvpDeclineSub: "We’ll be thinking of you on our day.",
    sendLabel: "Send RSVP",
    sendSub: "via WhatsApp",
    contactEyebrow: "Prefer to reach us directly?",
    venueCaption: "Where we will celebrate",
    // RSVP confirmation (display only): {name} is the guest's first name as typed
    rsvpThankName: "Thank you, {name}",
    rsvpAcceptDetail: "We’ll see you on {date}",
    thanks: "Your presence will make our special day even more memorable.",
    withLove: "With love,",
    rsvpReadyTitle: "Your WhatsApp message is ready.",
    rsvpReadyBody: "Please press Send to confirm your response. Your RSVP is not complete until the message is sent."
  },

  /* Closing line above the credit: venue + date are taken from the settings above. Set to false to hide. */
  closingLine: true,

  /* Designer credit at the very bottom. "creditLead" shows a small heart where ♥ is written.
     The name is a tappable link that opens WhatsApp. Set `credit` to "" to hide the whole credit. */
  creditLead: "Designed with ♥ by",
  credit: "Nevinda Rushantha",
  creditUrl: "https://wa.me/94766527700"
};
