"use strict";

const axios = require("axios");

const API_BASE = "https://raw.githubusercontent.com/Ewr-Sifu/SIFATChudtese/refs/heads/main/sifatapichudtese.json";

module.exports = {
  config: {
    name: "font",
    aliases: [],
    version: "1.6.0",
    author: "SIFAT",
    category: "utility",
    shortDescription: { en: "Convert text to various font styles" },
    longDescription: { en: "Convert text to various font styles with a combined list" },
    guide: { en: "{pn} [list <text> | <style_no> <text>]" },
    countDown: 5,
    role: 0
  },

  onStart: async function ({ api, event, args, message }) {
    const { messageID } = event;

    if (args.length === 0) return message.reply("Usage: {pn} [list <text> | <style_no> <text>]");

    const action = args[0].toLowerCase();

    try {
      if (action === "list") {
        const text = args.slice(1).join(" ") || "sifat";
        await message.react("⏳");

        const res = await axios.get(API_BASE);
        
        let styles = [];
        if (res.data && Array.isArray(res.data.styles)) {
          styles = res.data.styles;
        } else if (res.data && typeof res.data === "object") {
          styles = res.data.fontStyles || [];
        }

        if (styles.length === 0) return message.reply("Could not fetch font data.");

        let combinedMsg = `FONT LIST FOR: ${text.toUpperCase()}\n\n`;
        styles.forEach((item) => {
          let converted = item.result || text;
          if (item.map) {
            converted = text.toLowerCase().split('').map(c => item.map[c] || c).join('');
          }
          combinedMsg += `${item.id}. ${item.label}: ${converted}\n`;
        });

        return message.reply(combinedMsg.trim());
      }

      if (!isNaN(action)) {
        const text = args.slice(1).join(" ");
        if (!text) return message.reply(`Please provide text. Example: {pn} ${action} hello`);

        await message.react("⏳");
        const res = await axios.get(API_BASE);
        
        let styles = [];
        if (res.data && Array.isArray(res.data.styles)) {
          styles = res.data.styles;
        } else if (res.data && typeof res.data === "object") {
          styles = res.data.fontStyles || [];
        }

        const targetStyle = styles.find(s => String(s.id) === String(action));
        
        if (!targetStyle) {
          await message.react("❌");
          return message.reply("Style number not found.");
        }

        let resultText = targetStyle.result || text;
        if (targetStyle.map) {
          resultText = text.toLowerCase().split('').map(c => targetStyle.map[c] || c).join('');
        }
        
        await message.react("✨");
        return message.reply(resultText);
      }

      return message.reply("Invalid command usage. Use '{pn} list [text]' or '{pn} [number] [text]'.");

    } catch (e) {
      await message.react("❌");
      console.error(e);
      return message.reply("Failed to process request.");
    }
  },
};
