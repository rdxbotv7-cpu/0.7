module.exports = {
  config: {
    name: 'help',
    aliases: ['h', 'menu', 'cmds'],
    description: 'Show all commands',
    credits: "SARDAR RDX",
    usage: 'help [command] | help [page] | help all',
    category: 'Utility',
    prefix: true
  },

  async run({ api, event, args, send, client, config }) {
    const { threadID, senderID } = event;

    if (args[0]) {
      const input = args[0].toLowerCase();

      if (input === 'all') {
        return showAllCommands({ api, event, send, client, config });
      }

      if (!isNaN(input)) {
        const page = parseInt(input);
        return showPagedCommands({ api, event, send, client, config, page });
      }

      let command = client.commands.get(input);

      if (!command) {
        for (const [name, cmd] of client.commands) {
          if (cmd.config.aliases && cmd.config.aliases.includes(input)) {
            command = cmd;
            break;
          }
        }
      }

      if (!command) {
        return send.reply(`❌ Command "${input}" not found.`);
      }

      const cfg = command.config;
      return send.reply(`╔═════════════════╗
║       🔍 COMMAND DETAILS          
╚═════════════════╝

🎯 Name: ${cfg.name.toUpperCase()}
📝 Description: ${cfg.description || 'No description'}
⚡ Usage: ${config.PREFIX}${cfg.usage || cfg.name}
🏷️ Aliases: ${cfg.aliases?.join(', ') || 'None'}
📂 Category: ${cfg.category || 'Other'}
👮 Admin Only: ${cfg.adminOnly ? '✅ Yes' : '❌ No'}
👥 Group Only: ${cfg.groupOnly ? '✅ Yes' : '❌ No'}

╚═══════════════════════════════════╝`);
    }

    return showPagedCommands({ api, event, send, client, config, page: 1 });
  }
};

function showPagedCommands({ api, event, send, client, config, page }) {
  const uniqueCommands = new Map();

  for (const [name, cmd] of client.commands) {
    if (!uniqueCommands.has(cmd.config.name)) {
      uniqueCommands.set(cmd.config.name, cmd.config);
    }
  }

  const commandsArray = Array.from(uniqueCommands.values());
  const commandsPerPage = 12;
  const totalPages = Math.ceil(commandsArray.length / commandsPerPage);

  if (page < 1 || page > totalPages) {
    return send.reply(`❌ Invalid page number. Please use page 1-${totalPages}`);
  }

  const startIdx = (page - 1) * commandsPerPage;
  const endIdx = startIdx + commandsPerPage;
  const pageCommands = commandsArray.slice(startIdx, endIdx);

  let msg = `╔════════════════════╗
          📚 ${config.BOTNAME}                     COMMANDS  
╠════════════════════╣
║  📄 Page ${String(page).padEnd(2)} / ${String(totalPages).padEnd(2)}  \n Total: ${String(commandsArray.length).padStart(3)} Commands  
  ⚙️ Prefix: ${config.PREFIX}${' '.repeat(28 - config.PREFIX.length)}
╚════════════════════╝

`;

  pageCommands.forEach((cmd, idx) => {
    const num = startIdx + idx + 1;
    msg += `  ✦ [${String(num).padStart(2)}] ${cmd.name}\n`;
  });

  msg += `
╔════════════════════╗
  🔹 ${String(page).padEnd(2)} / ${String(totalPages).padEnd(2)} │ More Commands Available 
╠════════════════════╣
  💡 ${config.PREFIX}help [page]   → See next page      
  📖 ${config.PREFIX}help all      → Show all commands   
  ❓ ${config.PREFIX}help [cmd]    → Command details     
╚════════════════════╝`;

  return send.reply(msg);
}

function showAllCommands({ api, event, send, client, config }) {
  const categories = {};
  const uniqueCommands = new Map();

  for (const [name, cmd] of client.commands) {
    if (!uniqueCommands.has(cmd.config.name)) {
      uniqueCommands.set(cmd.config.name, cmd.config);
    }
  }

  for (const [name, cfg] of uniqueCommands) {
    const cat = cfg.category || 'Other';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(cfg);
  }

  let msg = `╔═══════════════════╗
║       🎮 ALL COMMANDS MENU       ║
║       ${config.BOTNAME}            ║
╠═══════════════════╣
║  ⚙️ Prefix: ${config.PREFIX}           ║
║  📊 Total: ${String(uniqueCommands.size).padStart(2)} Commands   ║
╚═══════════════════╝\n`;

  const categoryOrder = ['Admin', 'Group', 'Friend', 'Economy', 'Media', 'Fun', 'Profile', 'Utility', 'Love', 'Other'];

  const categoryEmojis = {
    'Admin': '👑',
    'Group': '👥',
    'Friend': '🤝',
    'Economy': '💰',
    'Media': '🎵',
    'Fun': '🎉',
    'Profile': '👤',
    'Utility': '🔧',
    'Love': '💕',
    'Other': '📋'
  };

  for (const cat of categoryOrder) {
    if (!categories[cat]) continue;

    const emoji = categoryEmojis[cat] || '📋';
    msg += `\n${emoji} ⟿ ${cat.toUpperCase()} (${categories[cat].length})\n`;
    msg += `${'─'.repeat(19)}\n`;

    categories[cat].forEach(c => {
      msg += `    ▸ ${c.name}\n`;
    });
  }

  for (const cat in categories) {
    if (!categoryOrder.includes(cat)) {
      msg += `\n📋 ⟿ ${cat.toUpperCase()} (${categories[cat].length})\n`;
      msg += `${'─'.repeat(19)}\n`;
      categories[cat].forEach(c => {
        msg += `    ▸ ${c.name}\n`;
      });
    }
  }

  msg += `\n╔═══════════════════╗
║  💡 Use ${config.PREFIX}help                     [command] for details           ║
║  📖 Use ${config.PREFIX}help [page] for paging      ║
╚═══════════════════╝`;

  return send.reply(msg);
}
