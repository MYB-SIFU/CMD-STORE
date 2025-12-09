const axios = require("axios");
const fs = require("fs");
const path = require("path");

const cmdsInfoUrl = "https://raw.githubusercontent.com/Ewr-Sifu/sizuka/main/main/cmdsinfo.json";
const cmdsUrlJson = "https://raw.githubusercontent.com/Ewr-Sifu/sizuka/main/main/cmdsurl.json";
const fontUrl = "https://raw.githubusercontent.com/Ewr-Sifu/sizuka/main/main/xfont.json";
const ITEMS_PER_PAGE = 10;

let fontMap = {};
async function loadFont() {
  try {
    const res = await axios.get(fontUrl);
    fontMap = res.data;
  } catch (err) {
    console.error("Failed to load font.json:", err);
  }
}

function toBold(text) {
  return text.split("").map(ch => fontMap[ch] || ch).join("");
}

module.exports.config = {
  name: "scs",
  aliases: ["cmdstore", "sizukastore"],
  author: "SiFu ⚡",
  version: "2.0",
  role: 0,
  countDown: 3,
  category: "owner",
  shortDescription: "Sakura Command Store",
  longDescription: "Access bot commands list and their URLs.",
  guide: { en: "Usage: /cs [command | letter | page]" }
};

module.exports.onStart = async function ({ api, event, args }) {
  await loadFont();
  const query = args.join(" ").trim().toLowerCase();

  try {
    const response = await axios.get(cmdsInfoUrl);
    let cmds = response.data.cmdName;
    let finalArray = cmds;
    let page = 1;

    if (query) {
      if (!isNaN(query)) {
        page = parseInt(query);
      } else if (query.length === 1) {
        finalArray = cmds.filter(c => c.cmd.toLowerCase().startsWith(query));
      } else {
        finalArray = cmds.filter(c => c.cmd.toLowerCase().includes(query));
      }
      if (finalArray.length === 0)
        return api.sendMessage(`❌ ${toBold(`No command found for "${query}"`)}`, event.threadID, event.messageID);
    }

    const totalPages = Math.ceil(finalArray.length / ITEMS_PER_PAGE);
    if (page < 1 || page > totalPages)
      return api.sendMessage(`❌ ${toBold(`Invalid page number (1-${totalPages})`)}`, event.threadID, event.messageID);

    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const cmdsToShow = finalArray.slice(start, end);

    let msg = `━━━━━━━━━━━━━━\n🌸 ${toBold("Sizuka Command Store")}\n━━━━━━━━━━━━━━\n📄 ${toBold(`Page: ${page}/${totalPages}`)}\n🧩 ${toBold(`Total: ${finalArray.length} Cmds`)}\n────────────────\n`;

    cmdsToShow.forEach((cmd, i) => {
      msg += `💠  ${toBold(`${start + i + 1}. ${cmd.cmd}`)}\n👨‍💻 ${toBold(`Author: ${cmd.author}`)}\n🕓 ${toBold(`Update: ${cmd.update || "Unknown"}`)}\n────────────────\n`;
    });

    msg += `📑 ${toBold(`Type "/${this.config.name} ${page + 1}" for next page.`)}\n━━━━━━━━━━━━━━`;

    api.sendMessage(msg, event.threadID, (err, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName: this.config.name,
        type: "reply",
        messageID: info.messageID,
        author: event.senderID,
        cmdName: finalArray,
        page
      });
    }, event.messageID);

  } catch (err) {
    console.error(err);
    api.sendMessage(`❌ ${toBold("Failed to load command list!")}`, event.threadID, event.messageID);
  }
};

module.exports.onReply = async function ({ api, event, Reply }) {
  await loadFont();
  if (Reply.author !== event.senderID)
    return api.sendMessage(toBold("Gowk Gowk Gowk"), event.threadID, event.messageID);

  const replyNum = parseInt(event.body);
  const start = (Reply.page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;

  if (isNaN(replyNum) || replyNum < start + 1 || replyNum > end)
    return api.sendMessage(toBold(`❌ Please reply between ${start + 1} and ${Math.min(end, Reply.cmdName.length)}.`), event.threadID, event.messageID);

  try {
    const cmdName = Reply.cmdName[replyNum - 1].cmd;
    const { status } = Reply.cmdName[replyNum - 1];
    const response = await axios.get(cmdsUrlJson);
    const cmdUrl = response.data[cmdName];

    if (!cmdUrl)
      return api.sendMessage(toBold("❌ Command URL not found!"), event.threadID, event.messageID);

    api.unsendMessage(Reply.messageID);
    const msg = `━━━━━━━━━━━━━━\n📘 ${toBold("Command Info")}\n━━━━━━━━━━━━━━\n🧩 ${toBold(`Name: ${cmdName}`)}\n⚙️ ${toBold(`Status: ${status || "Unavailable"}`)}\n🌐 URL: ${cmdUrl}\n━━━━━━━━━━━━━━`;

    api.sendMessage(msg, event.threadID, event.messageID);
  } catch (err) {
    console.error(err);
    api.sendMessage(toBold("❌ Failed to fetch command URL!"), event.threadID, event.messageID);
  }
};
