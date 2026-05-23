"use strict";

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const API_BASE = "https://raw.githubusercontent.com/myb-sifu/SIFATChudtese/refs/heads/main/sifatapichudtese.json";
const AUTO_DL = true;
const AUTO_DL_MODE = "all";

const SUPPORTED_DOMAINS = [
  "youtube.com", "youtu.be", "tiktok.com", "vm.tiktok.com", "vt.tiktok.com",
  "instagram.com", "facebook.com", "fb.watch", "fb.com", "twitter.com", 
  "x.com", "reddit.com", "vimeo.com", "dailymotion.com", "twitch.tv", 
  "pinterest.com", "soundcloud.com", 
];

const FORMAT_MAP = {
  best: "bestvideo+bestaudio/best",
  mp4: "bestvideo[ext=mp4]+bestaudio/best",
  "4k": "bestvideo[height<=2160]+bestaudio/best",
  "1080p": "bestvideo[height<=1080]+bestaudio/best",
  "720p": "bestvideo[height<=720]+bestaudio/best",
  "480p": "bestvideo[height<=480]+bestaudio/best",
  audio: "bestaudio/best",
  mp3: "bestaudio/best",
  small: "worst/best",
};

function sc(str = "") {
  if (!str) return "";
  const map = "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ1234567890";
  return String(str).toLowerCase().split('').map(c => {
    const i = c.charCodeAt(0) - 97;
    return (i >= 0 && i < 26) ? map[i] : c;
  }).join('');
}

function box(title, body) {
  return ` 「 ${sc(title)} 」 .ᐟ\n\n${body}\n\n𐃷`;
}

const kv = (k, v) => `• ${sc(k)}: ${v}`;
const ok = (msg) => `✓ ${sc(msg)}`;
const warn = (msg) => `⚠ ${sc(msg)}`;
const fail = (title, msg) => `❌ ${sc(title)}\n${sc(msg)}`;

function isSupportedUrl(url) {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return SUPPORTED_DOMAINS.some(d => host.includes(d));
  } catch {
    return false;
  }
}

function extractFirstUrl(text = "") {
  const match = text.match(/https?:\/\/[^\s<>"']+/i);
  return match ? match[0] : null;
}

function extractUrl(args) {
  return args.find(a => /^https?:\/\//i.test(a)) || null;
}

function extractFormat(args) {
  for (const a of args) {
    const key = a.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (FORMAT_MAP[key]) return { fmt: FORMAT_MAP[key], label: key };
  }
  return { fmt: FORMAT_MAP.best, label: "best" };
}

function fmtDuration(sec) {
  if (!sec) return "";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return [h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean).join(" ");
}

function fmtSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kb`;
  return `${(bytes / 1024 / 1024).toFixed(2)} mb`;
}

function tmpPath(ext) {
  return path.join(__dirname, `alldl_${Date.now()}${ext}`);
}

module.exports = {
  config: {
    name: "alldl",
    aliases: [],
    version: "1.0.0",
    author: "SIFAT",
    countDown: 8,
    role: 0,
    shortDescription: { en: "Download from many platforms" },
    longDescription: { en: "Download videos, audios & photos from YouTube, TikTok, Instagram etc." },
    category: "media",
    guide: { en: "{pn} <url> [quality]\n{pn} info <url>\nQuality: best, 1080p, 720p, mp3, audio, small" }
  },

  onStart: async function ({ api, event, args, message }) {
    const { messageID } = event;

    if (!args[0]) {
      const help = [
        sc("available commands:"),
        `• ${sc("alldl <url>")}`,
        `• ${sc("alldl <url> 720p")}`,
        `• ${sc("alldl info <url>")}`,
      ].join("\n");
      return message.reply(box("all dl", help));
    }

    if (args[0].toLowerCase() === "info") {
      const url = extractUrl(args.slice(1)) || args[1];
      if (!url) return message.reply(warn("url dewa hoyni"));

      await message.react("⏳");
      try {
        const { data } = await axios.get(API_BASE);
        if (!data || data.error) return message.reply(fail("info failed", "error fetching endpoint"));

        const infoText = [
          kv("title", data.title || "unknown"),
          kv("platform", data.platform || "unknown"),
          kv("duration", fmtDuration(data.duration)),
          kv("formats", data.formats || "unknown"),
        ].join("\n");

        await message.reply(box("media info", infoText));
        await message.react("✅");
      } catch (e) {
        await message.react("❌");
        return message.reply(fail("info failed", "server error"));
      }
      return;
    }

    const url = extractUrl(args);
    if (!url) return message.reply(warn("valid url de"));

    const { fmt, label } = extractFormat(args);
    await downloadAndSend(api, event, message, url, fmt, label);
  },

  onChat: async function ({ api, event, message }) {
    if (!AUTO_DL) return;

    const { body = "", senderID } = event;
    if (!body) return;

    const url = extractFirstUrl(body);
    if (!url || !isSupportedUrl(url)) return;

    const { fmt } = extractFormat([]);
    await downloadAndSend(api, event, message, url, fmt, "auto");
  },
};

async function downloadAndSend(api, event, message, url, fmt, label) {
  const { messageID } = event;
  const waitMsg = await message.reply(`⏳ ${sc(`downloading ${label} quality...`)}`);

  let tmpFile = null;
  try {
    const form = new URLSearchParams();
    form.append("url", url);
    form.append("format", fmt);

    const resp = await axios({
      method: "POST",
      url: API_BASE,
      data: form.toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      responseType: "stream",
      timeout: 300000,
    });

    const ct = resp.headers["content-type"] || "";
    let ext = ".mp4";
    if (ct.includes("audio")) ext = ".m4a";
    if (ct.includes("gif")) ext = ".gif";
    if (ct.includes("image")) ext = ".jpg";

    tmpFile = tmpPath(ext);
    const writer = fs.createWriteStream(tmpFile);

    await new Promise((res, rej) => {
      resp.data.pipe(writer);
      writer.on("finish", res);
      writer.on("error", rej);
    });

    const size = fs.statSync(tmpFile).size;

    const caption = [
      kv("quality", label.toUpperCase()),
      kv("size", fmtSize(size)),
    ].join("\n");

    await message.reply({
      body: box("download complete", caption),
      attachment: fs.createReadStream(tmpFile)
    });

  } catch (err) {
    await message.reply(fail("download failed", "file boro or server busy"));
  } finally {
    if (tmpFile) fs.remove(tmpFile).catch(() => {});
    if (waitMsg?.messageID) await api.unsendMessage(waitMsg.messageID).catch(() => {});
  }
}
