module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'threadlist',
    aliases: ['threads', 'tlist'],
    description: 'List threads from Facebook',
    usage: 'threadlist [limit]',
    category: 'Utility',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, Threads }) {
    const limit = parseInt(args[0]) || 20;
    
    try {
      await send.reply(`Fetching up to ${limit} active groups...`);
      
      const threads = await api.getThreadList(limit, null, ['INBOX']);
      const groupThreads = threads.filter(t => t.isGroup);
      
      let msg = `ACTIVE GROUP LIST (${groupThreads.length})\n`;
      msg += `─────────────────\n`;
      
      for (let i = 0; i < groupThreads.length; i++) {
        const thread = groupThreads[i];
        const type = '👥';
        const name = thread.name || thread.threadName || 'Unknown';
        msg += `${i + 1}. ${type} ${name}\n   ID: ${thread.threadID}\n`;
        
        // Auto-sync missing groups to database
        if (Threads && typeof Threads.get === 'function') {
           const exists = Threads.get(thread.threadID);
           if (!exists) {
             Threads.create(thread.threadID, name);
           }
        }
      }
      
      return send.reply(msg);
    } catch (error) {
      console.error(error);
      return send.reply('Failed to get thread list from Facebook.');
    }
  }
};

