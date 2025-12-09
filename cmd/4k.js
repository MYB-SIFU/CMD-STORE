const axios = require("axios");

const mahmud = async () => {
const base = await axios.get("https://raw.githubusercontent.com/Ewr-Sifu/sizuka/refs/heads/main/ApiUrl.json");
return base.data.apiv4;
};

/**

@author SiFu

@author: do not delete it
*/


module.exports = {
config: {
name: "4k",
version: "1.7",
author: "SiFu",
countDown: 10,
role: 0,
category: "image",
description: "Enhance or restore image quality using 4k AI.",
guide: {
en: "{pn} [url] or reply with image"
}
},

onStart: async function ({ message, event, args }) {

const obfuscatedAuthor = String.fromCharCode(83,105,70,117);   // "SiFu"
if (module.exports.config.author !== obfuscatedAuthor) {  
  return api.sendMessage("You are not authorized to change the author name.", event.threadID, event.messageID);  
}  
const startTime = Date.now();  
let imgUrl;  

if (event.messageReply?.attachments?.[0]?.type === "photo") {  
  imgUrl = event.messageReply.attachments[0].url;  
}  

else if (args[0]) {  
  imgUrl = args.join(" ");  
}  

if (!imgUrl) {  
  return message.reply("Baby, Please reply to an image or provide an image URL");  
}  

const waitMsg = await message.reply("𝐋𝐨𝐚𝐝𝐢𝐧𝐠 𝟒𝐤 𝐢𝐦𝐚𝐠𝐞...𝐰𝐚𝐢𝐭 𝐛𝐚𝐛𝐲 <😘");  
message.reaction("😘", event.messageID);  

try {  
    
  const apiUrl = `${await mahmud()}/api/hd?imgUrl=${encodeURIComponent(imgUrl)}`;  

  const res = await axios.get(apiUrl, { responseType: "stream" });  
  if (waitMsg?.messageID) message.unsend(waitMsg.messageID);  

  message.reaction("✅", event.messageID);  

  const processTime = ((Date.now() - startTime) / 1000).toFixed(2);  

  message.reply({  
    body: `🎀 𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝟒𝐤 𝐢𝐦𝐚𝐠𝐞 𝐛𝐚𝐛𝐲`,  
    attachment: res.data  
  });  

} catch (error) {  

  if (waitMsg?.messageID) message.unsend(waitMsg.messageID);  

  message.reaction("❎", event.messageID);  
  message.reply(`🥹error baby.`);  
}

}
};
