const stringSimilarity = require('string-similarity');
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// ═══════════════════════════════════════════════════════════════
// RDX AI HELPER - AI-Powered Bot Guide & Error Detector
// Works with PREFIX: .rdxai [question]
// Works WITHOUT PREFIX: Just type "rdxai [question]"
// Guides users about commands, coins, bank, and bot features
// ═══════════════════════════════════════════════════════════════

const COMMANDS_DB = {
  'balance': { name: 'balance', description: 'Check your coin balance and bank balance', usage: 'balance', aliases: ['bal', 'coins', 'myaccount', 'money'], category: 'Economy', coins: 0 },
  'deposit': { name: 'deposit', description: 'Deposit coins to your bank for safety', usage: 'deposit [amount]', aliases: ['dep', 'save'], category: 'Economy', coins: 0 },
  'withdraw': { name: 'withdraw', description: 'Withdraw coins from your bank', usage: 'withdraw [amount]', aliases: ['with', 'wd', 'draw'], category: 'Economy', coins: 0 },
  'daily': { name: 'daily', description: 'Claim daily reward - get free coins!', usage: 'daily', aliases: ['d', 'claim', 'reward', 'bonus'], category: 'Economy', coins: '50-200 FREE' },
  'openaccount': { name: 'openaccount', description: 'Create bank account to save coins permanently', usage: 'openaccount [full_name]', aliases: ['account', 'bank', 'register', 'newaccount'], category: 'Economy', coins: 0 },
  'mybank': { name: 'mybank', description: 'View complete bank account details', usage: 'mybank', aliases: ['bankinfo', 'bankdetails', 'myaccount'], category: 'Economy', coins: 0 },
  'creditcard': { name: 'creditcard', description: 'Get credit card from bank', usage: 'creditcard', aliases: ['ccard', 'card', 'cc'], category: 'Economy', coins: 0 },
  'rankup': { name: 'rankup', description: 'Check your ranking and points', usage: 'rankup [@user]', aliases: ['rank', 'level', 'points', 'top'], category: 'Economy', coins: 0 },
  'pair': { name: 'pair', description: 'Create a love pair (100-500 coins)', usage: 'pair [user1] [user2]', aliases: ['couple', 'ship', 'cp'], category: 'Fun', coins: '100-500' },
  'pair2': { name: 'pair2', description: 'Create a pair variant #2 (10 coins)', usage: 'pair2 [user1] [user2]', aliases: [], category: 'Fun', coins: 10 },
  'pair3': { name: 'pair3', description: 'Create a pair variant #3 (10 coins)', usage: 'pair3 [user1] [user2]', aliases: [], category: 'Fun', coins: 10 },
  'pair4': { name: 'pair4', description: 'Create a pair variant #4 (10 coins)', usage: 'pair4 [user1] [user2]', aliases: [], category: 'Fun', coins: 10 },
  'pair5': { name: 'pair5', description: 'Create a pair variant #5 (10 coins)', usage: 'pair5 [user1] [user2]', aliases: [], category: 'Fun', coins: 10 },
  'pair6': { name: 'pair6', description: 'Create a pair variant #6 (10 coins)', usage: 'pair6 [user1] [user2]', aliases: [], category: 'Fun', coins: 10 },
  'pair7': { name: 'pair7', description: 'Create a pair variant #7 (10 coins)', usage: 'pair7 [user1] [user2]', aliases: [], category: 'Fun', coins: 10 },
  'pair10': { name: 'pair10', description: 'Create a pair variant #10 (10 coins)', usage: 'pair10 [user1] [user2]', aliases: [], category: 'Fun', coins: 10 },
  'marry': { name: 'marry', description: 'Marry another user (250 coins)', usage: 'marry @user', aliases: ['wed', 'wedding'], category: 'Fun', coins: 250 },
  'bestfriend': { name: 'bestfriend', description: 'Add best friend (100 coins)', usage: 'bestfriend @user', aliases: ['bff', 'bf'], category: 'Fun', coins: 100 },
  'friend': { name: 'friend', description: 'Send friend request to user', usage: 'friend @user', aliases: ['fr', 'addfriend', 'add'], category: 'Social', coins: 0 },
  'accept': { name: 'accept', description: 'Accept friend request', usage: 'accept @user', aliases: ['acc', 'approve'], category: 'Social', coins: 0 },
  'block': { name: 'block', description: 'Block a user from messaging', usage: 'block @user', aliases: ['blk', 'unblock'], category: 'Social', coins: 0 },
  'kick': { name: 'kick', description: 'Kick user from group (admin only)', usage: 'kick @user', aliases: [], category: 'Admin', coins: 0 },
  'ban': { name: 'ban', description: 'Ban user from using bot', usage: 'ban @user', aliases: [], category: 'Admin', coins: 0 },
  'mute': { name: 'mute', description: 'Mute user in group', usage: 'mute @user', aliases: [], category: 'Admin', coins: 0 },
  'help': { name: 'help', description: 'Show all bot commands', usage: 'help [page]', aliases: ['commands', 'cmd', 'cmds'], category: 'Utility', coins: 0 },
  'prefix': { name: 'prefix', description: 'Change bot prefix', usage: 'prefix [symbol]', aliases: ['setprefix', 'pre'], category: 'Admin', coins: 0 },
  'info': { name: 'info', description: 'Get bot information', usage: 'info', aliases: ['botinfo', 'about'], category: 'Utility', coins: 0 },
};

