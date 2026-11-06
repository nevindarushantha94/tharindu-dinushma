#!/usr/bin/env node
/* Makes the social-sharing tags in index.html absolute once you know your real address.
   Usage:   node scripts/set-site-url.js https://your-domain.com/
   Also updates js/config.js → site.url. Safe to run again with a new address.        */
const fs = require("fs");
const path = require("path");

const arg = process.argv[2];
if (!arg || !/^https?:\/\/[^\s/]+/i.test(arg)) {
  console.error("Usage: node scripts/set-site-url.js https://your-domain.com/");
  process.exit(1);
}
const base = arg.replace(/\/?$/, "/");
const root = path.join(__dirname, "..");

const htmlPath = path.join(root, "index.html");
let html = fs.readFileSync(htmlPath, "utf8");
const image = base + "assets/social/og-image.jpg";
const swap = (re, to) => { if (!re.test(html)) throw new Error("Tag not found: " + re); html = html.replace(re, to); };

swap(/(<link rel="canonical" href=")[^"]*(")/, `$1${base}$2`);
swap(/(<meta property="og:url" content=")[^"]*(")/, `$1${base}$2`);
swap(/(<meta property="og:image" content=")[^"]*(")/, `$1${image}$2`);
swap(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${image}$2`);
fs.writeFileSync(htmlPath, html);

const cfgPath = path.join(root, "js/config.js");
let cfg = fs.readFileSync(cfgPath, "utf8");
cfg = cfg.replace(/(site:\s*\{\s*url:\s*)"[^"]*"/, `$1"${base}"`);
fs.writeFileSync(cfgPath, cfg);

console.log("Social sharing URLs set to " + base);
