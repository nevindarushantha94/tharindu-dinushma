/* Tharindu & Dinushma — invitation behaviour.
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

    var map = $("#mapLink");
    map.href = cfg.venue.mapsUrl;

    var credit = $("#credit");
    if (cfg.credit) credit.textContent = cfg.credit; else credit.hidden = true;

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
  function startReveals() {
    if (revealsStarted) return;
    revealsStarted = true;
    if (bgCtl) bgCtl.start();
    var els = $$(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    // Hero is on screen the moment the intro ends: reveal it directly (staggered by --d).
    els = els.filter(function (el) {
      if (el.closest(".hero")) { requestAnimationFrame(function () { el.classList.add("in"); }); return false; }
      return true;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------ *
   * 2b. Looping background video (starts when the opening video fades)
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

    // The file is only requested once the guest has tapped (so it never competes
    // with the poster), and only played when the invitation appears.
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

    btn.addEventListener("click", function () { if (wantOn) off(); else on(); });

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
      }
    };
  }

  /* ------------------------------------------------------------------ *
   * 3. Opening video
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
      intro.classList.add("is-playing");
      if (musicCtl) musicCtl.showControl();
      if (isFinite(video.duration) && video.duration > 0) {
        // Safety net: if "ended" never fires, move on shortly after the clip should be over.
        timers.watchdog = setTimeout(finish, Math.max(0, video.duration - video.currentTime) * 1000 + 2500);
      }
      timers.skip = setTimeout(function () { intro.classList.add("show-skip"); }, 1200);
    }

    /* ---- Poster: shown immediately; if it can't load, the names show instead ---- */
    if (cfgV.poster) {
      poster.addEventListener("error", function () { intro.classList.add("no-poster"); });
      poster.src = versioned(cfgV.poster);
    } else {
      intro.classList.add("no-poster");
    }

    /* ---- The tap ---- */
    openBtn.addEventListener("click", function () {
      if (opened) return;           // no duplicate clicks / repeated playback
      opened = true;
      openBtn.disabled = true;
      openBtn.setAttribute("aria-busy", "true");
      intro.classList.add("is-opening");
      label.textContent = "Opening\u2026";
      if (bgCtl) bgCtl.load();
      if (musicCtl) musicCtl.start();   // music begins with the tap (gentle fade-in), independent of the video's own sound

      // No video configured, or the guest prefers reduced motion: skip the film.
      if (!cfgV.src || reduceMotion) { cfgV.src ? finish() : fallback(); return; }

      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");

      video.addEventListener("playing", function onPlaying() {
        video.removeEventListener("playing", onPlaying);
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
      video.addEventListener("ended", finish);
      video.addEventListener("error", function () { if (started) finish(); else fallback(); });
      video.addEventListener("waiting", function () {
        if (started) { clearTimeout(timers.wait); timers.wait = setTimeout(finish, 7000); } // long stall mid-video
      });
      video.addEventListener("playing", function () { clearTimeout(timers.wait); });

      // Load + play inside the tap itself — this is what lets iOS/Android start it.
      video.currentTime = 0;
      video.preload = "auto";
      video.src = versioned(cfgV.src);
      var p = video.play();
      if (p && p.catch) {
        p.catch(function () { if (!started) fallback(); });
      }
      // Never leave the guest staring at "Opening…": give up on a video that never starts.
      timers.stall = setTimeout(function () { if (!started) fallback(); }, 8000);
    });

    // Skip is offered only once the film is playing; Escape works the same way.
    skipBtn.addEventListener("click", function () { if (opened) finish(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && opened && !finished) finish();
    });
  }

  /* ------------------------------------------------------------------ *
   * 4. Countdown
   * ------------------------------------------------------------------ */
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

    function render() {
      var p = L.countdownParts(target, Date.now());
      if (p.done) {
        box.classList.add("is-done");
        done.hidden = false;
        Object.keys(units).forEach(function (k) { units[k].textContent = "00"; });
        clearInterval(timer);
        return;
      }
      var vals = {
        days: L.pad(p.days, 2),
        hours: L.pad(p.hours),
        minutes: L.pad(p.minutes),
        seconds: L.pad(p.seconds)
      };
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

    var timer = setInterval(render, 1000);
    render();
    document.addEventListener("visibilitychange", function () { if (!document.hidden) render(); });
  }

  /* ------------------------------------------------------------------ *
   * 5. RSVP -> WhatsApp
   * ------------------------------------------------------------------ */
  function initRsvp() {
    var form = $("#rsvpForm");
    var toWrap = $("#rsvpTo");
    var nameEl = $("#guestName");
    var msgEl = $("#guestMessage");
    var status = $("#rsvpStatus");
    var ready = $("#rsvpReady");
    var reopen = $("#rsvpReopen");

    // Recipient choices from config
    cfg.rsvp.contacts.forEach(function (c, i) {
      var id = "to" + i;
      var label = document.createElement("label");
      label.className = "choice choice--pill";
      label.innerHTML =
        '<input type="radio" name="to" value="' + i + '" id="' + id + '"' + (i === 0 ? " checked" : "") + ">" +
        "<span></span>";
      var sp = label.querySelector("span");
      sp.textContent = c.name;
      if (c.role) { var sm = document.createElement("small"); sm.textContent = c.role; sp.appendChild(sm); }
      toWrap.appendChild(label);
    });

    function attendance() {
      var r = form.querySelector('input[name="attend"]:checked');
      return r ? r.value : null;
    }

    var attendField = form.querySelector('input[name="attend"]').closest(".field");
    function setError(msg, which) {
      status.className = "rsvp__status" + (msg ? " is-error" : "");
      status.textContent = msg;
      if (msg) ready.hidden = true;
      // soft, accessible marker on the field that needs attention
      nameEl.closest(".field").classList.toggle("is-invalid", which === "name");
      nameEl.setAttribute("aria-invalid", which === "name" ? "true" : "false");
      attendField.classList.toggle("is-invalid", which === "attend");
    }
    nameEl.addEventListener("input", function () {
      if (nameEl.closest(".field").classList.contains("is-invalid")) setError("");
    });

    form.addEventListener("change", function (e) {
      if (e.target.name === "attend") setError("");
    });
    form.addEventListener("input", function () { if (!ready.hidden) ready.hidden = true; });
    form.addEventListener("change", function () { if (!ready.hidden) ready.hidden = true; });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var guestName = nameEl.value.replace(/\s+/g, " ").trim();
      var att = attendance();

      if (guestName.length < 2) { setError("Please enter your name.", "name"); nameEl.focus(); return; }
      if (!att) { setError("Please let us know if you can join us.", "attend"); return; }

      var contact = cfg.rsvp.contacts[parseInt(form.elements.to.value, 10) || 0];
      var phone = L.normalizePhone(contact.phone, cfg.rsvp.countryCode);
      var d = L.dateParts(cfg.event.dateTime, cfg.event.timeZone);

      var message = L.buildMessage({
        toName: contact.name,
        guestName: guestName,
        attending: att === "yes",
        message: msgEl.value, // optional — may be blank
        eventLine: d.weekday + ", " + d.day + " " + d.month + " " + d.year + " · " + cfg.venue.name + ", " + cfg.venue.area
      });
      var url = L.buildWhatsAppUrl(phone, message);

      // Open WhatsApp (works from the submit tap on iOS/Android and on desktop).
      var a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();

      // Quiet confirmation: the message is ready in WhatsApp, but nothing is sent until the guest presses Send.
      setError("");
      var warm = $("#rsvpWarm");
      if (warm) warm.textContent = (att === "yes" ? cfg.text.rsvpWarmYes : cfg.text.rsvpWarmNo) || "";
      reopen.href = url;
      ready.hidden = false;
      ready.style.animation = "none"; void ready.offsetWidth; ready.style.animation = "";   // replay the soft entrance on every send
      if (!reduceMotion && ready.scrollIntoView) {
        setTimeout(function () { ready.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 120);
      }
    });
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
      name.className = "script contact__name";
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
  initContacts();
  initParallax();
  initIntro();
})();