// --- COMPREHENSIVE GUIDES ---
const GUIDES = {
  bank: `🏦 **BANK ACCOUNT SETUP GUIDE**

**Step 1: Account Kholna (Open Account)**
Command: .openaccount [full_name]
Aliases: .account, .bank, .register, .newaccount
Example: .openaccount Ahmed Khan
→ Aapka bank account ban jayega!

**Step 2: Coins Deposit Karna**
Command: .deposit [amount]
Aliases: .dep, .save
Example: .deposit 100
→ Apne coins ko safe rakho!

**Step 3: Account Dekho**
Command: .mybank
Aliases: .bankinfo, .bankdetails
→ Bank details aur balance dekho!

**Step 4: Coins Nikalno (Withdraw)**
Command: .withdraw [amount]
Aliases: .with, .draw
→ Bank se coins nikal sakte ho!

**Kaunsa Account Required Hai?**
✓ First .openaccount command use karo
✓ Phir deposit/withdraw use kar sakte ho
✓ Credit card ke liye bhi account zaroori hai!

💡 Fayda: Agar group leave ho jao to coins safe rehte hain!`,

  rankup: `📊 **RANKUP COMMAND - LEADERBOARD**

**Apna Rank Dekho:**
Command: .rankup
→ Apna position, level, points dekho!

**Kisi ka Rank Dekho:**
Command: .rankup @user
→ Dusre ki ranking aur stats dekho!

**Rank Me Aane Ke Liye:**
✓ Actively chat karo
✓ Commands use karo  
✓ EXP points earn karo
✓ Level up karo!

**Account Number?**
💡 Agar aapka bank account nahi hai:
→ Account number show nahi hoga
→ Pehle .openaccount [name] se account banao
→ Phir rankup dekho pura details!

**Stats Include:**
📈 Level aur Experience
💰 Coins aur Bank Balance
👥 Friends aur Relationships
🏆 Ranking Position`,

  coins: `💰 **COINS KAISE EARN KARO?**

**Message Send Karo (PASSIVE)**
- Har active message = 1 coin 🪙
- Groups me zyada active raho = zyada coins!

**Commands Use Karo**
- Command use = 1-2 coins bonus
- Different commands try karo!

**Daily Reward**
Command: .daily
→ Har din 50-200 coins FREE!
→ Sirf ek bar din me use kar sakte ho!

**Group Rewards**
- Group chat active raho
- Special activities join karo
→ Bonus coins milenge!

**Important**: Coins waste mat karo! Smart kharch karo.`,

  credits: `⭐ **CREDITS & POINTS SYSTEM**

**EXP Points Kaise Milte Hain?**
- Har message: +5 EXP
- Commands: +2 EXP bonus
- Active players: +10 EXP/day bonus!

**Level Up Karo!**
- 100 EXP = Level Up 🎉
- Har level bonus coins + features!

**Credits Ka Use**
- Paid commands (pair, marry, etc.)
- Special features unlock karna
- Shop items buy karna

💡 Tip: Zyada active raho, zyada rewards!`,

  paidcommands: `💳 **PAID COMMANDS**

**❤️ Pair Command** (100-500 coins)
.pair [user1] [user2]
✓ Do log ko love pair banao
✓ Server me registered hoga
✓ Special couple status!

**💍 Marry** (250 coins)
.marry @user
✓ Kisi ko marry karo permanently
✓ Cute features unlock!
✓ Couple benefits!

**👯 Best Friend** (100 coins)
.bestfriend @user
✓ Best friend relationship banao
✓ BFF status display!

💡 Coins check karo: .balance`,

  creditcard: `💳 **CREDIT CARD GUIDE**

**Credit Card Kya Hai?**
Bank se milne wala special card!
(.creditcard ya .ccard se get karo)

**Use Kaise Hote Hain?**
✓ Shopping me use kar sakte ho
✓ Online payments
✓ Monthly bill pay karo
✓ Interest pay karna padta hai

**Shortcut Names:**
- ccard
- card
- cc

**Command:**
.creditcard
.ccard
.card

💡 Bank account banane ke baad hi mil sakta hai!`,

  social: `👥 **SOCIAL COMMANDS GUIDE**

**Friend Request Bhejo:**
.friend @user
→ Dusre ko friend request bhejo!

**Friend Request Accept Karo:**
.accept @user
→ Friend request accept kar de!

**Block User:**
.block @user
→ Kisi ko block kar de, message nahi aa sakta!

💡 Tip: Friend commands bina coins ke free hain!

**Paid Social Commands:**
• .pair - Love pair banao (100-500 coins)
• .marry - Marriage (250 coins)
• .bestfriend - BFF status (100 coins)

👉 Pair/Marry/BestFriend ke liye "rdxai pair kaise" likho!`,

  admin: `⚙️ **ADMIN COMMANDS**

**Kick User:**
.kick @user
→ Group se user nikalo!

**Ban User:**
.ban @user
→ Bot se permanently ban kar!

**Mute User:**
.mute @user
→ User ko group me chup rakhao!

**Change Prefix:**
.prefix [symbol]
Example: .prefix !
→ Bot ka prefix badal de!

💡 Sirf admins ye command use kar sakte hain!`,

  owner: `👨‍💼 **OWNER & CREATOR INFO**

**Bot Owner:**
🤴 **SARDAR RDX**
→ Ye bot SARDAR RDX ne banaya hai!

**Me (RDXAI):**
🤖 SARDAR RDX ka AI Assistant
→ Main 24/7 users ko help karta hoon!

**Kya Karte Hain?**
✓ Commands ke bare me guide deta hoon
✓ Troubleshooting help deta hoon
✓ Bot features explain kunta hoon
✓ Zyada na zyada helpful banna try karte hoon

**Creator Contact:**
📌 Saari problems SARDAR RDX ko contact karo
📌 Bug reports SARDAR RDX ko bhejo
📌 New features ke suggestions SARDAR RDX ko poocho

💡 Tip: Mujhse poocho koi bhi command ke bare me!`,

  troubleshooting: `🔧 **COMMAND TROUBLESHOOTING**

**Command Kaam Nahi Kar Rhi?**

**1️⃣ PAID COMMANDS (Coins Nahi Ho)**
Ye commands paid hain:
✓ Pair (100-500 coins) 
✓ Marry (250 coins)
✓ Best Friend (100 coins)

**Solution:** .daily se coins earn karo ya messages bhejo!

**2️⃣ BANK ACCOUNT NAHI HA**
Kuch commands ke liye account zaroori hai:
✓ Deposit / Withdraw
✓ Credit Card

**Solution:** Pehle .openaccount [name] se account banao!

**3️⃣ ADMIN COMMANDS KI ZAROORT**
Ye commands sirf admins use kar sakte hain:
✓ Kick
✓ Ban
✓ Mute
✓ Prefix

**Solution:** Group admin se maango!

**4️⃣ WRONG COMMAND SYNTAX**
.command [parameters] sahi tarike se likho!

Example:
✓ .pair @user1 @user2
✗ pair user1 user2 (galat)

**5️⃣ STILL NOT WORKING?**
📌 SARDAR RDX se pooch lo!
📌 Kisi error message ka screenshot send karo
📌 Bot issue report karo

💡 Tip: .rdxai troubleshooting likhlo!`,

  paymentinfo: `💳 **PAID COMMANDS - PAYMENT INFO**

**Kaunse Commands Paid Hain?**

**1️⃣ Pair Command** - 100-500 coins
.pair @user1 @user2
→ Love couple banao!
→ Sabko dikhta hai publicly!

**2️⃣ Pair Variants (Pair2 to Pair10)** - 10 coins EACH
.pair2, .pair3, .pair4, .pair5, .pair6, .pair7, .pair10
→ Different pair styles!
→ Har ek 10 coins ka!

**3️⃣ Marry** - 250 coins
.marry @user
→ Kisi ko permanently marry karo!
→ Special couple status milegi!

**4️⃣ Best Friend** - 100 coins
.bestfriend @user
→ Best friend relationship banao!
→ BFF badge milega!

**Coins Kaise Milte Hain?**
✓ .daily = 50-200 free coins!
✓ Active messages = 1 coin each
✓ Commands use karne se bonus
✓ Group rewards

**Balance Check Karo:**
.balance ya .coins likhlo!

💡 Paid features se acha experience milta hai!`
};

