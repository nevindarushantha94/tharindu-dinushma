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

  function buildMessage(o) {
    var lines = [
      "Hello " + o.toName + "! 🌿",
      "I would like to reply to your wedding invitation.",
      "",
      "Name: " + o.guestName,
      "Response: " + (o.attending ? "Joyfully Accept" : "Regretfully Decline")
    ];
    if (o.attending) lines.push("Number of guests: " + o.guests);
    lines.push("", o.eventLine);
    return lines.join("\n");
  }

  function buildWhatsAppUrl(phone, message) {
    return "https://wa.me/" + phone + "?text=" + encodeURIComponent(message);
  }

  var api = {
    pad: pad,
    countdownParts: countdownParts,
    ordinalSuffix: ordinalSuffix,
    dateParts: dateParts,
    normalizePhone: normalizePhone,
    buildMessage: buildMessage,
    buildWhatsAppUrl: buildWhatsAppUrl
  };

  root.InviteLogic = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
