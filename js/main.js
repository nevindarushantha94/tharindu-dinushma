/* Tharindu & Dinushma — invitation behaviour.
   Sections: config binding · opening video · reveals · countdown · RSVP */
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

    document.title = cfg.couple.first + " & " + cfg.couple.second + " · Wedding Invitation";
  }

  /* ------------------------------------------------------------------ *
   * 2. Scroll reveals
   * ------------------------------------------------------------------ */
  var revealsStarted = false;
  function startReveals() {
    if (revealsStarted) return;
    revealsStarted = true;
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
   * 3. Opening video
   * ------------------------------------------------------------------ */
  function initIntro() {
    var intro = $("#intro");
    if (!intro) { startReveals(); return; }

    // Deep link (e.g. #rsvp) or JS-less state: skip the opening.
    if (!root.classList.contains("intro-active")) {
      intro.remove();
      startReveals();
      return;
    }

    main.inert = true;

    var video = $("#introVideo");
    var openBtn = $("#introOpen");
    var skipBtn = $("#introSkip");
    var cfgV = cfg.video || {};
    var finished = false;
    var started = false;
    var mode = "video"; // "video" | "fallback" | "button-only"
    var timers = {};

    function clearAll() { Object.keys(timers).forEach(function (k) { clearTimeout(timers[k]); }); }

    function finish() {
      if (finished) return;
      finished = true;
      clearAll();
      intro.classList.add("is-leaving");
      root.classList.remove("intro-active");
      main.inert = false;
      window.scrollTo(0, 0);
      startReveals();
      setTimeout(function () {
        try { video.pause(); video.removeAttribute("src"); video.load(); } catch (e) {}
        intro.remove();
      }, reduceMotion ? 50 : 1500);
    }

    function showOpenButton() {
      if (finished) return;
      intro.classList.add("show-open");
      openBtn.focus({ preventScroll: true });
    }

    function showFallback() {
      if (finished) return;
      mode = "fallback";
      intro.classList.add("is-fallback");
      showOpenButton();
      if (cfgV.fallbackAutoOpenMs > 0) timers.fallback = setTimeout(finish, cfgV.fallbackAutoOpenMs);
    }

    function versioned(url) {
      if (!url) return "";
      return url + (cfgV.version ? (url.indexOf("?") > -1 ? "&" : "?") + "v=" + encodeURIComponent(cfgV.version) : "");
    }

    openBtn.addEventListener("click", function () {
      if (mode === "video" && !started && !reduceMotion) {
        // Autoplay was blocked: the tap is the user gesture that lets it play.
        intro.classList.remove("show-open");
        var p = video.play();
        if (p && p.catch) p.catch(finish);
        timers.stall = setTimeout(function () { if (!started) finish(); }, 5000);
      } else {
        finish();
      }
    });
    skipBtn.addEventListener("click", finish);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !finished) finish();
    });

    // No video configured -> elegant fallback.
    if (!cfgV.src) { showFallback(); return; }

    // Reduced-motion users get the quiet fallback with a button, no autoplay.
    if (reduceMotion) {
      video.removeAttribute("autoplay");
      mode = "button-only";
      intro.classList.add("is-fallback");
      showOpenButton();
      return;
    }

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    if (cfgV.poster) video.poster = versioned(cfgV.poster);

    video.addEventListener("playing", function () {
      started = true;
      clearTimeout(timers.stall);
      clearTimeout(timers.wait);
      intro.classList.add("is-playing");
      intro.classList.remove("show-open");
      // Safety net: if "ended" never fires, move on shortly after the clip should be over.
      if (isFinite(video.duration) && video.duration > 0) {
        clearTimeout(timers.watchdog);
        timers.watchdog = setTimeout(finish, (video.duration - video.currentTime) * 1000 + 2500);
      }
      timers.skip = setTimeout(function () { intro.classList.add("show-skip"); }, 1200);
    });
    video.addEventListener("waiting", function () {
      if (started) timers.wait = setTimeout(finish, 7000); // long stall mid-video
    });
    video.addEventListener("ended", finish);
    video.addEventListener("error", function () {
      if (started) finish(); else showFallback();
    });

    video.src = versioned(cfgV.src);

    var p = video.play();
    if (p && p.catch) {
      p.catch(function (err) {
        if (err && err.name === "NotSupportedError") showFallback();
        else showOpenButton(); // autoplay blocked
      });
    }
    // Autoplay can fail silently (e.g. iOS Low Power Mode): show the button if nothing starts.
    timers.stall = setTimeout(function () { if (!started && !finished && !intro.classList.contains("is-fallback")) showOpenButton(); }, 3000);

    if (video.error) showFallback();
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
    var guestsEl = $("#guestCount");
    var guestsRow = $("#guestsRow");
    var status = $("#rsvpStatus");
    var max = cfg.rsvp.maxGuests || 10;

    guestsEl.max = String(max);

    // Recipient choices from config
    cfg.rsvp.contacts.forEach(function (c, i) {
      var id = "to" + i;
      var label = document.createElement("label");
      label.className = "choice choice--pill";
      label.innerHTML =
        '<input type="radio" name="to" value="' + i + '" id="' + id + '"' + (i === 0 ? " checked" : "") + ">" +
        "<span></span>";
      label.querySelector("span").textContent = c.name;
      toWrap.appendChild(label);
    });

    function attendance() {
      var r = form.querySelector('input[name="attend"]:checked');
      return r ? r.value : null;
    }

    form.addEventListener("change", function (e) {
      if (e.target.name === "attend") {
        guestsRow.classList.toggle("is-collapsed", attendance() === "no");
        setError("");
      }
    });

    // Stepper
    $$("[data-step]", form).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var v = parseInt(guestsEl.value, 10) || 1;
        v += parseInt(btn.getAttribute("data-step"), 10);
        guestsEl.value = String(Math.min(max, Math.max(1, v)));
      });
    });
    guestsEl.addEventListener("blur", function () {
      var v = parseInt(guestsEl.value, 10);
      guestsEl.value = String(isNaN(v) ? 1 : Math.min(max, Math.max(1, v)));
    });

    function setError(msg) {
      status.className = "rsvp__status" + (msg ? " is-error" : "");
      status.textContent = msg;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var guestName = nameEl.value.replace(/\s+/g, " ").trim();
      var att = attendance();
      var guests = Math.min(max, Math.max(1, parseInt(guestsEl.value, 10) || 1));

      if (guestName.length < 2) { setError("Please enter your name."); nameEl.focus(); return; }
      if (!att) { setError("Please let us know if you can join us."); return; }

      var contact = cfg.rsvp.contacts[parseInt(form.elements.to.value, 10) || 0];
      var phone = L.normalizePhone(contact.phone, cfg.rsvp.countryCode);
      var d = L.dateParts(cfg.event.dateTime, cfg.event.timeZone);

      var message = L.buildMessage({
        toName: contact.name,
        guestName: guestName,
        attending: att === "yes",
        guests: guests,
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

      status.className = "rsvp__status is-ok";
      status.innerHTML = "";
      status.append("Opening WhatsApp… If nothing happens, ");
      var link = document.createElement("a");
      link.href = url; link.target = "_blank"; link.rel = "noopener noreferrer";
      link.textContent = "tap here to send your reply";
      status.append(link, ".");
    });
  }

  /* ------------------------------------------------------------------ */
  applyConfig();
  initCountdown();
  initRsvp();
  initIntro();
})();