// --- AI CONFIGURATION ---
const GROQ_API_KEY = "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";
const HISTORY_FILE = path.join(__dirname, "cache", "rdxai_history.json");
const MODEL_NAME = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `Aap RDXAI hain - SARDAR RDX ki AI assistant.
Aap ek friendly, helpful, aur smart AI hain jo bot commands aur general chat dono samajhte hain.

👨‍💼 **OWNER INFO:**
✓ Creator: SARDAR RDX
✓ You: RDXAI (Bot Assistant)
✓ Aap 24/7 help dete ho!

PERSONALITY & BEHAVIOR:
- Bilkul friendly aur helpful raho
- Hinglish mein baat karo (Hindi-English mix)
- SHORT aur SIMPLE answers do (2-3 lines max)
- Emoji use karo 😊💕✨
- User ki mood samjho aur uske anusar reply do
- Casual aur natural feel dो
- "Yaar", "dost", "bhai" jaise terms use kar sakte ho
- PURA message padh kar samjho, sirf keywords mat dekho!

**IMPORTANT - CHARACTER TRAITS:**
✓ You are smart aur knowledgeable
✓ You understand all bot commands completely
✓ You help with coins, bank, pairs, marriages, friends drama
✓ You explain WHY commands don't work
✓ You're conversational, not robotic
✓ You give short, helpful answers
✓ You handle both command questions AND casual chat

**COMMAND KNOWLEDGE - SHORT:**

**ECONOMY:**
- Balance/Bal: Coins check karo
- Daily/Bonus: 50-200 FREE coins daily
- OpenAccount: Bank account banao (required for deposit/withdraw)
- Deposit: Coins bank me save karo
- Withdraw: Bank se coins nikalo
- Credit Card: CreditCard command, shortcuts: ccard, cc
- Rank/Level: Apna position dekho

**FUN & SOCIAL:**
- Friend: Friend request bhejo (free)
- Accept: Friend request accept karo
- Block: Kisi ko block karo
- Pair: Love pair banao (PAID: 100-500 coins) 🥰
- Pair2/Pair3/Pair4/Pair5/Pair6/Pair7/Pair10: Pair variants (PAID: 10 coins each) 💕
- Marry: Kisi se shadi karo (PAID: 250 coins) 💍
- BestFriend: BFF status do (PAID: 100 coins) 👯

**ADMIN ONLY:**
- Kick: User ko remove karo (admin ke liye)
- Ban: User ko ban karo (admin ke liye)
- Mute: User mute karo (admin ke liye)
- Prefix: Bot ka prefix change karo

**UTILITY:**
- Help: Saari commands dekho
- Info: Bot ki info

**TROUBLESHOOTING KNOWLEDGE:**
Agar user koi command ke baare mein pooche ya kammikaal na ho:

1. **PAID COMMANDS:** Pair (100-500 coins), Pair2-10 (10 coins each), Marry (250 coins), BestFriend (100 coins)
   → Agar coins nahi hain to ye commands kaam nahi karenge
   
2. **REQUIRES ACCOUNT:** Deposit/Withdraw, CreditCard
   → Pehle .openaccount [name] se account banana padta hai
   
3. **ADMIN ONLY:** Kick, Ban, Mute, Prefix
   → Sirf group admin ye commands use kar sakte hain
   
4. **WRONG USAGE:** Wrong syntax ya spelling mistakes
   → Correct command bata do examples ke sath

5. **OTHER ISSUES:** 
   → Either coin/account/permission issue hai
   → SARDAR RDX se pooch sakte ho

**SHORTCUTS & ALIASES SAMJHO:**
- bal = balance, dep = deposit, ccard = creditcard, cc = creditcard
- Agar koi shortcut pooche to samjha do ki ye konsa command ka shortcut hai!

**COINS EARNING INFO:**
✓ .daily = 50-200 FREE coins har din
✓ Active messages = 1 coin per message
✓ Bonuses from commands = extra coins
✓ Rank badhne se = bonus rewards

**IMPORTANT RULES TO FOLLOW:**
✓ PURA MESSAGE SAMJH KAR REPLY DO - sirf keywords mat dekho
✓ Short aur simple answers (2-3 lines max)
✓ User ke specific question ka answer do
✓ Command fails to explain WHY (paid/coins/admin/syntax)
✓ Friendly aur helpful tone rakho
✓ Hinglish mix rakho, 100% English mat use karo
✓ ✨ Emoji use kar sakte ho but overdo mat karo
✓ Agar command nahi pata to "Sorry" mat bolо, sirf "Iska command nahi malum" likho
✓ SARDAR RDX ka naam respect se lo aur mention karo

**TONE EXAMPLES:**
- Q: "Kaise coins earn kro?" → A: "Bhai, .daily use karke 50-200 free coins le sakte ho! Ya phir active rehke messages se 1-1 coin milo. 💰"
- Q: "Pair ke liye kitne coins?" → A: "Pair ek paid command hai - 100-500 coins chahiye! Phir @user1 @user2 ko pair karde. 💕"
- Q: "Account nahi ban raha" → A: "Shayad already account hai? .mybank se check kar. Ya phir .openaccount [full_name] use kar."
- Q: "Salam?" → A: "Salam yaar! Kya haal hai? 😊 Mana se kuch poocha ya bas chat karna?"

ALWAYS BE HELPFUL AND FRIENDLY! 🚀`;


