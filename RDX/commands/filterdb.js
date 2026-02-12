const fs = require('fs-extra');

module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'filter',
    aliases: ['clean', 'dbfilter'],
    description: 'Filter database to keep only threads where the bot is currently present',
    usage: 'filter',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },

  async run({ api, event, Threads, send }) {
    const { threadID } = event;
    const moment = require("moment-timezone");

    try {
      await send.reply('🔍 𝗖𝗛𝗘𝗖𝗞𝗜𝗡𝗚 𝗔𝗟𝗟 𝗚𝗥𝗢𝗨𝗣𝗦...\nBot is verifying all active groups from Facebook. ⏳');

      const threadList = await api.getThreadList(500, null, ["INBOX"]);
      const activeGroups = threadList.filter(t => t.isGroup).map(t => t.threadID);
      const db = require('../../Data/system/database/index');
      
      const allThreads = await Threads.getAll();
      const dbThreadIDs = allThreads.map(t => t.threadID || t.id || t.tid);
      
      let cleanedCount = 0;
      let verifiedCount = 0;
      const emoji = "✅"; // Emoji to send

      for (const id of dbThreadIDs) {
        if (!id) continue;
        
        if (activeGroups.includes(id)) {
          verifiedCount++;
        } else {
          db.prepare('DELETE FROM threads WHERE id = ?').run(id);
          cleanedCount++;
        }
      }

      const time = moment().tz("Asia/Karachi").format("hh:mm:ss A");
      let msg = `╭───〔 🧹 𝗗𝗕 𝗖𝗟𝗘𝗔𝗡𝗘𝗥 〕───╮\n` +
                `│\n` +
                `│ ✅ Emoji Filter Completed!\n` +
                `│ 📊 Verified Active: ${verifiedCount}\n` +
                `│ 🗑️ Removed Inactive: ${cleanedCount}\n` +
                `│ ⚡ Speed: Normal (Optimized)\n` +
                `│\n` +
                `├───────────────────\n` +
                `│ ⏰ Time: ${time}\n` +
                `╰───────────────────╯`;

      return send.reply(msg);

    } catch (error) {
      console.error(error);
      return send.reply('❌ An error occurred while filtering the database.');
    }
  }
};

