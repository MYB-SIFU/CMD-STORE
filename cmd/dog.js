const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "dog",
    author: "SiFu",
    category: "image",
    version: "1.0",
    role: 0,
    shortDescription: { en: " Send a random dog image" },
    longDescription: { en: "Fetches a random dog image." },
    guide: { en: "{p}{n} — Shows a random dog image" }
  },

  onStart: async function({ api, event }) {
    try {
      const GITHUB_RAW = "https://raw.githubusercontent.com/Ewr-Sifu/sizuka/refs/heads/main/ApiUrl.json";
      const rawRes = await axios.get(GITHUB_RAW);
      const apiBase = rawRes.data.apiv1;

      const apiUrl = `${apiBase}/api/dog`;
      const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
      const buffer = Buffer.from(response.data, "binary");

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const tempPath = path.join(cacheDir, `dog_${Date.now()}.jpg`);
      await fs.writeFile(tempPath, buffer);

      await api.sendMessage(
        {
          body: "Here's a random dog for you!",
          attachment: fs.createReadStream(tempPath)
        },
        event.threadID,
        () => fs.unlinkSync(tempPath),
        event.messageID
      );

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Failed to fetch dog image.\n" + err.message, event.threadID, event.messageID);
    }
  }
};