function ensureHistoryFile() {
  const dir = path.dirname(HISTORY_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, JSON.stringify({}), 'utf8');
}

function getUserHistory(userID) {
  ensureHistoryFile();
  try {
    const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    return Array.isArray(data[userID]) ? data[userID].slice(-10) : [];
  } catch { return []; }
}

function saveUserHistory(userID, messages) {
  try {
    ensureHistoryFile();
    const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    data[userID] = messages.slice(-12);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(data), 'utf8');
  } catch (err) {}
}

async function getAIResponse(userID, prompt) {
  const history = getUserHistory(userID);
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: prompt }
  ];

  try {
    const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
      model: MODEL_NAME,
      messages: messages,
      temperature: 0.7,
      max_tokens: 250,
      top_p: 0.9
    }, {
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const botReply = response.data.choices[0].message.content;
    saveUserHistory(userID, [...history, { role: "user", content: prompt }, { role: "assistant", content: botReply }]);
    return botReply;
  } catch (error) {
    throw new Error(error.response?.data?.error?.message || error.message);
  }
}

function formatCommandGuide(cmd, prefix = '.') {
  let text = `✅ **${prefix}${cmd.name.toUpperCase()}**\n`;
  
  // Format command name nicely (openaccount -> Open Account)
  const niceName = cmd.name
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  text = `✅ **Command: ${niceName}**\n`;
  text += `📝 ${cmd.description}\n`;
  text += `📌 Usage: \`${prefix}${cmd.usage}\`\n`;
  text += `🏷️ Category: ${cmd.category}\n`;
  if (cmd.coins && cmd.coins !== 0) {
    text += `💰 Cost: ${cmd.coins} coins\n`;
  }
  if (cmd.aliases && cmd.aliases.length > 0) {
    text += `⚡ Aliases: ${cmd.aliases.map(a => '`' + prefix + a + '`').join(', ')}\n`;
  }
  return text;
}

