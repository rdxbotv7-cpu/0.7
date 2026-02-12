const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "suno",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "SARDAR RDX",
  description: "Generate AI Song from Lyrics using Suno API",
  commandCategory: "AI Music",
  usages: ".suno [lyrics]",
  cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  if (args.length === 0) {
    return api.sendMessage("🎵 Lyrics likho bhai!\nExample: .suno Tum hi ho meri aashiqui ab tum hi ho", threadID, messageID);
  }

  const lyrics = args.join(" ");
  const instrumen = "no"; // ya "piano", "guitar" bhi try kar sakte ho
  const style = "Classical Music, Pop, Rock";
  const apiUrl = `https://anabot.my.id/api/ai/suno?lyrics=${encodeURIComponent(lyrics)}&instrumen=${encodeURIComponent(instrumen)}&style=${encodeURIComponent(style)}&apikey=freeApikey`;

  try {
    api.sendMessage("🎧 song creating wait plz 🎶", threadID, messageID);

    const res = await fetch(apiUrl);
    const json = await res.json();

    if (!json.success || !json.data?.result) {
      return api.sendMessage("❌ Song banane mein dikkat aayi! Try again later.", threadID, messageID);
    }

    // Result se 2 audio links milte hain
    const songLinks = json.data.result.map(item => item.audio_url).filter(Boolean);
    if (songLinks.length === 0) {
      return api.sendMessage("⚠️ Koi audio URL nahi mila!", threadID, messageID);
    }

    // First audio URL se download
    const songUrl = songLinks[0];
    const filePath = path.join(__dirname, "cache", `suno_${Date.now()}.mp3`);

    const songRes = await fetch(songUrl);
    const buffer = await songRes.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(buffer));

    // File Messenger par send karo
    api.sendMessage({
      body: `🎵 *AI Generated Song Ready!*\n\n🎶 Lyrics: ${lyrics}\n\n✨ Enjoy your Suno AI song!`,
      attachment: fs.createReadStream(filePath)
    }, threadID, () => fs.unlinkSync(filePath), messageID);

  } catch (err) {
    console.error("❌ Suno Error:", err);
    api.sendMessage("😢 Error aayi song generate karte waqt.\nDetails: " + err.message, threadID, messageID);
  }
};

