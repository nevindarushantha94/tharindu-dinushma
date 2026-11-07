/* Tharindu & Dinushma — invitation behaviour (v9).
   Sections: config binding · reveals · background · music · tap-to-open intro · countdown · RSVP · contacts */
(function () {
  "use strict";

  var cfg = window.WEDDING_CONFIG;
  var L = window.InviteLogic;
  if (!cfg || !L) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var main = $("#invitation");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ *
   * 1. Bind config -> DOM
   * ------------------------------------------------------------------ */
  function get(path) {
    return path.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, cfg);
  }

  function applyConfig() {
    $$("[data-cfg]").forEach(function (el) {
      var v = get(el.getAttribute("data-cfg"));
      if (v != null) el.textContent = v;
    });

    var d = L.dateParts(cfg.event.dateTime, cfg.event.timeZone);
    $("#dWeekday").textContent = d.weekday;
    $("#dDay").textContent = d.day;
    $("#dSuffix").textContent = d.suffix;
    $("#dMonth").textContent = d.month;
    $("#dYear").textContent = d.year;

    // Directions: explicit link > exact coordinates > name + address (see js/config.js → venue)
    var v = cfg.venue;
    if (!v.mapsUrl) {
      var dest = (v.coordinates && String(v.coordinates).replace(/\s+/g, "")) || v.mapsDestination || (v.name + ", " + v.area);
      v.mapsUrl = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(dest) + "&travelmode=driving";
    }
    var map = $("#mapLink");
    map.href = v.mapsUrl;

    var credit = $("#credit");
    if (cfg.credit) {
      var NS = "http://www.w3.org/2000/svg";
      var link = document.createElement(cfg.creditUrl ? "a" : "span");
      link.className = "credit__link";
      if (cfg.creditUrl) {
        link.href = cfg.creditUrl; link.target = "_blank"; link.rel = "noopener noreferrer";
        link.setAttribute("aria-label", (cfg.creditLead || "").replace("♥", "with love") + " " + cfg.credit + " — message on WhatsApp");
      }
      var lead = document.createElement("span");
      lead.className = "credit__lead";
      (cfg.creditLead || "").split("♥").forEach(function (part, i) {
        if (i) {
          var h = document.createElementNS(NS, "svg");
          h.setAttribute("viewBox", "0 0 24 24"); h.setAttribute("class", "credit__heart"); h.setAttribute("aria-hidden", "true");
          var hp = document.createElementNS(NS, "path");
          hp.setAttribute("d", "M12 21s-7.5-4.6-9.4-9.3C1.2 8.3 3 5 6.2 5c2 0 3.4 1.1 4.2 2.4h3.2C14.4 6.1 15.8 5 17.8 5 21 5 22.8 8.3 21.4 11.7 19.5 16.4 12 21 12 21Z");
          hp.setAttribute("fill", "currentColor"); h.appendChild(hp); lead.appendChild(h);
        }
        if (part) lead.appendChild(document.createTextNode(part));
      });
      var nm = document.createElement("span");
      nm.className = "credit__name";
      nm.appendChild(document.createTextNode(cfg.credit));
      if (cfg.creditUrl) {
        var w = document.createElementNS(NS, "svg");
        w.setAttribute("viewBox", "0 0 24 24"); w.setAttribute("class", "credit__wa"); w.setAttribute("aria-hidden", "true");
        var wp = document.createElementNS(NS, "path");
        wp.setAttribute("d", "M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.9 9.9 0 0 0 4.75 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.1c-.24.68-1.42 1.3-1.96 1.35-.5.05-1.13.07-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.79-4.17-4.93-4.36-.14-.19-1.18-1.57-1.18-3s.75-2.12 1.01-2.41c.26-.29.57-.36.76-.36h.55c.18 0 .42-.07.65.5.24.58.82 2.01.89 2.16.07.14.12.31.02.5-.1.19-.14.31-.29.48-.14.17-.3.38-.43.51-.14.14-.29.29-.12.58.17.29.74 1.22 1.59 1.97 1.09.97 2.01 1.27 2.3 1.41.29.14.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.38-.24.65-.14.26.1 1.68.79 1.97.94.29.14.48.22.55.34.07.12.07.7-.17 1.38Z");
        wp.setAttribute("fill", "currentColor"); w.appendChild(wp); nm.appendChild(w);
      }
      link.appendChild(lead); link.appendChild(nm);
      credit.textContent = ""; credit.appendChild(link);
    } else credit.hidden = true;

    // Closing line: venue · date (from the same settings as everything else)
    var cl = $("#closingLine");
    if (cl) {
      if (cfg.closingLine === false) cl.hidden = true;
      else cl.textContent = cfg.venue.name + "  ·  " + d.day.toString().padStart(2, "0") + " . " + (new Date(cfg.event.dateTime).toLocaleString("en-GB", { month: "2-digit", timeZone: cfg.event.timeZone })) + " . " + d.year;
    }

    $("#heroDate").textContent = d.weekday + ", " + d.day + " " + d.month + " " + d.year;

    // Hero photograph: path comes from config; hide the frame if unset or missing.
    var fig = $("#portrait"), img = $("#portraitImg");
    if (!cfg.photo || !cfg.photo.src) { fig.remove(); }
    else {
      img.addEventListener("error", function () { fig.remove(); });
      if (img.getAttribute("src") !== cfg.photo.src) img.src = cfg.photo.src;
    }

    var ph = get("text.messagePlaceholder");
    if (ph) $("#guestMessage").placeholder = ph;
    var nph = get("text.namePlaceholder");
    if (nph) $("#guestName").placeholder = nph;

    // Keep share/canonical URLs in step with config (crawlers read index.html itself — see README).
    if (cfg.site && cfg.site.url) {
      var base = cfg.site.url.replace(/\/?$/, "/");
      var set = function (sel, val) { var el = $(sel); if (el) el.setAttribute(el.tagName === "LINK" ? "href" : "content", val); };
      set('link[rel="canonical"]', base);
      set('meta[property="og:url"]', base);
    }

    document.title = cfg.couple.first + " & " + cfg.couple.second + " · Wedding Invitation";
  }

  /* ------------------------------------------------------------------ *
   * 2. Scroll reveals
   * ------------------------------------------------------------------ */
  var revealsStarted = false;
  var bgCtl = null; // set by initBackground()
  var musicCtl = null; // set by initMusic()

  // Wait (briefly) for the three type families, so the names never appear in a fallback face.
  function afterFonts(cb) {
    var done = false;
    function go() { if (!done) { done = true; cb(); } }
    if (!(document.fonts && document.fonts.load)) { go(); return; }
    Promise.all([
      document.fonts.load('400 1em "Pinyon Script"'),
      document.fonts.load('500 1em "Cormorant Garamond"'),
      document.fonts.load('italic 500 1em "Cormorant Garamond"'),
      document.fonts.load('400 1em "Jost"')
    ]).then(go, go);
    setTimeout(go, 1200);   // never hold the invitation back for fonts
  }

  function startReveals() {
    if (revealsStarted) return;
    revealsStarted = true;
    // The background video is requested and started only now, when the invitation is revealed.
    if (bgCtl) bgCtl.start();
    var hero = $(".hero");
    var els = $$(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      if (hero) hero.classList.add("is-in");
      return;
    }
    // The hero is on screen the moment the intro ends: it plays as one staggered sequence (--d).
    var heroEls = els.filter(function (el) { return el.closest(".hero"); });
    els = els.filter(function (el) { return !el.closest(".hero"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) { io.observe(el); });
    afterFonts(function () {
      if (hero) hero.classList.add("is-in");          // 1 · the atmosphere
      requestAnimationFrame(function () {
        heroEls.forEach(function (el) { el.classList.add("in"); });   // 2 · photo, names, statement, date
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * 2b. Looping background video (loads + starts when the invitation is revealed)
   * ------------------------------------------------------------------ */
  function initBackground() {
    var c = cfg.background;
    var bg = $("#bg");
    var v = $("#bgVideo");
    if (!bg || !v) return null;
    if (!c || !c.src) { bg.remove(); return null; }

    function versioned(url) {
      return url + (c.version ? (url.indexOf("?") > -1 ? "&" : "?") + "v=" + encodeURIComponent(c.version) : "");
    }
    if (typeof c.opacity === "number") bg.style.setProperty("--bg-opacity", c.opacity);

    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true;
    v.setAttribute("playsinline", ""); v.setAttribute("webkit-playsinline", "");
    if (c.poster) v.poster = versioned(c.poster);
    // Missing/broken file: quietly fall back to the plain ivory page.
    v.addEventListener("error", function () { bg.remove(); });

    // The file is requested only when the invitation is revealed (start() -> load()), so it can
    // never compete with the opening poster or the opening video; it is played from the same moment.
    var loaded = false, on = false;
    function load() {
      if (loaded) return;
      loaded = true;
      v.preload = "auto";
      v.src = versioned(c.src);
    }
    function play() {
      if (reduceMotion) return; // reduced motion: keep the still poster
      var p = v.play();
      if (p && p.catch) p.catch(function () { /* autoplay blocked: poster stays visible */ });
    }
    document.addEventListener("visibilitychange", function () {
      if (!on) return;
      if (document.hidden) v.pause(); else play();
    });
    return {
      load: load,
      start: function () { load(); on = true; bg.classList.add("is-on"); play(); }
    };
  }

  /* ------------------------------------------------------------------ *
   * 2c. Background music (one <audio>, started by the guest's tap)
   *     - never autoplays; the first play() happens inside the tap
   *     - fades in / out; mute = fade out + pause, unmute = resume + fade in
   *     - the same element keeps playing through the intro -> invitation
   *       change, so it is never restarted or duplicated
   *     - iOS Safari ignores audio.volume, so there the fade goes through a
   *       Web Audio gain node; if that is unavailable it simply plays at full
   * ------------------------------------------------------------------ */
  function initMusic() {
    var c = cfg.music;
    var audio = $("#bgMusic");
    var btn = $("#musicBtn");
    if (!audio || !btn) return null;
    if (!c || !c.src) { audio.remove(); btn.remove(); return null; }

    var target = typeof c.volume === "number" ? Math.max(0, Math.min(1, c.volume)) : 0.6;
    var fadeIn = c.fadeInMs > 0 ? c.fadeInMs : 2600;
    var fadeOut = c.fadeOutMs > 0 ? c.fadeOutMs : 900;
    var wantOn = false;      // the guest's intent: music on (true) or muted (false)
    var loaded = false, failed = false;
    var level = 0;           // current fade level, 0..1 (multiplied by `target`)
    var fadeId = 0;
    var ctx = null, gain = null, useGain = false;

    function versioned(url) {
      return url + (c.version ? (url.indexOf("?") > -1 ? "&" : "?") + "v=" + encodeURIComponent(c.version) : "");
    }

    // Does this browser honour audio.volume? (iOS Safari does not.)
    var volumeWorks = (function () {
      try { audio.volume = 0.5; var ok = Math.abs(audio.volume - 0.5) < 0.01; audio.volume = 1; return ok; }
      catch (e) { return false; }
    })();

    function setLevel(v) {
      level = Math.max(0, Math.min(1, v));
      var out = level * target;
      if (useGain && gain) gain.gain.value = out;
      else if (volumeWorks) audio.volume = out;
    }

    // Smooth (sine) fade of `level` to `to` over `ms`.
    function fadeTo(to, ms, done) {
      var id = ++fadeId, from = level, t0 = performance.now();
      if (!(ms > 0) || from === to) { setLevel(to); if (done) done(); return; }
      (function step(now) {
        if (id !== fadeId) return;                       // a newer fade took over
        var k = Math.min(1, (now - t0) / ms);
        setLevel(from + (to - from) * (0.5 - 0.5 * Math.cos(Math.PI * k)));
        if (k < 1) requestAnimationFrame(step); else if (done) done();
      })(t0);
    }

    // Small "Music on / off" label that appears beside the button for a moment.
    var hintEl = $("#musicHint"), hintTimer = 0;
    function hint(on, ms, delay) {
      if (!hintEl) return;
      clearTimeout(hintTimer);
      hintTimer = setTimeout(function () {
        if (!btn.classList.contains("is-visible")) return;
        hintEl.textContent = (cfg.text && (on ? cfg.text.musicOn : cfg.text.musicOff)) || (on ? "Music on" : "Music off");
        hintEl.classList.add("is-shown");
        hintTimer = setTimeout(function () { hintEl.classList.remove("is-shown"); }, ms || 2200);
      }, delay || 0);
    }

    function setUi(on) {
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.setAttribute("aria-label", on ? "Mute music" : (loaded ? "Unmute music" : "Play background music"));
      btn.title = on ? "Mute music" : (loaded ? "Unmute music" : "Play background music");
    }

    // iOS: route the element through a gain node so the fade is audible.
    function setupGain() {
      if (volumeWorks || useGain) return;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        ctx = new AC();
        var src = ctx.createMediaElementSource(audio);
        gain = ctx.createGain();
        gain.gain.value = 0;
        src.connect(gain); gain.connect(ctx.destination);
        useGain = true;
      } catch (e) { ctx = null; gain = null; useGain = false; }
    }
    function wake() { if (ctx && ctx.state !== "running" && ctx.resume) { try { ctx.resume(); } catch (e) {} } }

    function giveUp() {            // file missing / blocked: leave the invitation silent, but intact
      failed = true; wantOn = false;
      btn.hidden = true; btn.classList.remove("is-visible");
    }
    audio.addEventListener("error", function () { if (loaded) giveUp(); });

    function play() {
      if (failed) return;
      if (!loaded) {
        loaded = true;
        audio.loop = true;
        audio.preload = "auto";
        audio.src = versioned(c.src);
      }
      setupGain();
      wake();
      setLevel(level);                                   // apply the current level to the fresh output path
      var p = audio.play();
      var started = function () {
        if (!wantOn) return;                             // guest muted again while it was starting
        fadeTo(1, fadeIn);
      };
      if (p && p.then) {
        p.then(started, function () {
          // Blocked or failed: stay silent, show the control as "off" so a tap can try again.
          wantOn = false; setUi(false);
        });
      } else started();
    }

    function on() {
      if (failed) return;
      wantOn = true; setUi(true);
      if (!loaded) level = 0;
      play();
    }
    function off() {
      wantOn = false; setUi(false);
      fadeTo(0, fadeOut, function () { if (!wantOn) { try { audio.pause(); } catch (e) {} } });
    }

    btn.addEventListener("click", function () { if (wantOn) { off(); hint(false, 1800); } else { on(); hint(true, 1800); } });

    // Respect the device: pause when the page is hidden, pick up again (if still wanted) when it returns.
    document.addEventListener("visibilitychange", function () {
      if (failed || !loaded) return;
      if (document.hidden) { try { audio.pause(); } catch (e) {} }
      else if (wantOn) {
        wake();
        var p = audio.play();
        if (p && p.catch) p.catch(function () { wantOn = false; setUi(false); });
      }
    });

    setUi(false);
    return {
      start: on,                                         // called from the "Tap to Open Invitation" tap
      showControl: function () {
        if (failed) return;
        btn.hidden = false;
        requestAnimationFrame(function () { requestAnimationFrame(function () { btn.classList.add("is-visible"); }); });
        if (wantOn) hint(true, 3200, 1500);   // first time the control appears: say that the music is playing
      }
    };
  }

  /* ------------------------------------------------------------------ *
   * 3. Opening video
   *    - the poster is in the markup, so it is the first thing painted
   *    - once the poster has painted, the video is prepared quietly in the background
   *      (src assigned ONCE, preload="auto", never autoplay) so it is usually buffered
   *      before the guest taps
   *    - the tap calls video.play() immediately — no timers, no waiting
   *    - the poster stays until real frames are painted; a slow connection just shows
   *      the poster a little longer, never a blank screen
   * ------------------------------------------------------------------ */
  function initIntro() {
    var intro = $("#intro");
    if (!intro) { startReveals(); if (musicCtl) musicCtl.showControl(); return; }

    // Deep link (e.g. #rsvp) or JS-less state: skip the opening.
    if (!root.classList.contains("intro-active")) {
      intro.remove();
      startReveals();
      if (musicCtl) musicCtl.showControl();
      return;
    }

    main.inert = true;

    var video = $("#introVideo");
    var poster = $("#introPoster");
    var openBtn = $("#introOpen");
    var label = $(".intro__open-label", openBtn);
    var skipBtn = $("#introSkip");
    var cfgV = cfg.video || {};
    var opened = false;    // the guest has tapped (set once — blocks duplicate taps)
    var prepared = false;  // the video source has been assigned (exactly once)
    var failed = false;    // the video file errored before the tap
    var started = false;   // the video is really rendering frames
    var finished = false;
    var timers = {};

    function versioned(url) {
      if (!url) return "";
      return url + (cfgV.version ? (url.indexOf("?") > -1 ? "&" : "?") + "v=" + encodeURIComponent(cfgV.version) : "");
    }
    function clearAll() { Object.keys(timers).forEach(function (k) { clearTimeout(timers[k]); }); }

    /* Move on to the invitation. Only ever reached after the guest's tap
       (video ended / video failed / reduced-motion), or via the Skip button. */
    function finish() {
      if (finished) return;
      finished = true;
      clearAll();
      intro.classList.add("is-leaving");
      root.classList.remove("intro-active");
      main.inert = false;
      window.scrollTo(0, 0);
      startReveals();
      if (musicCtl) musicCtl.showControl();
      setTimeout(function () {
        try { video.pause(); video.removeAttribute("src"); video.load(); } catch (e) {}
        intro.remove();
      }, reduceMotion ? 50 : 1500);
    }

    /* Elegant fallback (video missing / unplayable). The guest has already tapped,
       so opening automatically after a short pause respects their choice. */
    function fallback() {
      if (finished) return;
      intro.classList.add("is-fallback", "is-playing");
      if (musicCtl) musicCtl.showControl();
      try { video.pause(); } catch (e) {}
      timers.fallback = setTimeout(finish, cfgV.fallbackAutoOpenMs > 0 ? cfgV.fallbackAutoOpenMs : 2500);
    }

    /* The video is rendering: only now does the poster (and button) fade away. */
    function revealVideo() {
      if (started || finished) return;
      started = true;
      clearTimeout(timers.stall);
      clearTimeout(timers.slow);
      intro.classList.add("is-playing");
      if (musicCtl) musicCtl.showControl();
      if (isFinite(video.duration) && video.duration > 0) {
        // Safety net: if "ended" never fires, move on shortly after the clip should be over.
        timers.watchdog = setTimeout(finish, Math.max(0, video.duration - video.currentTime) * 1000 + 2500);
      }
      timers.skip = setTimeout(function () { intro.classList.add("show-skip"); }, 1200);
    }

    /* ---- Poster: already in the markup; JS only corrects it if the config points elsewhere ---- */
    if (cfgV.poster) {
      poster.addEventListener("error", function () { intro.classList.add("no-poster"); });
      var wanted = versioned(cfgV.poster);
      if (poster.getAttribute("src") !== wanted) poster.src = wanted;
    } else {
      intro.classList.add("no-poster");
    }

    /* ---- Prepare the video (no playback): assign the source once, let the browser buffer ---- */
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.removeAttribute("autoplay");

    function prepare() {
      if (prepared || !cfgV.src || reduceMotion) return;
      prepared = true;
      video.preload = "auto";
      video.src = versioned(cfgV.src);   // the only place the source is ever assigned
    }

    // Respect "Data Saver" / very slow links: don't pre-fetch there; the tap will load it.
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var thrifty = !!(conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || "")));

    function whenPosterPainted(cb) {
      var fired = false;
      function go() { if (fired) return; fired = true; cb(); }
      if (poster.complete && poster.naturalWidth) go();
      else { poster.addEventListener("load", go); poster.addEventListener("error", go); }
      setTimeout(go, 2500);   // a missing poster must not hold the preparation back
    }
    if (!thrifty) {
      whenPosterPainted(function () {
        // two frames: the poster and the button are on screen before any video bytes are requested
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            if ("requestIdleCallback" in window) requestIdleCallback(prepare, { timeout: 1200 });
            else setTimeout(prepare, 150);
          });
        });
      });
    }

    /* ---- Video events (attached once; they matter only after the tap) ---- */
    video.addEventListener("playing", function onPlaying() {
      video.removeEventListener("playing", onPlaying);
      if (!opened) return;
      // Wait for a real painted frame where the browser can tell us (so the poster
      // never fades onto a blank video); otherwise "playing" is good enough.
      if (video.requestVideoFrameCallback) {
        var done = false;
        var go = function () { if (!done) { done = true; revealVideo(); } };
        video.requestVideoFrameCallback(go);
        setTimeout(go, 600);
      } else {
        revealVideo();
      }
    });
    video.addEventListener("ended", function () { if (opened) finish(); });
    video.addEventListener("error", function () {
      failed = true;
      if (!opened) return;                 // before the tap: remembered, handled by the tap
      if (started) finish(); else fallback();
    });
    video.addEventListener("waiting", function () {
      if (started) { clearTimeout(timers.wait); timers.wait = setTimeout(finish, 7000); } // long stall mid-video
    });
    video.addEventListener("playing", function () { clearTimeout(timers.wait); });

    /* ---- The tap ---- */
    openBtn.addEventListener("click", function () {
      if (opened) return;           // no duplicate clicks / repeated playback
      opened = true;
      try { if (navigator.vibrate) navigator.vibrate(14); } catch (e) {}   // a tiny tap on Android; ignored elsewhere
      openBtn.disabled = true;
      openBtn.setAttribute("aria-busy", "true");
      intro.classList.add("is-opening");
      if (musicCtl) musicCtl.start();   // music begins with the tap (gentle fade-in); the opening video itself is silent

      // No video configured, or the guest prefers reduced motion: skip the film.
      if (!cfgV.src || reduceMotion) { cfgV.src ? finish() : fallback(); return; }
      if (failed) { fallback(); return; }

      // Play inside the tap itself — this is what lets iOS/Android start it. If the video was
      // prepared, this starts at once; if not, the source is assigned here (still only once).
      prepare();
      var p = video.play();
      if (p && p.catch) {
        p.catch(function () { if (!started && !finished) fallback(); });
      }

      // Only if the video is slow to start does the button say so; the poster stays up meanwhile.
      timers.slow = setTimeout(function () {
        if (started || finished) return;
        label.textContent = "Opening\u2026";
        intro.classList.add("is-slow");
      }, 900);
      // Never leave the guest waiting for ever. A video that is still downloading gets one extension.
      var lastEnd = 0;
      (function watch(round) {
        timers.stall = setTimeout(function () {
          if (started || finished) return;
          var end = video.buffered && video.buffered.length ? video.buffered.end(video.buffered.length - 1) : 0;
          if (round < 2 && end > lastEnd) { lastEnd = end; watch(round + 1); return; }
          fallback();
        }, 8000);
      })(0);
    });

    // Skip is offered only once the film is playing; Escape works the same way.
    skipBtn.addEventListener("click", function () { if (opened) finish(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && opened && !finished) finish();
    });

    // Test/diagnostic hook (read-only state; no effect on behaviour)
    window.__intro = { state: function () {
      return { prepared: prepared, opened: opened, started: started, finished: finished, failed: failed,
               readyState: video.readyState, networkState: video.networkState, paused: video.paused,
               hasSrc: !!video.getAttribute("src") };
    } };
  }

  /* ------------------------------------------------------------------ *
   * 4. Countdown
   * ------------------------------------------------------------------ */
  /* Small "Scroll" hints at the end of the first sections: they appear once their section has
     been revealed and fade away as soon as the guest scrolls on. */
  function initScrollCues() {
    var cues = $$(".cue");
    if (!cues.length) return;
    var armed = [];
    function arm(c) {
      if (c._armed) return; c._armed = true;
      c._y = window.pageYOffset || document.documentElement.scrollTop || 0;
      armed.push(c);
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (e) { if (e.isIntersecting) { arm(e.target); io.unobserve(e.target); } });
      }, { threshold: 0.9 });
      cues.forEach(function (c) { io.observe(c); });
    } else cues.forEach(arm);
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var y = window.pageYOffset || document.documentElement.scrollTop || 0;
        armed.forEach(function (c) { if (Math.abs(y - c._y) > 70) c.classList.add("is-gone"); });
      });
    }, { passive: true });
  }

  function initCountdown() {
    var target = new Date(cfg.event.dateTime).getTime();
    var box = $("#countdown");
    var units = {
      days: $('[data-unit="days"]'),
      hours: $('[data-unit="hours"]'),
      minutes: $('[data-unit="minutes"]'),
      seconds: $('[data-unit="seconds"]')
    };
    var done = $("#countdownDone");
    var last = {};
    var phase = 0;           // 0 waiting to be seen · 1 counting up · 2 live
    var latest = null;       // newest numbers, kept while the count-up plays

    function render() {
      var p = L.countdownParts(target, Date.now());
      if (p.done) {
        phase = 2;
        box.classList.add("is-done");
        done.hidden = false;
        Object.keys(units).forEach(function (k) { units[k].textContent = "00"; });
        clearInterval(timer);
        return;
      }
      var nums = { days: p.days, hours: p.hours, minutes: p.minutes, seconds: p.seconds };
      var vals = {
        days: L.pad(p.days, 2),
        hours: L.pad(p.hours),
        minutes: L.pad(p.minutes),
        seconds: L.pad(p.seconds)
      };
      if (phase < 2) { latest = nums; return; }       // numbers are written by the count-up until it ends
      Object.keys(vals).forEach(function (k) {
        if (last[k] === vals[k]) return;
        units[k].textContent = vals[k];
        if (last[k] !== undefined && !reduceMotion && units[k].animate) {
          units[k].animate(
            [{ opacity: 0.25, transform: "translateY(-7px)" }, { opacity: 1, transform: "translateY(0)" }],
            { duration: 420, easing: "cubic-bezier(.22,.61,.36,1)" }
          );
        }
        last[k] = vals[k];
      });
    }

    // The numbers count up from zero once, the first time the countdown comes into view.
    function countUp() {
      if (phase) return;
      if (reduceMotion || !latest) { phase = 2; render(); return; }
      phase = 1;
      var t0 = performance.now(), dur = 1700;
      (function step(now) {
        var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        Object.keys(units).forEach(function (u) {
          units[u].textContent = L.pad(Math.round(latest[u] * e), u === "days" ? 2 : 2);
        });
        if (k < 1) { requestAnimationFrame(step); return; }
        phase = 2; last = {}; render();
      })(t0);
    }
    if ("IntersectionObserver" in window) {
      var seen = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { seen.disconnect(); setTimeout(countUp, 450); }
      }, { threshold: 0.4 });
      seen.observe(box);
    } else { phase = 2; }

    var timer = setInterval(render, 1000);
    render();
    document.addEventListener("visibilitychange", function () { if (!document.hidden) render(); });
  }

  /* ------------------------------------------------------------------ *
   * 5. RSVP -> WhatsApp   (staged: choose → reply + details → confirmation → send)
   *    CSS does all the motion; this code only flips data-stage / data-attendance on #rsvp.
   *    Nothing is sent until the guest presses the WhatsApp button themselves.
   * ------------------------------------------------------------------ */
  function initRsvp() {
    var section = $("#rsvp");
    var form = $("#rsvpForm");
    var sidesWrap = $("#rsvpTo");
    var nameEl = $("#guestName");
    var msgEl = $("#guestMessage");
    var statusEl = $("#rsvpStatus");
    var ready = $("#rsvpReady");
    var reopen = $("#rsvpReopen");
    var nameStep = nameEl.closest(".rsvp-step");
    var choiceBtns = $$(".rsvp-choice", form);

    var attendance = null;   // "accept" | "decline"
    var sideIndex = -1;      // index into cfg.rsvp.contacts
    var stage = "choose";    // "choose" | "details" | "confirmed"
    var revealedOnce = false;

    // "RSVP with" choices come from config (one per contact)
    var sideBtns = cfg.rsvp.contacts.map(function (c, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "rsvp-side";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", "false");
      [["rsvp-side-label", c.side || ""], ["rsvp-side-name", c.name], ["rsvp-side-role", c.role || ""]].forEach(function (p) {
        if (!p[1]) return;
        var sp = document.createElement("span");
        sp.className = p[0];
        sp.textContent = p[1];
        b.appendChild(sp);
      });
      b.addEventListener("click", function () {
        sideIndex = i;
        mark(sideBtns, b);
        hideStatus();
        maybeConfirm(true);
      });
      sidesWrap.appendChild(b);
      return b;
    });

    function mark(btns, chosen) {
      btns.forEach(function (b) { b.setAttribute("aria-checked", String(b === chosen)); });
    }
    function setStage(next) { stage = next; section.setAttribute("data-stage", next); }
    function showStatus(msg) { statusEl.textContent = msg; statusEl.hidden = false; }
    function hideStatus() { statusEl.hidden = true; statusEl.textContent = ""; }
    function clearNeedsName() { nameStep.classList.remove("needs-name"); }

    // A choice was made (or changed): acknowledge it and open the details.
    choiceBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        attendance = btn.getAttribute("data-attendance");
        mark(choiceBtns, btn);
        hideStatus();
        ready.hidden = true;
        section.setAttribute("data-attendance", attendance);
        section.setAttribute("data-tempo", revealedOnce ? "quick" : "full");
        if (stage === "choose") setStage("details");
        revealedOnce = true;
      });
    });

    // Reveal "Your place is waiting." + the WhatsApp button (nothing is sent yet).
    function confirm() {
      setStage("confirmed");
      // Nudge the page only if the button would be off-screen — never jump.
      var cta = $("#rsvpSubmit");
      var vh = window.innerHeight || document.documentElement.clientHeight || 0;
      if (cta && vh) {
        var over = cta.getBoundingClientRect().bottom - vh * 0.86;
        if (over > 0) {
          try { window.scrollBy({ top: over, left: 0, behavior: reduceMotion ? "auto" : "smooth" }); }
          catch (err) { window.scrollBy(0, over); }
        }
      }
    }

    // Choosing who to RSVP with is the last step: once a name is in, the confirmation follows.
    function maybeConfirm(fromSide) {
      if (stage !== "details" || !attendance || sideIndex < 0) return;
      if (!nameEl.value.trim()) {
        if (fromSide) { nameStep.classList.add("needs-name"); showStatus("Please add your name to continue."); }
        return;
      }
      clearNeedsName();
      hideStatus();
      if (fromSide && document.activeElement && form.contains(document.activeElement) && document.activeElement.blur) {
        document.activeElement.blur();
      }
      confirm();
    }

    nameEl.addEventListener("input", function () {
      if (nameEl.value.trim()) { clearNeedsName(); hideStatus(); }
      if (!ready.hidden) ready.hidden = true;
    });
    nameEl.addEventListener("change", function () { maybeConfirm(false) });   // side picked first: reveal once the name is done
    msgEl.addEventListener("input", function () { if (!ready.hidden) ready.hidden = true; });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var guestName = nameEl.value.replace(/\s+/g, " ").trim();
      var missing = [];
      if (guestName.length < 2) missing.push("your name");
      if (!attendance) missing.push("your attendance");
      if (sideIndex < 0) missing.push("who to RSVP with");
      if (missing.length) {
        showStatus("Please add " + missing.join(", ") + " before sending your RSVP.");
        if (guestName.length < 2) nameStep.classList.add("needs-name");
        return;
      }
      hideStatus();

      // (Enter pressed before the confirmation is showing: reveal it, send nothing yet.)
      if (stage !== "confirmed") { confirm(); return; }

      var contact = cfg.rsvp.contacts[sideIndex];
      var partner = contact.name === cfg.couple.first ? cfg.couple.second : cfg.couple.first;
      var message = L.buildMessage({
        toName: contact.name,
        partnerName: partner,
        guestName: guestName,
        attending: attendance === "accept",
        message: msgEl.value   // optional — may be blank
      });
      var url = L.buildWhatsAppUrl(L.normalizePhone(contact.phone, cfg.rsvp.countryCode), message);

      // Quiet note under the button: the message is ready, but the RSVP is not complete until it is sent.
      reopen.href = url;
      ready.hidden = false;
      ready.classList.remove("is-shown"); void ready.offsetWidth; ready.classList.add("is-shown");

      // Phones / tablets: hand off in the SAME tab so the wa.me link launches the WhatsApp app
      // (a script-opened new tab does not). Desktop: new tab, falling back to same-tab if blocked.
      var touch = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      if (touch) {
        window.location.href = url;
      } else {
        var w = window.open(url, "_blank");
        if (w) { try { w.opener = null; } catch (err) {} }
        else { window.location.href = url; }
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * 5b. Families (text only) · Save the Date · hero dust · scroll progress
   * ------------------------------------------------------------------ */
  function initFamilies() {
    var row = $("#familiesRow");
    if (!row || !cfg.families) return;
    cfg.families.forEach(function (f, i) {
      var card = document.createElement("div");
      card.className = "families__card reveal";
      card.setAttribute("data-anim", "settle");
      card.style.setProperty("--d", (0.1 + i * 0.16) + "s");
      var mk = function (cls, text) { var p = document.createElement("p"); p.className = cls; p.textContent = text; return p; };
      card.appendChild(mk("families__role", f.role || ""));
      card.appendChild(mk("families__name", f.name));
      card.appendChild(mk("families__relation", f.relation || ""));
      var par = document.createElement("p");
      par.className = "families__parents";
      String(f.parents || "").split(/\s+&\s+/).forEach(function (part, k) {
        if (k) { var amp = document.createElement("span"); amp.className = "families__amp"; amp.textContent = "&"; par.appendChild(amp); }
        par.appendChild(document.createTextNode(part));
      });
      card.appendChild(par);
      row.appendChild(card);
    });
  }

  function initSaveDate() {
    var btn = $("#saveDateBtn");
    if (!btn || !cfg.calendar) return;
    btn.addEventListener("click", function () {
      var d = L.dateParts(cfg.event.dateTime, cfg.event.timeZone);
      var place = cfg.venue.name + ", " + cfg.venue.area;
      var ics = L.buildIcs({
        startIso: cfg.event.dateTime,
        timeZone: cfg.event.timeZone,
        durationHours: cfg.calendar.durationHours,
        title: cfg.calendar.title,
        location: place,
        description: cfg.calendar.description + "\n\n" + d.weekday + ", " + d.day + " " + d.month + " " + d.year + " · " + cfg.event.timeText + "\n" + place + "\nMap: " + cfg.venue.mapsUrl + (cfg.rsvp && cfg.rsvp.deadlineText ? "\n" + cfg.rsvp.deadlineText : ""),
        url: cfg.site && cfg.site.url ? cfg.site.url : "",
        uid: (cfg.couple.first + "-" + cfg.couple.second + "-" + cfg.event.dateTime.slice(0, 10)).toLowerCase().replace(/[^a-z0-9-]+/g, "") + "@wedding-invitation",
        reminders: cfg.calendar.reminders
      });
      var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = cfg.calendar.fileName || "wedding.ics";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);

      var sub = $(".savedate__sub", btn);
      if (sub && !btn.classList.contains("is-added")) sub.setAttribute("data-was", sub.textContent);
      if (sub && cfg.text.saveDateDone) sub.textContent = cfg.text.saveDateDone;
      btn.classList.add("is-added");
      clearTimeout(btn._t);
      btn._t = setTimeout(function () {
        btn.classList.remove("is-added");
        if (sub && sub.getAttribute("data-was")) sub.textContent = sub.getAttribute("data-was");
      }, 5200);
    });
  }

  // A handful of fine gold specks drifting up through the hero; paused whenever the hero is off-screen.
  function initDust() {
    var dust = $("#heroDust");
    if (!dust || reduceMotion) return;
    for (var i = 0; i < 16; i++) {
      var sp = document.createElement("span");
      var size = 2 + Math.random() * 3.4;
      sp.style.setProperty("--l", (4 + Math.random() * 92).toFixed(1) + "%");
      sp.style.setProperty("--s", size.toFixed(1) + "px");
      sp.style.setProperty("--b", (size > 4 ? 6 : 2).toFixed(0) + "px");
      sp.style.setProperty("--o", (0.5 + Math.random() * 0.45).toFixed(2));
      sp.style.setProperty("--x", ((Math.random() - 0.5) * 70).toFixed(0) + "px");
      sp.style.setProperty("--dur", (13 + Math.random() * 12).toFixed(1) + "s");
      sp.style.setProperty("--dl", (-Math.random() * 20).toFixed(1) + "s");
      dust.appendChild(sp);
    }
    var hero = $(".hero");
    if (hero && "IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { dust.classList.toggle("is-paused", !en[0].isIntersecting); }).observe(hero);
    }
  }

  function initScrollProgress() {
    var wrap = $("#scrollProgress");
    var bar = wrap && wrap.firstElementChild;
    if (!bar) return;
    var queued = false;
    function update() {
      queued = false;
      var root = document.documentElement;
      var max = root.scrollHeight - window.innerHeight;
      var y = window.pageYOffset || root.scrollTop || 0;
      bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, Math.max(0, y / max)) : 0).toFixed(4) + ")";
      wrap.classList.toggle("on", y > 60 && !root.classList.contains("intro-active"));
    }
    window.addEventListener("scroll", function () { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ------------------------------------------------------------------ *
   * 6. Contact area (Call + WhatsApp chat for each of the couple)
   * ------------------------------------------------------------------ */
  var ICON_CALL = '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M6.6 3.5h3l1.4 4-2 1.3a11 11 0 0 0 5.2 5.2l1.3-2 4 1.4v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  var ICON_WA = '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M20 11.6A8 8 0 0 1 8.2 18.7L4 20l1.3-4A8 8 0 1 1 20 11.6Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9.2 8.6c.3 2.9 2.500 5.200 5.600 5.700l1.100-1.300-1.900-1-.9.800c-1-.4-1.800-1.200-2.200-2.200l.8-.9-1-1.900-1.500.8Z" fill="currentColor"/></svg>';

  function initContacts() {
    var grid = $("#contactGrid");
    if (!grid) return;
    cfg.rsvp.contacts.forEach(function (c, i) {
      var intl = L.normalizePhone(c.phone, cfg.rsvp.countryCode);
      var card = document.createElement("div");
      card.className = "contact__card reveal";
      card.style.setProperty("--d", (0.12 + i * 0.14) + "s");

      var name = document.createElement("p");
      name.className = "contact__name";
      name.textContent = c.name;
      var role = document.createElement("p");
      role.className = "contact__role";
      role.textContent = c.role || "";

      var actions = document.createElement("div");
      actions.className = "contact__actions";

      var call = document.createElement("a");
      call.className = "contact__link";
      call.href = "tel:+" + intl;
      call.setAttribute("aria-label", "Call " + c.name);
      call.innerHTML = ICON_CALL + "<span>Call</span>";

      var wa = document.createElement("a");
      wa.className = "contact__link";
      wa.href = "https://wa.me/" + intl;
      wa.target = "_blank";
      wa.rel = "noopener noreferrer";
      wa.setAttribute("aria-label", "Send " + c.name + " a WhatsApp message");
      wa.innerHTML = ICON_WA + "<span>WhatsApp</span>";

      actions.append(call, wa);
      card.append(name, role, actions);
      grid.appendChild(card);
    });
  }

  /* ------------------------------------------------------------------ *
   * 7. Gentle parallax — botanical details drift a few pixels against the scroll.
   *    One passive listener, one rAF per frame, only elements near the screen.
   * ------------------------------------------------------------------ */
  function initParallax() {
    if (reduceMotion || !window.requestAnimationFrame) return;
    var els = $$("[data-parallax]");
    if (!els.length) return;
    var queued = false;
    function update() {
      queued = false;
      var vh = window.innerHeight || 800;
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -240 || r.top > vh + 240) return;
        var k = parseFloat(el.getAttribute("data-parallax")) || 0.05;
        var off = (r.top + r.height / 2 - vh / 2) * k;
        el.style.setProperty("--py", Math.max(-26, Math.min(26, -off)).toFixed(1) + "px");
      });
    }
    function onScroll() { if (!queued) { queued = true; requestAnimationFrame(update); } }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* ------------------------------------------------------------------ */
  applyConfig();
  bgCtl = initBackground();
  musicCtl = initMusic();
  initCountdown();
  initRsvp();
  initFamilies();
  initSaveDate();
  initDust();
  initScrollProgress();
  initScrollCues();
  initContacts();
  initParallax();
  initIntro();
})();
