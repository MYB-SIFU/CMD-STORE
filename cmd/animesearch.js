const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "animesearch",
    aliases: ["anisar", "anisearch", "animeedit"],
    version: "1.0",
    author: "SiFu",
    description: "Search an anime edits video",
    category: "anime",
    role: 0,
    usage: "/animesearch sakura haruka",
  },

  onStart: async function({ api, event, args }) {
    const query = args.join(" ");
    if (!query)
      return api.sendMessage("🔍 | Please provide an anime name!", event.threadID, event.messageID);

    api.setMessageReaction("⌛️", event.messageID, () => {}, true);

    try {
      
      const githubRawUrl = "https://raw.githubusercontent.com/Ewr-Sifu/sizuka/refs/heads/main/ApiUrl.json";
      const apiRes = await axios.get(githubRawUrl);
      const baseUrl = apiRes.data.apiv1;

      const res = await axios.get(`${baseUrl}/api/animesearch?query=${encodeURIComponent(query)}`);

      if (!res.data?.status || !res.data.random?.noWatermark) {
        api.setMessageReaction("❌️", event.messageID, () => {}, true);
        return api.sendMessage(`❌ | No results found for "${query}"`, event.threadID, event.messageID);
      }

      const videoUrl = res.data.random.noWatermark;
      const filePath = path.join(__dirname, "cache", `${Date.now()}.mp4`);
      const writer = fs.createWriteStream(filePath);

      const response = await axios({
        url: videoUrl,
        method: "GET",
        responseType: "stream",
      });

      response.data.pipe(writer);

      writer.on("finish", async () => {
        api.setMessageReaction("✅️", event.messageID, () => {}, true);

        await api.sendMessage({
          body: `🎥 | Here's a random anime video for "${query}"`,
          attachment: fs.createReadStream(filePath)
        }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);
      });

      writer.on("error", err => {
        console.error(err);
        api.setMessageReaction("❌️", event.messageID, () => {}, true);
        api.sendMessage("❌ | Failed to send video!", event.threadID, event.messageID);
      });
    } catch (err) {
      console.error("❌ animesearch error:", err.message);
      api.setMessageReaction("❌️", event.messageID, () => {}, true);
      api.sendMessage("⚠️ | Something went wrong, please try again later.", event.threadID, event.messageID);
    }
  }
};