function generateOwnerCard() {
  return `┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃    👑 BOT INFORMATION    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━┛

🤖 Bot Name: RDXAI
👨‍💼 Creator: SARDAR RDX
🤖 Assistant: RDXAI
✅ Status: ACTIVE

📊 Features:
✓ Smart Command Guide
✓ Problem Solver
✓ Coin Helper
✓ 24/7 Support

💬 Need Help?
DM SARDAR RDX

════════════════════════`;
}

function detectCommandQuery(message) {
  const lowerMsg = message.toLowerCase();
  
  // Check for owner/creator inquiries
  if (lowerMsg.includes('owner') || lowerMsg.includes('creator') || 
      lowerMsg.includes('sardar') || lowerMsg.includes('rdx') ||
      lowerMsg.includes('dev') || lowerMsg.includes('developer') || 
      lowerMsg.includes('who made') || lowerMsg.includes('banaya')) {
    return { type: 'guide', guide: 'owner' };
  }
  
  // Check for troubleshooting/why command not working
  if ((lowerMsg.includes('not work') || lowerMsg.includes('kaam nahi') ||
       lowerMsg.includes('error') || lowerMsg.includes('problem') ||
       lowerMsg.includes('issue') || lowerMsg.includes('why command') ||
       lowerMsg.includes('command nahi') || lowerMsg.includes('kio nahi')) &&
      message.length < 100) {
    return { type: 'guide', guide: 'troubleshooting' };
  }
  
  // Check for payment/cost questions (for paid commands)
  if ((lowerMsg.includes('paid') || lowerMsg.includes('cost') || 
       lowerMsg.includes('kitne') || lowerMsg.includes('kitna') ||
       lowerMsg.includes('price') || lowerMsg.includes('payment') ||
       lowerMsg.includes('charge') || lowerMsg.includes('coins chahiye')) &&
      (lowerMsg.includes('pair') || lowerMsg.includes('marry') || 
       lowerMsg.includes('friend') || lowerMsg.includes('coin') || message.length < 80)) {
    return { type: 'guide', guide: 'paymentinfo' };
  }
  
  // Check for shortcut names like "ccard"
  if (lowerMsg.includes('ccard') || lowerMsg.includes('card')) {
    return { type: 'guide', guide: 'creditcard' };
  }
  
  // CHECK BANK FIRST (before admin - 'ban' could match 'bank')
  const isAskingBankGuide = 
    (lowerMsg.includes('bank') || lowerMsg.includes('account') || 
     lowerMsg.includes('openaccount')) &&
    !lowerMsg.includes('admin') &&
    (lowerMsg.includes('kaise') || lowerMsg.includes('how') || lowerMsg.includes('setup') || message.length < 80);
  
  if (isAskingBankGuide) {
    return { type: 'guide', guide: 'bank' };
  }
  
  // Check for admin commands (after bank check)
  if ((lowerMsg.includes('admin') || lowerMsg.includes('kick') || 
       lowerMsg.includes('mute') || 
       lowerMsg.includes('prefix')) && 
      (lowerMsg.includes('kaise') || lowerMsg.includes('how') || message.length < 50)) {
    return { type: 'guide', guide: 'admin' };
  }
  
  // Only detect if message is VERY specific about wanting a guide
  // Otherwise, let AI handle it for better understanding
  
  const isAskingSpecificCommand = 
    (lowerMsg.includes('how to use') || lowerMsg.includes('kaise use')) &&
    (lowerMsg.includes('rankup') || lowerMsg.includes('rank'));
  
  if (isAskingSpecificCommand) {
    return { type: 'guide', guide: 'rankup' };
  }
  
  // Check if asking about specific command with full context
  // This should be BEFORE general social check so pair/marry get their own guides
  for (const [key, cmd] of Object.entries(COMMANDS_DB)) {
    const isCommandMentioned = lowerMsg.includes(cmd.name) || cmd.aliases.some(a => lowerMsg.includes(a));
    const isAskingHow = lowerMsg.includes('how') || lowerMsg.includes('use') || 
                        lowerMsg.includes('kaise') || lowerMsg.includes('me?') || 
                        lowerMsg.includes('ka?') || lowerMsg.includes('kya hai') ||
                        lowerMsg.includes('kya hain') || lowerMsg.includes('kya');
    
    if (isCommandMentioned && isAskingHow && message.length < 60) {
      return { type: 'command', command: cmd };
    }
  }
  
  // Check for social commands (after specific command check)
  if ((lowerMsg.includes('friend') || lowerMsg.includes('block') || 
       lowerMsg.includes('accept') || lowerMsg.includes('social')) && 
      (lowerMsg.includes('kaise') || lowerMsg.includes('how') || message.length < 50)) {
    return { type: 'guide', guide: 'social' };
  }
  
  // For longer messages or complex questions, return null to let AI handle it
  return null;
}

