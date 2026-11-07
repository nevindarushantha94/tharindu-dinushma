/* Pure helper functions (no DOM) — kept separate so they can be unit-tested. */
(function (root) {
  "use strict";

  function pad(n, len) {
    return String(n).padStart(len || 2, "0");
  }

  /** Days / hours / minutes / seconds remaining until targetMs. */
  function countdownParts(targetMs, nowMs) {
    var diff = targetMs - nowMs;
    if (!(diff > 0)) {
      return { done: true, days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }
    var s = Math.floor(diff / 1000);
    return {
      done: false,
      days: Math.floor(s / 86400),
      hours: Math.floor((s % 86400) / 3600),
      minutes: Math.floor((s % 3600) / 60),
      seconds: s % 60,
      total: s
    };
  }

  function ordinalSuffix(n) {
    var v = n % 100;
    if (v >= 11 && v <= 13) return "th";
    switch (n % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  }

  /** Weekday / day / month / year of the event, rendered in the event's own time zone. */
  function dateParts(iso, timeZone) {
    var d = new Date(iso);
    var f = function (opts) {
      opts.timeZone = timeZone;
      return new Intl.DateTimeFormat("en-GB", opts).format(d);
    };
    var dayNum = parseInt(f({ day: "numeric" }), 10);
    return {
      weekday: f({ weekday: "long" }),
      day: pad(dayNum),
      suffix: ordinalSuffix(dayNum),
      month: f({ month: "long" }),
      year: f({ year: "numeric" })
    };
  }

  /** "0710842583" -> "94710842583" (digits only, ready for wa.me). */
  function normalizePhone(raw, countryCode) {
    var digits = String(raw || "").replace(/\D/g, "");
    if (digits.indexOf("00") === 0) digits = digits.slice(2);
    if (digits.charAt(0) === "0") digits = countryCode + digits.slice(1);
    return digits;
  }

  /** Tidy the optional personal message: trim, normalise line breaks, cap blank lines and length. */
  function cleanMessage(raw, max) {
    var t = String(raw || "").replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    return t.length > (max || 500) ? t.slice(0, max || 500).trim() : t;
  }

  /**
   * Pre-filled WhatsApp RSVP, written as a warm note to whichever of the couple the guest picked.
   *   o.toName      the person receiving it (e.g. "Tharindu")
   *   o.partnerName the other half of the couple (e.g. "Dinushma")
   *   o.guestName   who is replying
   *   o.attending   true = accepts, false = declines
   *   o.message     optional personal message (may be blank)
   */
  function buildMessage(o) {
    var note = cleanMessage(o.message);
    var lines = ["Hello " + o.toName + ",", ""];

    if (o.attending) {
      lines.push(
        "Thank you for inviting me to share your special day.",
        "",
        "I'm delighted to confirm that I'll be joining you and " + o.partnerName + " for your wedding celebration."
      );
    } else {
      lines.push(
        "Thank you so much for inviting me to celebrate your special day.",
        "",
        "Unfortunately, I'm unable to join you and " + o.partnerName + " for the wedding, but I'll be thinking of you both and wishing you a beautiful celebration."
      );
    }

    if (note) lines.push("", note);
    if (o.attending) lines.push("", "Looking forward to celebrating with you both!");
    lines.push("", "\u2014 " + o.guestName);
    return lines.join("\n");
  }

  function buildWhatsAppUrl(phone, message) {
    return "https://wa.me/" + phone + "?text=" + encodeURIComponent(message);
  }

  /* ---------------- Calendar (.ics) ---------------- */

  function icsEscape(t) {
    return String(t == null ? "" : t).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  }

  /** RFC 5545: lines are folded at 75 octets (continuation lines start with one space). */
  function icsFold(line) {
    var enc = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;
    var out = [], cur = "", bytes = 0, limit = 75;
    Array.from(line).forEach(function (ch) {
      var n = enc ? enc.encode(ch).length : ch.length;
      if (bytes + n > limit) { out.push(cur); cur = " "; bytes = 1; limit = 75; }
      cur += ch; bytes += n;
    });
    out.push(cur);
    return out.join("\r\n");
  }

  function icsUtc(ms) {
    return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  }

  function hhmmToMinutes(hhmm) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ""));
    return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
  }

  /** Minutes after midnight of the event's start, in the event's own time zone. */
  function localStartMinutes(iso, timeZone) {
    var parts = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: timeZone }).format(new Date(iso)).split(":");
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  /** How long before the event start a reminder fires, as an iCalendar duration ("-P2D", "-PT180M"). */
  function reminderTrigger(r, startLocalMin) {
    var total = (r.daysBefore || 0) * 1440;
    var at = hhmmToMinutes(r.at);
    if (at != null) total += startLocalMin - at;
    if (total <= 0) return "PT0S";
    return total % 1440 === 0 ? "-P" + (total / 1440) + "D" : "-PT" + total + "M";
  }

  /**
   * Build a calendar file for the wedding, including display reminders.
   *   o.startIso, o.timeZone, o.durationHours, o.title, o.location, o.description, o.url, o.uid, o.reminders, o.nowMs
   */
  function buildIcs(o) {
    var start = new Date(o.startIso).getTime();
    var end = start + (o.durationHours || 4) * 3600000;
    var startLocal = localStartMinutes(o.startIso, o.timeZone || "UTC");
    var L = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Design by Nevinda Rushantha//Wedding Invitation//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:" + o.uid,
      "DTSTAMP:" + icsUtc(o.nowMs || Date.now()),
      "DTSTART:" + icsUtc(start),
      "DTEND:" + icsUtc(end),
      "SUMMARY:" + icsEscape(o.title),
      "LOCATION:" + icsEscape(o.location),
      "DESCRIPTION:" + icsEscape(o.description)
    ];
    if (o.url) L.push("URL:" + o.url);
    L.push("STATUS:CONFIRMED", "TRANSP:OPAQUE");
    (o.reminders || []).forEach(function (r) {
      L.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsEscape(r.message || o.title), "TRIGGER:" + reminderTrigger(r, startLocal), "END:VALARM");
    });
    L.push("END:VEVENT", "END:VCALENDAR");
    return L.map(icsFold).join("\r\n") + "\r\n";
  }

  var api = {
    buildIcs: buildIcs,
    reminderTrigger: reminderTrigger,
    pad: pad,
    countdownParts: countdownParts,
    ordinalSuffix: ordinalSuffix,
    dateParts: dateParts,
    normalizePhone: normalizePhone,
    cleanMessage: cleanMessage,
    buildMessage: buildMessage,
    buildWhatsAppUrl: buildWhatsAppUrl
  };

  root.InviteLogic = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
