const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "pin",
    aliases: ["pinterest"],
    version: "2.0",
    author: "Modified by hasan",
    role: 0,
    countDown: 5,
    shortDescription: { en: "Search images on Pinterest" },
    category: "image",
    guide: { en: "{prefix}pin <search query> -<number of images>" }
  },

  onStart: async function ({ api, event, args }) {
    try {
      const w = await api.sendMessage("🔍 | Please wait...", event.threadID);
      const searchQuery = args.join(" ");

      if (!searchQuery.includes("-")) {
        return api.sendMessage(`❌ Invalid format!\nExample: {prefix}pin cat -5`, event.threadID, event.messageID);
      }

      const [query, numImages] = searchQuery.split("-").map(str => str.trim());
      const numberOfImages = parseInt(numImages);

      if (isNaN(numberOfImages) || numberOfImages <= 0 || numberOfImages > 20) {
        return api.sendMessage("❌ Please specify a number between 1 and 20.", event.threadID, event.messageID);
      }

      // ✅ Multiple API backup
      const apiUrls = [
        `https://www.noobs-api.rf.gd/dipto/pinterest?search=${encodeURIComponent(query)}`,
        `https://pin-two.vercel.app/pin?search=${encodeURIComponent(query)}`
      ];

      let imageData;
      for (let apiUrl of apiUrls) {
        try {
          const response = await axios.get(apiUrl);
          imageData = response.data.result || response.data.data;
          if (Array.isArray(imageData) && imageData.length > 0) break;
        } catch (error) {
          console.error(`API failed: ${apiUrl}`);
        }
      }

      if (!imageData || !Array.isArray(imageData) || imageData.length === 0) {
        return api.sendMessage(`❌ No images found for "${query}".`, event.threadID, event.messageID);
      }

      const cacheFolder = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheFolder)) fs.mkdirSync(cacheFolder);

      const imgData = [];
      for (let i = 0; i < Math.min(numberOfImages, imageData.length); i++) {
        try {
          const imgResponse = await axios.get(imageData[i], { responseType: 'arraybuffer' });
          const imgPath = path.join(cacheFolder, `pin_${i + 1}.jpg`);
          await fs.outputFile(imgPath, imgResponse.data);
          imgData.push(fs.createReadStream(imgPath));
        } catch (error) {
          console.error(`Error downloading image ${i + 1}:`, error);
        }
      }

      await api.sendMessage({ attachment: imgData, body: `✅ | Here is your pictures !\nSearch base: "${query}"` }, event.threadID, event.messageID);

      // ✅ Auto-delete cache images after sending
      setTimeout(() => {
        fs.emptyDirSync(cacheFolder);
      }, 60000);

    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ An error occurred while fetching images.", event.threadID, event.messageID);
    }
  }
};