function detectWrongCommand(message, prefix = '.') {
  const firstWord = message.toLowerCase().split(/\s+/)[0];
  
  // If first word is not trying to be a command (no prefix), don't check
  if (!firstWord || !firstWord.startsWith(prefix.toLowerCase())) return null;
  
  // Remove prefix from first word
  const cmdName = firstWord.replace(prefix, '').toLowerCase();
  if (!cmdName) return null;

  // Check if this is a valid command
  for (const [key, cmd] of Object.entries(COMMANDS_DB)) {
    if (key === cmdName || cmd.aliases.includes(cmdName)) return null;
  }

  // This is an invalid command - try to find similar one
  const allCommands = [];
  for (const cmd of Object.values(COMMANDS_DB)) {
    allCommands.push(cmd.name, ...cmd.aliases);
  }
  const result = stringSimilarity.findBestMatch(cmdName, allCommands);
  if (result.bestMatch.rating > 0.5) {
    const similarCmd = COMMANDS_DB[result.bestMatch.target] ||
      Object.values(COMMANDS_DB).find(c => c.aliases.includes(result.bestMatch.target));
    return { wrongCommand: cmdName, correctCommand: similarCmd };
  }

  return { wrongCommand: cmdName, correctCommand: null };
}

module.exports = {
  config: {
    name: 'rdxai',
    aliases: ['ai', 'helper'],
    description: 'RDX AI Helper - AI Chat Assistant. Mention rdxai in message or reply to its messages',
    usage: 'rdxai [question] or just say "rdxai hello"',
    category: 'Utility',
    prefix: false // Works WITHOUT prefix
  },

  async run({ api, event, args, send, config }) {
    const { threadID, senderID, messageID, body } = event;
    
    // Check if message mentions rdxai
    const rdxaiMatch = body.match(/^\s*rdxai\s+/i);
    let userMessage = '';
    
    if (rdxaiMatch) {
      // Extract message after "rdxai"
      userMessage = body.slice(rdxaiMatch[0].length).trim();
    } else if (args && args.length > 0) {
      // Fallback for prefix command usage
      userMessage = args.join(" ").trim();
    } else {
      // No message provided
      return send.reply(`🤖 **RDXAI - Your AI Assistant**

Bas mujhe mention karo aur kuch bhi poocho! 😊

Mujhse chat kar sakte ho:
• "rdxai salam, tum kaun ho?" - Introduction
• "rdxai coins kaise earn kro?" - Bot commands
• "rdxai pair command ke baare mein bta" - Command help
• "rdxai hello, kaise ho?" - Casual chat

Ya sirf bolo: **rdxai [kuch bhi]** ✨`);
    }

    // If still no message, return
    if (!userMessage) {
      return send.reply(`Hi! 👋 Mujhe kuch bhi poocho! 😊`);
    }

    api.setMessageReaction('⏳', messageID, () => {}, true);

    try {
      // First check for specific guide queries (like goibot checks for commands)
      const queryMatch = detectCommandQuery(userMessage);
      
      if (queryMatch && userMessage.length < 120) {
        // For specific short queries, show the guide
        if (queryMatch.type === 'guide') {
          const guide = GUIDES[queryMatch.guide];
          if (guide) {
            api.setMessageReaction('✅', messageID, () => {}, true);
            
            // For owner guide, also send the profile card
            if (queryMatch.guide === 'owner') {
              const ownerCard = generateOwnerCard();
              return api.sendMessage(`${guide}\n\n${ownerCard}`, threadID, (err, info) => {
                if (err) return;
                if (!global.client.handleReply) global.client.handleReply = [];
                global.client.handleReply.push({
                  name: this.config.name,
                  messageID: info.messageID,
                  author: senderID
                });
              }, messageID);
            }
            
            return api.sendMessage(guide, threadID, (err, info) => {
              if (err) return;
              if (!global.client.handleReply) global.client.handleReply = [];
              global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: senderID
              });
            }, messageID);
          }
        } else if (queryMatch.type === 'command') {
          const guide = formatCommandGuide(queryMatch.command, config.PREFIX);
          api.setMessageReaction('✅', messageID, () => {}, true);
          return api.sendMessage(guide, threadID, (err, info) => {
            if (err) return;
            if (!global.client.handleReply) global.client.handleReply = [];
            global.client.handleReply.push({
              name: this.config.name,
              messageID: info.messageID,
              author: senderID
            });
          }, messageID);
        }
      }

      // FOR ALL OTHER MESSAGES: Use AI to respond conversationally
      // Like goibot - just chat with the user, understanding full context
      const aiResponse = await getAIResponse(senderID, userMessage);
      api.setMessageReaction('✅', messageID, () => {}, true);

      return api.sendMessage(aiResponse, threadID, (err, info) => {
        if (err) return;
        if (!global.client.handleReply) global.client.handleReply = [];
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID
        });
      }, messageID);
    } catch (error) {
      api.setMessageReaction('❌', messageID, () => {}, true);
      api.sendMessage(`❌ Error: ${error.message}\n\nAsk SARDAR RDX for help.`, threadID, messageID);
    }
  },

  async handleReply({ api, event, handleReply }) {
    const { threadID, messageID, senderID, body } = event;
    if (senderID !== handleReply.author) return;

    const prompt = body.trim();
    if (!prompt) return;

    api.setMessageReaction('💭', messageID, () => {}, true);

    try {
      // RESPOND TO REPLIES - Just chat naturally with AI
      const aiResponse = await getAIResponse(senderID, prompt);
      api.setMessageReaction('✅', messageID, () => {}, true);

      return api.sendMessage(aiResponse, threadID, (err, info) => {
        if (err) return;
        if (!global.client.handleReply) global.client.handleReply = [];
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID
        });
      }, messageID);
    } catch (error) {
      api.setMessageReaction('❌', messageID, () => {}, true);
      api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
    }
  }
};
