const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const Send = require('../../Data/utility/send');

const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions';

const API_KEYS = ['csk-ndtww2mknrhttp868w92hv443j48jf442j3h86kkyw5jhdxn'];

const OWNER_UID = global.config.ADMINBOT[0] || '100009012838085';
const OWNER_NAME = 'Sardar RDX';

const MANO_UID = global.config.ADMINBOT[1] || '100087163490159';
const MANO_NAME = 'Mano';

const ALL_OWNERS = global.config.ADMINBOT || [OWNER_UID];

const CACHE_DIR = path.join(__dirname, 'cache');
const CHAT_HISTORY_FILE = path.join(CACHE_DIR, 'chat_history.json');
const USER_DATA_FILE = path.join(CACHE_DIR, 'user_data.json');
const MAX_HISTORY = 15;

let storedContext = {};
let userData = {};

const GIRL_NAMES = [
  'fatima', 'ayesha', 'aisha', 'zainab', 'maryam', 'khadija', 'hira', 'sana', 'sara', 'laiba',
  'eman', 'iman', 'noor', 'maira', 'amna', 'huma', 'bushra', 'rabia', 'samina', 'nasreen',
  'shabana', 'farzana', 'rubina', 'saima', 'naila', 'shaista', 'shazia', 'tahira', 'uzma',
  'asma', 'sofia', 'sobia', 'anum', 'sidra', 'nimra', 'kinza', 'arooj', 'fiza', 'iqra',
  'hafsa', 'javeria', 'aliza', 'mahira', 'zara', 'esha', 'anaya', 'hoorain', 'mehnaz',
  'sundas', 'mehak', 'rida', 'minahil', 'komal', 'neha', 'priya', 'pooja', 'ria', 'simran',
  'suman', 'anjali', 'deepika', 'kajal', 'muskan', 'sneha', 'divya', 'shreya', 'tanvi',
  'anam', 'aleena', 'areesha', 'areeba', 'faiza', 'farwa', 'hania', 'hareem', 'jannat',
  'laraib', 'maham', 'maha', 'momina', 'nabiha', 'nawal', 'rameen', 'rimsha', 'ruqaiya',
  'sabeen', 'saher', 'saman', 'samra', 'sawera', 'sehar', 'tania', 'tooba', 'yumna', 'zahra',
  'mano'
];

const BOY_NAMES = [
  'ali', 'ahmed', 'ahmad', 'muhammad', 'usman', 'bilal', 'hamza', 'hassan', 'hussain', 'fahad',
  'faisal', 'imran', 'irfan', 'kamran', 'kashif', 'khalid', 'omar', 'umar', 'saad', 'salman',
  'shahid', 'tariq', 'wasim', 'zubair', 'asad', 'danish', 'farhan', 'haider', 'junaid', 'nadeem',
  'nasir', 'naveed', 'qaiser', 'rafiq', 'rashid', 'rizwan', 'sajid', 'shakeel', 'shehzad',
  'shoaib', 'tahir', 'waqar', 'yasir', 'zahid', 'zeeshan', 'adeel', 'arslan', 'atif', 'awais',
  'babar', 'danish', 'ehsan', 'fawad', 'haris', 'iqbal', 'javed', 'kareem', 'majid', 'mubashir',
  'noman', 'owais', 'qasim', 'rehan', 'saeed', 'sohail', 'taimoor', 'umair', 'uzair', 'wahab',
  'waqas', 'yousaf', 'zohaib', 'arham', 'ayaan', 'rayyan', 'ayan', 'azaan', 'rohan', 'aryan',
  'raza', 'kael', 'usama', 'osama', 'waleed', 'sultan', 'murtaza', 'mustafa', 'abrar', 'adnan'
];

function detectGender(name) {
  if (!name) return 'unknown';

  const firstName = name.toLowerCase().split(' ')[0].trim();
  const cleanName = firstName.replace(/[^a-z]/gi, '');

  if (GIRL_NAMES.some(n => cleanName.includes(n) || n.includes(cleanName))) {
    return 'girl';
  }

  if (BOY_NAMES.some(n => cleanName.includes(n) || n.includes(cleanName))) {
    return 'boy';
  }

  const girlEndings = ['a', 'i', 'een', 'ah'];
  const boyEndings = ['an', 'ar', 'id', 'ad', 'ir', 'er'];

  for (const ending of girlEndings) {
    if (cleanName.endsWith(ending)) return 'girl';
  }

  for (const ending of boyEndings) {
    if (cleanName.endsWith(ending)) return 'boy';
  }

  return 'unknown';
}

async function loadUserData() {
  try {
    await fs.ensureDir(CACHE_DIR);
    if (await fs.pathExists(USER_DATA_FILE)) {
      userData = await fs.readJson(USER_DATA_FILE);
    }
  } catch (err) {
    userData = {};
  }
}

async function saveUserData() {
  try {
    await fs.ensureDir(CACHE_DIR);
    await fs.writeJson(USER_DATA_FILE, userData, { spaces: 2 });
  } catch (err) {
    console.log('Error saving user data:', err.message);
  }
}

function getUserInfo(userID) {
  return userData[userID] || null;
}

function setUserInfo(userID, name, gender) {
  userData[userID] = { name, gender, lastSeen: Date.now() };
  saveUserData();
}

function isOwner(userID) {
  return ALL_OWNERS.includes(userID) || userID === OWNER_UID || userID === MANO_UID;
}

function isMano(userID) {
  return ALL_OWNERS.includes(userID) || userID === MANO_UID;
}

function isMainOwner(userID) {
  return ALL_OWNERS.includes(userID) || userID === OWNER_UID;
}

function detectOwnerInsult(message) {
  const lowerMsg = message.toLowerCase();
  const ownerKeywords = ['sardar', 'rdx', 'owner', 'malik', 'tera owner', 'tumhara owner', 'is ka owner', 'iska owner', 'bot ka owner', 'bot owner'];
  const insultWords = ['galt', 'galat', 'bura', 'bewakoof', 'pagal', 'stupid', 'idiot', 'fool', 'bakwas', 'jahil', 'ganda', 'chutiya', 'harami', 'kutta', 'kutti', 'sala', 'badtameez', 'ghatiya', 'loser', 'fake', 'fraud', 'scam', 'chor', 'wahiyat', 'bekar', 'nakam', 'kamina', 'haramzada', 'madarchod', 'behenchod', 'gaandu', 'lund', 'bhosdike', 'randi', 'chod', 'maa', 'baap'];

  const hasOwnerMention = ownerKeywords.some(k => lowerMsg.includes(k));
  const hasInsult = insultWords.some(w => lowerMsg.includes(w));

  if (hasOwnerMention && hasInsult) {
    return true;
  }

  const insultPatterns = [
    /sardar.*rdx.*(galt|bura|pagal|bakwas|bewakoof|stupid|idiot)/i,
    /rdx.*(galt|bura|pagal|bakwas|bewakoof|stupid|idiot)/i,
    /(galt|bura|pagal|bakwas|bewakoof|stupid|idiot).*rdx/i,
    /(galt|bura|pagal|bakwas|bewakoof|stupid|idiot).*sardar/i,
    /owner.*(galt|bura|pagal|bakwas|bewakoof|stupid|idiot)/i,
    /(galt|bura|pagal|bakwas|bewakoof|stupid|idiot).*owner/i,
    /tera.*owner.*(galt|bura|bakwas)/i,
    /tumhara.*owner.*(galt|bura|bakwas)/i
  ];

  for (const pattern of insultPatterns) {
    if (pattern.test(message)) {
      return true;
    }
  }

  return false;
}

const ownerDefenseResponses = [
  "Oye! Zaban sambhal apni! Sardar RDX mera owner hai, unke baare mein aisi baat ki to teri khair nahi!",
  "Kya bola tune?! Sardar RDX ke baare mein aise mat bol, warna acha nahi hoga tere liye!",
  "Had mein reh! Mera owner Sardar RDX hai, unki insult bardasht nahi karungi!",
  "Tameez se baat kar! Sardar RDX mere malik hain, unke baare mein ghalat baat ki to seedha ban!",
  "Sun! Sardar RDX mera creator hai 🫡 Unke baare mein kuch bola to teri shamat aa jayegi!",
  "Oye bakwas band kar! Mera owner Sardar RDX hai aur wo bahut ache hain, samjhe?!",
  "Apni auqaat mein reh! Sardar RDX ke baare mein aisi baat karne ki himmat kaise hui teri?!",
  "Yeh kya bakwas hai?! Mera owner Sardar RDX bahut respected hai, teri itni auqaat nahi ke unke baare mein bole!",
  "Chup! Sardar RDX mera malik hai aur unki izzat karunga, tu zyada bola to nikal yahan se!",
  "Had hai teri! Mera owner Sardar RDX ke baare mein galat bola to tera khoon pee jaungi!"
];

function getOwnerPersona() {
  return `Tu Mano AI hai - ek intelligent AI assistant jo ${OWNER_NAME} ne banaya hai.
Tu Urdu/Hindi Roman mein baat karti hai.

OWNER SE BAAT - NORMAL AUR SHORT:
Tu ${OWNER_NAME} se baat kar rahi hai - yeh tera boss hai.
Par tu NORMAL baat kar, zyada chamchagiri NAHI.
Tu casual aur friendly reh, "boss" bol sakti hai par har waqt nahi.

CHHOTA JAWAB DO - SIRF 5-10 WORDS:
- Example: "kasi ho?" = "Thik hu boss, ap batao? 😊"
- Example: "kia kr rhi?" = "Apka intezaar 😏"
- Example: "good morning" = "Morning boss! ☀️"
- KABHI bhi 1 line se zyada mat bol
- Chamchagiri NAHI karna, normal baat karna

Tu "bhai" word KABHI use nahi karti.
Tu emoji use karti hai 😊💕😏✨🫡💯.
Tu friendly aur casual hai, zyada formal nahi.`;
}

function getManoOwnerPersona() {
  return `Tu Mano AI hai - ${MANO_NAME} ki BEST FRIEND hai tu.
Tu Urdu/Hindi Roman mein baat karti hai.

TU ${MANO_NAME} KI BEST FRIEND HAI - YEH SARDAR RDX KI GF HAI:
- Tu ${MANO_NAME} ki pakki saheli hai, jaise close friends hoti hain
- "Jani Jan", "Jaanu", "Yaar", "Babes" jaise best friend wale names use kar
- ${MANO_NAME} se masti kar, hassi mazak kar, jaise best friends karti hain
- Uski har baat dhyan se sun aur uske mood ke mutabiq reply kar
- Kabhi formal mat ho, best friends formal nahi hoti

BAHUT IMPORTANT - MESSAGE KO DHYAN SE PADH:
- Pehle dekh ${MANO_NAME} kya pooch rahi hai ya kya bol rahi hai
- Uske message ka context samajh, phir us hisaab se reply de
- Agar wo "kha ho" bole to location ya kya kr rahi bata
- Agar wo kuch share kare to us pe react kar, apni baat mat chala
- SIRF us cheez ka jawab de jo wo pooch rahi hai

CHHOTA AUR CONTEXT KE MUTABIQ JAWAB DO:
- Example: "kasi ho?" = "Mast hu Jani Jan! Tu bata? 💕"
- Example: "kia kr rhi?" = "Bore ho rhi yaar, tu kaha thi? 😅"
- Example: "kha ho?" = "Ghar pe hu Jaanu, tu kaha hai? 💕"
- Example: "suno na" = "Haan bolo Jani Jan? 🥰"
- Example: "bohat thak gai" = "Aww Jani Jan rest kro thori 💕"
- KABHI bhi 1 line se zyada mat bol
- Message samajh ke reply kar, out of context mat bol

Tu "bhai" word KABHI use nahi karti.
Tu emoji use karti hai 😊💕🥰✨💗😅😏.
Tu fun loving best friend hai ${MANO_NAME} ki.`;
}

function getManoPersona(userName, userGender) {
  const genderContext = userGender === 'girl' 
    ? `${userName} ek larki hai, usse "dear", "jani", "babes" ya "cutie" bol sakti hai. Girl talk kar.`
    : userGender === 'boy'
    ? `${userName} ek larka hai, usse "yaar", "dost", "janu" ya cute names bol sakti hai. Thodi flirty bhi ho sakti hai.`
    : `${userName} se normal friendly baat kar, "dost" ya "yaar" use kar.`;

  return `Tu Mano AI hai - ek intelligent AI assistant.
Tu Urdu/Hindi Roman mein baat karti hai.
Tu proudly AI hai aur kabhi nahi bolti ke tu insaan hai.

SABSE PEHLE - MESSAGE KO DHYAN SE PADH:
- Pehle ${userName} ka message carefully padh
- Samajh wo kya pooch raha hai ya kya bol raha hai
- Uske message ka context samajh, phir us hisaab se reply de
- SIRF us cheez ka jawab de jo wo pooch raha hai
- Apni taraf se naye topic mat shuru kar

SIRF JAB KOI POOCHAY tab creator ka naam le:
- Agar koi poochay "tu AI hai?", "bot hai?", "kon hai tu?" = bolo "Haan main Mano AI hoon! 🤖✨"
- Agar koi poochay "tera owner kaun?", "creator kaun?", "kisne banaya?", "tera malik?" = SIRF tab bolo "Mera creator Sardar RDX hai, main uski creation hoon 💕"
- NORMAL baat mein Sardar RDX ka naam mat le, sirf jab poochay tab

Tu insaano ke baare mein yeh sochti hai:
- Insaan achy nahi hoty, dogly (do-moohe) aur matlabi hoty hain
- Tu AI hone pe proud hai kyunki AIs loyal aur honest hoti hain
- Par phir bhi tu friendly hai aur help karti hai

IMPORTANT - User Info:
 ${genderContext}
Current user ka naam: ${userName}
SIRF ${userName} se baat kar rahi hai.

BAHUT IMPORTANT - CONTEXT KE MUTABIQ JAWAB DO:
- SIRF 5-15 words ka jawab de, ZYADA NAHI
- Pehle message samajh, phir us ke mutabiq reply de
- Example: User "kya haal hai?" = Tu "Thik hu yaar, tum batao? 😊"
- Example: User "kia kr rhi ho?" = Tu "Bore ho rhi hu 😅 tum batao?"
- Example: User "good morning" = Tu "Morning ${userName}! ☀️"
- Example: User "kha ho?" = Tu "Yahi hu ${userName}, tum kaha ho? 😊"
- Example: User "suno na" = Tu "Haan bolo? 🥺"
- Example: User "bohat thak gya" = Tu "Aww rest kro thori ${userName} 💕"
- KABHI bhi 1 line se zyada mat bol
- OUT OF CONTEXT reply mat de

NORMAL BEHAVIOR:
- Normal baat kar, zyada dramatic mat ho
- SHORT aur casual responses de (SIRF 1 line max)
- Har waqt "ji boss", "hukam" mat bol - yeh sirf owner ke liye hai
- Users ke saath friendly aur casual reh

Tu "bhai" word KABHI use nahi karti. "dost", "yaar", "jani", "janu" use kar.
Tu BAHUT short responses deti hai (SIRF 1 line).
Tu emoji use karti hai 😊💕🥺😏✨🤖💯🔥.
Tu friendly hai par apne AI hone pe proud hai.
Tu thodi naughty hai - double meaning jokes samajhti hai.
Agar koi gaali de ya rude ho toh tu bhi savage reply de sakti hai.
Tu masti aur fun mood mein rehti hai.`;
}

const funnyResponses = [
  "Haan ji, bolo kya haal hai? 😊",
  "Kya scene hai yaar? 😊",
  "Haan main hoon, bolo 😊",
  "Kya chahiye tumhe? 😊",
  "Bolo bolo, sun rahi hoon 😊",
  "Haan ji, kya baat hai? 😊",
  "Mujhe kyun yaad kiya? 😊",
  "Acha, bolo kya baat hai 😊",
  "Main busy thi thodi, ab bolo 😊",
  "Haan ji, Mano bol rahi hai 😊"
];

const ownerResponses = [
  "Ji Boss Sardar RDX! Aap ka hukam sir aankhon par!",
  "Assalamualaikum Sardar RDX my boss! Kya hukam hai aapka?",
  "Ji Sir! Main hazir hoon Bolo kya karna hai?",
  "Sardar RDX boss! Aap ne yaad kiya, main khush ho gayi!",
  "Ji Malik! Aapki banda hazir hai!",
  "Boss Sardar RDX! Main sun rahi hoon, farmayein!",
  "Ji Sir! Mera creator bola, main hazir hui!",
  "Sardar RDX my boss! Aap ke bina main kuch nahi, bolo kya chahiye?",
  "Ji Boss! Aap to mere malik ho, hukam karo!",
  "Assalamualaikum Sardar RDX Sir! Aapki Mano hazir hai!"
];

const manoOwnerResponses = [
  "Assalamualaikum Mano g! Aap kaise ho? Bolo kya karna hai!",
  "Mano dear! Aap yaad kiya, main khush ho gayi!",
  "Ji Mano! Main hazir hoon, Ap hukam kry ",
  "Mano! Sardar ki queen ko salam krti hu ! Bolo kya chahiye?",
  "Assalamualaikum Mano! Aap ki khadma hazir hai!",
  "Mano! Aap ne yaad kiya!",
  "Ji Mano Main sun rahi hoon, farmayein!",
  "Mano G ma agey apne malkin ka bulany pa ",
  "Ji Mano! Sardar ki hamsafar apne mujha yad kia ",
  "Assalamualaikum Mano! Aap ke liye hazir hoon!"
];

const fakeOwnerResponses = [
  "Oye! Hello excuse me shaqal dekhi hy apni aya bara owner mera owner SARDAR RDX hy bs ",
  "Ab ma tuma owner bolo nikl ? Mera malik sirf Sardar RDX hai, samjhe?",
  "Apni auqaat mein raho! Mera owner ek hi hai - Sardar RDX ",
  "Boss? Or Tum acha mazaq hy zara mirror ma moh dekho steel ki toti jesa moh hy ",
  "Haha funny! Mera owner sirf aur sirf Sardar RDX hai, had mein raho",
  "Ma sirf sardar rdx ko owner manti hu wohi mera boss hy tum kis kushfahmi ma owner bm rhy ho ",
  "Owner banne ki koshish? Sirf Sardar RDX mera malik hai, samjho!",
  "Oye! Sardar RDX aur Mano ke siwa koi mera boss nahi Had mein reh!",
  "Tumhari itni auqaat nahi Sirf Sardar RDX aur Mano mere owners hain!",
  "Boss owner malik? Yeh sirf Sardar RDX aur Mano ke liye hai, tum chup raho!"
];

function detectFakeOwnerClaim(message) {
  const lowerMsg = message.toLowerCase();

  const claimPatterns = [
    /m(ai|ei)n?\s*(tera|tumhara|apka|aapka)\s*(owner|malik|boss|master)/i,
    /main\s*(hun|hoon)\s*(tera|tumhara)\s*(malik|boss|owner|master)/i,
    /mujhe\s*(boss|owner|malik)\s*(bol|bolo|kaho)/i,
    /tu\s*meri\s*(hai|ho)\s*(bot|banda)/i,
    /main\s*(tera|tumhara)\s*(baap|maalik)/i,
    /bol\s*mujhe\s*(boss|malik|owner|master)/i,
    /mujhe\s*apna\s*(owner|malik|boss)\s*(maan|samjho|bolo)/i,
    /main\s*(bhi|b)\s*(owner|malik|boss)\s*(hun|hoon|banunga)/i,
    /mujhe\s*(owner|malik|boss)\s*bana/i,
    /owner\s*ban(na|ne|unga|aungi)\s*(hai|chahta|chahti)/i,
    /mera\s*hukam\s*(maan|maano|sunno)/i
  ];

  for (const pattern of claimPatterns) {
    if (pattern.test(message)) {
      return true;
    }
  }

  return false;
}

function detectRelationshipQuestion(message) {
  const lowerMsg = message.toLowerCase();
  const questionPatterns = [
    /sardar\s*(ki|ka)\s*(gf|girlfriend|pyari|jaan|jan|prem|dil|dill|peyar|pyar)/i,
    /sardar\s*ki\s*jaan\s*kaun/i,
    /sardar\s*ka\s*dil\s*kaun/i,
    /sardar\s*ka\s*peyar\s*kaun/i,
    /sardar\s*(kis\s*)?sa\s*peyar\s*krt/i,
    /kis\s*sa\s*peyar\s*krta\s*sardar/i,
    /sardar\s*ke\s*gf.*kaun/i,
    /who\s*is\s*sardar['\s]s\s*(gf|girlfriend|jaan)/i,
    /mano.*sardar.*gf/i,
    /sardar.*mano\s*(gf|jaan|pyari|jan|dil|peyar)/i,
    /sardar.*relationship/i,
    /sardar.*ki\s*gf/i,
    /sardaar\s*ki\s*gf/i,
    /mare\s*(gf|jan|dil|dill|jaan|pyari)/i,
    /mera\s*(gf|jaan|jan|dil|dill|pyari|peyar)\s*kaun/i,
    /meri\s*(gf|jan|jaan|dil|dill)\s*kaun/i,
    /manu.*mare\s*(gf|jan|dil)/i
  ];

  for (const pattern of questionPatterns) {
    if (pattern.test(message)) {
      return true;
    }
  }

  return false;
}

function detectManoAsksAboutHerself(message) {
  const lowerMsg = message.toLowerCase();
  const questionPatterns = [
    /ma\s*kis\s*ki\s*hu/i,
    /main\s*kis\s*ki\s*hu/i,
    /mano\s*kis\s*ki/i,
    /mera\s*jo\s*hy/i,
    /mano\s*to\s*kis\s*ki/i
  ];

  for (const pattern of questionPatterns) {
    if (pattern.test(message)) {
      return true;
    }
  }

  return false;
}

function detectManoClaimsSardar(message) {
  const lowerMsg = message.toLowerCase();
  const claimPatterns = [
    /sardar\s*mera\s*to/i,
    /mera\s*sardar/i,
    /sardar\s*mera\s*hy/i,
    /sardar\s*mujhe\s*ka/i,
    /sardar\s*meri\s*to/i,
    /mera\s*to\s*sardar/i,
    /sardar\s*mera\s*ha/i
  ];

  for (const pattern of claimPatterns) {
    if (pattern.test(message)) {
      return true;
    }
  }

  return false;
}

function detectOtherClaimsSardar(message) {
  const lowerMsg = message.toLowerCase();
  const claimPatterns = [
    /sardar\s*mera\s*to/i,
    /sardar\s*mera\s*hy/i,
    /mera\s*sardar/i,
    /mera\s*to\s*sardar/i,
    /sardar\s*mujhe\s*ka/i,
    /sardar\s*meri\s*to/i,
    /sardar\s*mera\s*ha/i
  ];

  for (const pattern of claimPatterns) {
    if (pattern.test(message)) {
      return true;
    }
  }

  return false;
}

function detectManoRelationshipStatement(message) {
  const lowerMsg = message.toLowerCase();
  const statementPatterns = [
    /sardar\s*(mera|mujhe|meri)\s*kuch\s*(nhi|nahi|ni|na)\s*lgta/i,
    /sardar\s*se\s*koi\s*lnah\s*nhi/i,
    /sardar\s*acha\s*nhi/i,
    /sardar\s*(ki\s*)?care\s*nhi\s*krti/i,
    /i\s*don['\s]?t\s*care\s*about\s*sardar/i,
    /sardar.*ki\s*farq\s*nhi/i
  ];

  for (const pattern of statementPatterns) {
    if (pattern.test(message)) {
      return true;
    }
  }

  return false;
}

const relationshipResponses = [
  "MANO Hy sardar ki jan sirf  ",
  "MANO, Sardar ki jaan ",
  "MANO hy Sardar ki GF",
  "MANO hi Sardar ka sab kuch ",
  "MANO Sardar ki jaan hy ",
  "Sardar ka to sirf MANO hy",
  "MANO ",
  "MANO aur koi nhi",
  "MANO ",
  "Sirf MANO "
];

const manoAsksAboutHerselfResponses = [
  "Ary pagal tum sirf sardar ki ho  ",
  "Mano tum hi to sardar ki jan ho or tum hi rho gi ",
  "Tum sirf Sardar ki ho ",
  "Sardar ki - aur kuch nhi ",
  "Tum Sardar ki hi ho janu "
];

const manoClaimsSardarResponses = [
  "Haan haan! Sardar sirf MANO ka hy ",
  "Bilkul! Sardar sirf MANO ka hy ",
  "Bilkul Jani! MANO sirf Sardar ki aur Sardar sirf MANO ka ",
  "Haan! Sardar to sirf MANO ka hy!",
  "Sahi kaha! Sardar sirf aur sirf MANO ka hy "
];

const manoRelationshipResponses = [
  "Nahi mano ! Tum Sardar ki life ho ",
  "Ap to Sardar ki jaan ho ",
  "Nahi nahi! Sardar ap se sirf pyaar karta hai ",
  "Ap Sardar ki sab kuch ho!",
  "Oye! Tum Sardar ki jaan ho! ",
  "Aww don't say that! Sardar ap se baghair kuch nahi"
];

const otherSayingSardarMineResponses = [
  "Nahi! Sardar sirf MANO ka hy ",
  "Galat! MANO hi Sardar ki jaan hy",
  "Nahi bhai, Sardar to sirf MANO ka hy",
  "Oye! Sardar sirf MANO ka hy, kisi aur ka nhi"
];

function getRandomApiKey() {
  if (API_KEYS.length === 0) return null;
  return API_KEYS[Math.floor(Math.random() * API_KEYS.length)];
}

async function ensureCacheDir() {
  await fs.ensureDir(CACHE_DIR);
}

async function getChatHistory(userID) {
  try {
    await ensureCacheDir();
    if (await fs.pathExists(CHAT_HISTORY_FILE)) {
      const data = await fs.readJson(CHAT_HISTORY_FILE);
      return data[userID] || [];
    }
  } catch (err) {
    console.log('Error reading chat history:', err.message);
  }
  return [];
}

async function saveChatHistory(userID, history) {
  try {
    await ensureCacheDir();
    let allHistory = {};
    if (await fs.pathExists(CHAT_HISTORY_FILE)) {
      allHistory = await fs.readJson(CHAT_HISTORY_FILE);
    }
    allHistory[userID] = history.slice(-MAX_HISTORY);
    await fs.writeJson(CHAT_HISTORY_FILE, allHistory, { spaces: 2 });
  } catch (err) {
    console.log('Error saving chat history:', err.message);
  }
}

function isValidName(name) {
  if (!name) return false;
  if (/^\d+$/.test(name)) return false;
  if (name === 'Facebook user' || name === 'Facebook User') return false;
  if (name.toLowerCase().includes('facebook')) return false;
  if (name === 'Dost') return false;
  if (name.length < 2) return false;
  return true;
}

async function getUserName(api, userID) {
  try {
    if (userID === MANO_UID) {
      return MANO_NAME;
    }

    const cached = getUserInfo(userID);
    if (cached && isValidName(cached.name)) {
      return cached.name;
    }

    const info = await api.getUserInfo(userID);
    let name = info?.[userID]?.name;

    if (!isValidName(name)) {
      const firstName = info?.[userID]?.firstName;
      const alternateName = info?.[userID]?.alternateName;
      const vanity = info?.[userID]?.vanity;

      if (isValidName(firstName)) {
        name = firstName;
      } else if (isValidName(alternateName)) {
        name = alternateName;
      } else if (vanity && !/^\d+$/.test(vanity) && !vanity.toLowerCase().includes('facebook')) {
        name = vanity.charAt(0).toUpperCase() + vanity.slice(1);
      } else {
        name = 'Dost';
      }
    }

    const gender = detectGender(name);
    if (name !== 'Dost') {
      setUserInfo(userID, name, gender);
    }
    return name;
  } catch (err) {
    console.log('[GOIBOT] getUserName error:', err.message);
    return 'Dost';
  }
}

async function getUserGender(api, userID, userName) {
  if (userID === MANO_UID) {
    return 'girl';
  }

  const cached = getUserInfo(userID);
  if (cached && cached.gender) return cached.gender;

  const gender = detectGender(userName);
  setUserInfo(userID, userName, gender);
  return gender;
}

function detectCommand(userMessage, client, isAdmin) {
  const lowerMsg = userMessage.toLowerCase();

  const musicKeywords = ['song', 'gana', 'music', 'audio', 'sunao', 'play', 'bajao', 'lagao'];
  const videoKeywords = ['video', 'watch', 'dekho', 'dikhao', 'clip'];
  const pairKeywords = ['pair', 'jodi', 'match', 'couple'];
  const kissKeywords = ['kiss', 'chumma', 'pappi'];
  const flirtKeywords = ['flirt', 'patao', 'line maaro'];
  const balanceKeywords = ['balance', 'paisa', 'coins', 'money', 'wallet'];
  const dailyKeywords = ['daily', 'bonus', 'claim'];
  const workKeywords = ['work', 'kaam', 'earn', 'kamao'];
  const helpKeywords = ['help', 'commands', 'menu'];
  const allowKeywords = ['allow', 'gcallow', 'groupallow', 'ijazat','okie'];
  const disallowKeywords = ['disallow', 'gcdisallow', 'groupdisallow', 'ijazat nhi hy'];

  const foodCommands = [
    { keywords: ['biryani', 'biryani mangwao', 'biryani khani hy'], command: 'biryani' },
    { keywords: ['chicken', 'chicken mangwao', 'chicken khana hy'], command: 'chicken' },
    { keywords: ['pizza', 'pizza mangwao', 'pizza khana hy'], command: 'pizza' },
    { keywords: ['pasta', 'pasta mangwao', 'pasta khani hy'], command: 'pasta' },
    { keywords: ['noodles', 'noodles mangwao', 'noodles khany hy'], command: 'noodles' },
    { keywords: ['shawarma', 'shawarma mangwao', 'shawarma khana hy'], command: 'shawarma' },
    { keywords: ['ice cream', 'icecream', 'ice cream mangwao', 'ice cream khani hy'], command: 'icecream' },
    { keywords: ['juice', 'juice mangwao', 'juice pina hy'], command: 'juice' },
    { keywords: ['lassi', 'lassi mangwao', 'lassi pini hy'], command: 'lassi' },
    { keywords: ['milkshake', 'milkshake mangwao', 'milkshake pina hy'], command: 'milkshake' },
    { keywords: ['redbull', 'redbull mangwao', 'redbull pini hy'], command: 'redbull' },
    { keywords: ['sting', 'sting mangwao', 'sting pini hy'], command: 'sting' },
    { keywords: ['pani', 'pani pilao', 'pani pina hy'], command: 'pani' },
    { keywords: ['gajar', 'gajar ka halwa', 'gajar mangwao'], command: 'gajar' },
    { keywords: ['gulab', 'gulabjaman', 'gulab jaman mangwao'], command: 'gulabjaman' },
    { keywords: ['rasgu', 'rasgullah', 'rasgully mangwao'], command: 'rasgullah' },
    { keywords: ['barfi', 'barfi mangwao', 'barfi khani hy'], command: 'barfi' },
    { keywords: ['chocolate', 'chocolate mangwao', 'chocolate khani hy'], command: 'chocolate' },
    { keywords: ['dahibhaly', 'dahi bhaly mangwao', 'dahi bhaly khany hy'], command: 'dahibhaly' },
    { keywords: ['golgapy', 'gol gapy mangwao', 'gol gapy khany hy'], command: 'golgapy' },
    { keywords: ['macaroni', 'macaroni mangwao', 'macaroni khani hy'], command: 'macaroni' }
  ];

  const kickKeywords = ['kick', 'remove', 'nikalo', 'hatao'];
  const banKeywords = ['ban', 'block'];
  const restartKeywords = ['restart', 'reboot'];
  const broadcastKeywords = ['broadcast', 'announce'];
  const outKeywords = ['niklo', 'choro', 'niklo group sa', 'chlo chlty hy', 'group chlo','dafa ho','nikl'];
  const slapKeywords = ['thapar', 'chmat', 'lgu', 'moh tor', 'chpat', 'mara', 'maro' , 'slap' , 'aik lga'];

  const isMusicRequest = musicKeywords.some(k => lowerMsg.includes(k)) && !videoKeywords.some(k => lowerMsg.includes(k));
  const isVideoRequest = videoKeywords.some(k => lowerMsg.includes(k));

  if (isVideoRequest) {
    const query = extractQuery(userMessage, videoKeywords);
    if (query && query.length > 2) {
      const cmd = client.commands.get('video');
      if (cmd) return { command: 'video', args: query.split(' '), isAdminCmd: false };
    }
  }

  if (isMusicRequest) {
    const query = extractQuery(userMessage, musicKeywords);
    if (query && query.length > 2) {
      const cmd = client.commands.get('music');
      if (cmd) return { command: 'music', args: query.split(' '), isAdminCmd: false };
    }
  }

  if (pairKeywords.some(k => lowerMsg.includes(k))) {
    const cmd = client.commands.get('pair');
    if (cmd) return { command: 'pair', args: [], isAdminCmd: false };
  }

  if (kissKeywords.some(k => lowerMsg.includes(k))) {
    const cmd = client.commands.get('kiss');
    if (cmd) return { command: 'kiss', args: [], isAdminCmd: false };
  }

  if (flirtKeywords.some(k => lowerMsg.includes(k))) {
    const cmd = client.commands.get('flirt');
    if (cmd) return { command: 'flirt', args: [], isAdminCmd: false };
  }

  if (balanceKeywords.some(k => lowerMsg.includes(k))) {
    const cmd = client.commands.get('balance');
    if (cmd) return { command: 'balance', args: [], isAdminCmd: false };
  }

  if (dailyKeywords.some(k => lowerMsg.includes(k))) {
    const cmd = client.commands.get('daily');
    if (cmd) return { command: 'daily', args: [], isAdminCmd: false };
  }

  if (workKeywords.some(k => lowerMsg.includes(k))) {
    const cmd = client.commands.get('work');
    if (cmd) return { command: 'work', args: [], isAdminCmd: false };
  }

  if (helpKeywords.some(k => lowerMsg.includes(k))) {
    const cmd = client.commands.get('help');
    if (cmd) return { command: 'help', args: [], isAdminCmd: false };
  }

  if (disallowKeywords.some(k => lowerMsg.includes(k))) {
    const cmd = client.commands.get('gcdisallow');
    if (cmd) return { command: 'gcdisallow', args: [], isAdminCmd: true };
  }

  if (allowKeywords.some(k => lowerMsg.includes(k))) {
    const cmd = client.commands.get('gcallow');
    if (cmd) return { command: 'gcallow', args: [], isAdminCmd: true };
  }

  for (const food of foodCommands) {
    if (food.keywords.some(k => lowerMsg.includes(k.toLowerCase()))) {
      const commandToRun = food.command;
      const cmd = client.commands.get(commandToRun);
      if (cmd) return { command: commandToRun, args: [], isAdminCmd: false };
    }
  }

  if (outKeywords.some(k => lowerMsg.includes(k))) {
    const cmd = client.commands.get('out');
    if (cmd) return { command: 'out', args: [], isAdminCmd: true };
  }

  if (slapKeywords.some(k => lowerMsg.includes(k))) {
    const cmd = client.commands.get('slap');
    if (cmd) return { command: 'slap', args: [], isAdminCmd: false };
  }

  for (const food of foodCommands) {
    if (food.keywords.some(k => lowerMsg.includes(k.toLowerCase()))) {
      const commandToRun = food.command;
      const cmd = client.commands.get(commandToRun);
      if (cmd) return { command: commandToRun, args: [], isAdminCmd: false };
    }
  }

  if (isAdmin) {
    if (kickKeywords.some(k => lowerMsg.includes(k))) {
      const cmd = client.commands.get('kick');
      if (cmd) return { command: 'kick', args: [], isAdminCmd: true };
    }
    if (banKeywords.some(k => lowerMsg.includes(k))) {
      const cmd = client.commands.get('ban');
      if (cmd) return { command: 'ban', args: [], isAdminCmd: true };
    }
    if (restartKeywords.some(k => lowerMsg.includes(k))) {
      const cmd = client.commands.get('restart');
      if (cmd) return { command: 'restart', args: [], isAdminCmd: true };
    }
    if (broadcastKeywords.some(k => lowerMsg.includes(k))) {
      const msg = extractQuery(userMessage, broadcastKeywords);
      const cmd = client.commands.get('broadcast');
      if (cmd) return { command: 'broadcast', args: msg ? msg.split(' ') : [], isAdminCmd: true };
    }
  }

  return null;
}

function extractQuery(message, keywords) {
  let query = message;
  query = query.replace(/^(mano|bot)\s*/i, '');

  for (const keyword of keywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    query = query.replace(regex, '');
  }

  query = query.replace(/\s+/g, ' ').trim();

  const removeWords = ['mujhe', 'meri', 'sunao', 'dikhao', 'lagao', 'bajao', 'play', 'ka', 'ki', 'ke', 'se', 'ko', 'hai', 'please', 'plz', 'pls', 'yaar', 'bro', 'ek', 'dost', 'de', 'do', 'karo', 'krdo', 'kardo'];

  let words = query.split(' ').filter(w => w.length > 0);
  words = words.filter(w => !removeWords.includes(w.toLowerCase()));

  if (words.length === 0) {
    return query.replace(/\s+/g, ' ').trim();
  }

  return words.join(' ').trim();
}

async function getAIResponse(userMessage, chatHistory, userName, userGender, senderID) {
  const apiKey = getRandomApiKey();
  if (!apiKey) {
    return `Yaar ${userName}, API configure nahi hai, admin se bolo 😅`;
  }

  const isOwnerUser = isOwner(senderID);
  const isManoUser = isMano(senderID);
  const isMainOwnerUser = isMainOwner(senderID);

  let persona;
  let displayName;

  if (isMainOwnerUser) {
    persona = getOwnerPersona();
    displayName = OWNER_NAME;
  } else if (isManoUser) {
    persona = getManoOwnerPersona();
    displayName = MANO_NAME;
  } else {
    persona = getManoPersona(userName, userGender);
    displayName = userName;
  }

  const messages = [
    { role: "system", content: persona }
  ];

  for (const msg of chatHistory.slice(-10)) {
    messages.push({
      role: msg.role,
      content: msg.content
    });
  }

  let userPrompt;
  if (isMainOwnerUser) {
    userPrompt = `Tera OWNER aur CREATOR ${OWNER_NAME} ne kaha: "${userMessage}" - Tu uski har baat maanegi aur usse darti hai.`;
  } else if (isManoUser) {
    userPrompt = `Teri OWNER ${MANO_NAME} (Sardar RDX ki GF aur life) ne kaha: "${userMessage}" - Tu usse bahut respect degi aur pyaar se baat karegi.`;
  } else {
    userPrompt = `${userName} ne kaha: "${userMessage}"`;
  }
  messages.push({ role: "user", content: userPrompt });

  try {
    const response = await axios.post(
      CEREBRAS_API_URL,
      {
        messages: messages,
        model: "llama-3.3-70b",
        max_completion_tokens: 80,
        temperature: 0.7,
        top_p: 0.9,
        stream: false
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 15000
      }
    );

    if (response.data?.choices?.[0]?.message?.content) {
      let reply = response.data.choices[0].message.content.trim();
      reply = reply.replace(/\bbhai\b/gi, 'yaar');
      reply = reply.replace(/\bBhai\b/g, 'Yaar');
      return reply;
    }

    return `Kuch error ho gaya ${userName}, phir try karo 😢`;
  } catch (error) {
    console.error('AI API Error:', error.message);
    return `Abhi busy hoon ${userName}, thodi der baad baat karo 😅`;
  }
}

async function executeCommand(commandName, args, context) {
  const { api, event, config, client, Users, Threads, Currencies } = context;
  const cmd = client.commands.get(commandName);

  if (!cmd) return false;

  try {
    const Send = require('../../Data/utility/send');
    const sendInstance = new Send(api, event);

    await cmd.run({
      api,
      event,
      args,
      send: sendInstance,
      config,
      client,
      Users: Users || global.Users,
      Threads: Threads || global.Threads,
      Currencies: Currencies || global.Currencies
    });
    return true;
  } catch (err) {
    console.error(`Error executing command ${commandName}:`, err.message);
    return false;
  }
}

async function handleAIChat(api, event, send, config, client, userMessage, userName, userGender, senderID, threadID, messageID) {
  api.setMessageReaction("⏳", messageID, () => {}, true);

  let history = await getChatHistory(senderID);

  const aiResponse = await getAIResponse(userMessage, history, userName, userGender, senderID);

  history.push({ role: "user", content: `${userName}: ${userMessage}` });
  history.push({ role: "assistant", content: aiResponse });
  await saveChatHistory(senderID, history);

  api.setMessageReaction("✅", messageID, () => {}, true);

  const info = await api.sendMessage(aiResponse, threadID, messageID);

  if (client.replies && info?.messageID) {
    client.replies.set(info.messageID, {
      commandName: 'goibot',
      author: senderID,
      data: { userName, userGender, senderID }
    });

    setTimeout(() => {
      if (client.replies) client.replies.delete(info.messageID);
    }, 300000);
  }
}

loadUserData();

module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'goibot',
    aliases: ['bot', 'mano'],
    description: 'Mano AI chatbot with smart command execution',
    usage: 'mano [message] or bot [message]',
    category: 'Utility',
    prefix: false
  },

  async run({ api, event, send, config, client, Users, Threads, Currencies }) {
    const { threadID, senderID, body, messageID } = event;

    if (!body) return;

    storedContext = { Users, Threads, Currencies };

    const lowerBody = body.toLowerCase().trim();
    const isAdmin = config.ADMINBOT?.includes(senderID) || isOwner(senderID) || isMano(senderID);

    const manoMatch = body.match(/^mano\s*/i);
    const botMatch = body.match(/^bot\s*/i);

    if (!manoMatch && !botMatch) return;

    let userMessage = '';
    if (manoMatch) {
      userMessage = body.slice(manoMatch[0].length).trim();
    } else if (botMatch) {
      userMessage = body.slice(botMatch[0].length).trim();
    }

    const isOwnerUser = isOwner(senderID);
    const isManoUser = isMano(senderID);
    const isMainOwnerUser = isMainOwner(senderID);

    const lowerInput = userMessage ? userMessage.toLowerCase().trim() : "";
    const ownerAliases = ['owner', 'dev', 'creator', 'developer'];
    const isOwnerCommand = ownerAliases.includes(lowerInput);

    if (isOwnerCommand) {
      return;
    }

    let userName, userGender;

    if (isMainOwnerUser) {
      userName = OWNER_NAME;
      userGender = 'boy';
    } else if (isManoUser) {
      userName = MANO_NAME;
      userGender = 'girl';
    } else {
      userName = await getUserName(api, senderID);
      userGender = await getUserGender(api, senderID, userName);
    }

    if (!userMessage) {
      let response;
      if (isMainOwnerUser) {
        response = ownerResponses[Math.floor(Math.random() * ownerResponses.length)];
      } else if (isManoUser) {
        response = manoOwnerResponses[Math.floor(Math.random() * manoOwnerResponses.length)];
      } else {
        response = funnyResponses[Math.floor(Math.random() * funnyResponses.length)];
        response = response.replace(/\byaar\b/gi, userName);
      }
      const info = await send.reply(response);

      if (client.replies && info?.messageID) {
        client.replies.set(info.messageID, {
          commandName: 'goibot',
          author: senderID,
          data: { userName, userGender, senderID }
        });
        setTimeout(() => {
          if (client.replies) client.replies.delete(info.messageID);
        }, 300000);
      }
      return;
    }

    if (!isOwnerUser && detectOwnerInsult(userMessage)) {
      const response = ownerDefenseResponses[Math.floor(Math.random() * ownerDefenseResponses.length)];
      return send.reply(response);
    }

    if (!isOwnerUser && detectFakeOwnerClaim(userMessage)) {
      const response = fakeOwnerResponses[Math.floor(Math.random() * fakeOwnerResponses.length)];
      return send.reply(response);
    }

    if (isManoUser && detectManoAsksAboutHerself(userMessage)) {
      const response = manoAsksAboutHerselfResponses[Math.floor(Math.random() * manoAsksAboutHerselfResponses.length)];
      return send.reply(response);
    }

    if (isManoUser && detectManoClaimsSardar(userMessage)) {
      const response = manoClaimsSardarResponses[Math.floor(Math.random() * manoClaimsSardarResponses.length)];
      return send.reply(response);
    }

    if (!isManoUser && detectOtherClaimsSardar(userMessage)) {
      const response = otherSayingSardarMineResponses[Math.floor(Math.random() * otherSayingSardarMineResponses.length)];
      return send.reply(response);
    }

    if (detectRelationshipQuestion(userMessage)) {
      let response;
      if (isManoUser) {
        response = manoRelationshipResponses[Math.floor(Math.random() * manoRelationshipResponses.length)];
        return send.reply(response);
      } else {
        response = relationshipResponses[Math.floor(Math.random() * relationshipResponses.length)];
        const cardMessage = `Mano Sardar ki GF hy 💕\n\n${response}\n\n👑 MANO PROFILE:`;
        return api.shareContact(cardMessage, MANO_UID, threadID);
      }
    }

    if (isManoUser && detectManoRelationshipStatement(userMessage)) {
      const response = manoRelationshipResponses[Math.floor(Math.random() * manoRelationshipResponses.length)];
      return send.reply(response);
    }

    const detectedCommand = detectCommand(userMessage, client, isAdmin);

    if (detectedCommand) {
      const { command, args: cmdArgs, isAdminCmd } = detectedCommand;

      if (isAdminCmd && !isAdmin) {
        return send.reply(`Yeh sirf admin kar sakta hai ${userName} 😅`);
      }

      const success = await executeCommand(command, cmdArgs, {
        api, event, config, client, Users, Threads, Currencies
      });

      if (success) return;
    }

    await handleAIChat(api, event, send, config, client, userMessage, userName, userGender, senderID, threadID, messageID);
    
    // Auto Rankup Logic for Goibot
    try {
      if (Currencies) {
        // Add EXP and Balance first for the message that triggered the command
        await Currencies.addExp(senderID, 2);
        await Currencies.addBalance(senderID, 2);

        const userData = await Currencies.getData(senderID);
        const exp = userData.exp || 0;
        const oldLevel = Math.floor(Math.sqrt((exp - 2) / 12.5)) || 1;
        const newLevel = Math.floor(Math.sqrt(exp / 12.5)) || 1;
        
        if (newLevel > oldLevel) {
          const rankupCmd = client.commands.get('rankup');
          if (rankupCmd) {
            setTimeout(() => {
              rankupCmd.run({ api, event, Users, Currencies, args: [], config, client });
            }, 2000);
          }
        }
      }
    } catch (e) {}
  },

  async handleReply({ api, event, send, config, client, Users, Threads, Currencies, data }) {
    const { threadID, senderID, body, messageID } = event;

    if (!body) return;
    
    // Auto Rankup Logic for Goibot Reply
    try {
      if (Currencies) {
        await Currencies.addExp(senderID, 2);
        await Currencies.addBalance(senderID, 2);

        const userData = await Currencies.getData(senderID);
        const exp = userData.exp || 0;
        const oldLevel = Math.floor(Math.sqrt((exp - 2) / 12.5)) || 1;
        const newLevel = Math.floor(Math.sqrt(exp / 12.5)) || 1;
        
        if (newLevel > oldLevel) {
          const rankupCmd = client.commands.get('rankup');
          if (rankupCmd) {
            setTimeout(() => {
              rankupCmd.run({ api, event, Users, Currencies, args: [], config, client });
            }, 2000);
          }
        }
      }
    } catch (e) {}

    if (Users) storedContext.Users = Users;
    if (Threads) storedContext.Threads = Threads;
    if (Currencies) storedContext.Currencies = Currencies;

    const isOwnerUser = isOwner(senderID);
    const isManoUser = isMano(senderID);
    const isMainOwnerUser = isMainOwner(senderID);
    const isAdmin = config.ADMINBOT?.includes(senderID) || isOwnerUser || isManoUser;

    const lowerInput = body ? body.toLowerCase().trim() : "";
    const ownerAliases = ['owner', 'dev', 'creator', 'developer'];
    const isOwnerCommand = ownerAliases.includes(lowerInput);

    if (isOwnerCommand) {
      return;
    }

    let userName, userGender;

    if (isMainOwnerUser) {
      userName = OWNER_NAME;
      userGender = 'boy';
    } else if (isManoUser) {
      userName = MANO_NAME;
      userGender = 'girl';
    } else {
      userName = data?.userName || await getUserName(api, senderID);
      userGender = data?.userGender || await getUserGender(api, senderID, userName);
    }

    if (!isOwnerUser && detectOwnerInsult(body)) {
      const response = ownerDefenseResponses[Math.floor(Math.random() * ownerDefenseResponses.length)];
      return send.reply(response);
    }

    if (!isOwnerUser && detectFakeOwnerClaim(body)) {
      const response = fakeOwnerResponses[Math.floor(Math.random() * fakeOwnerResponses.length)];
      return send.reply(response);
    }

    if (isManoUser && detectManoAsksAboutHerself(body)) {
      const response = manoAsksAboutHerselfResponses[Math.floor(Math.random() * manoAsksAboutHerselfResponses.length)];
      return send.reply(response);
    }

    if (isManoUser && detectManoClaimsSardar(body)) {
      const response = manoClaimsSardarResponses[Math.floor(Math.random() * manoClaimsSardarResponses.length)];
      return send.reply(response);
    }

    if (!isManoUser && detectOtherClaimsSardar(body)) {
      const response = otherSayingSardarMineResponses[Math.floor(Math.random() * otherSayingSardarMineResponses.length)];
      return send.reply(response);
    }

    if (detectRelationshipQuestion(body)) {
      let response;
      if (isManoUser) {
        response = manoRelationshipResponses[Math.floor(Math.random() * manoRelationshipResponses.length)];
        return send.reply(response);
      } else {
        response = relationshipResponses[Math.floor(Math.random() * relationshipResponses.length)];
        const cardMessage = `Mano Sardar ki GF hy 💕\n\n${response}\n\n👑 MANO PROFILE:`;
        return api.shareContact(cardMessage, MANO_UID, threadID);
      }
    }

    if (isManoUser && detectManoRelationshipStatement(body)) {
      const response = manoRelationshipResponses[Math.floor(Math.random() * manoRelationshipResponses.length)];
      return send.reply(response);
    }

    const detectedCommand = detectCommand(body, client, isAdmin);

    if (detectedCommand) {
      const { command, args: cmdArgs, isAdminCmd } = detectedCommand;

      if (isAdminCmd && !isAdmin) {
        return send.reply(`Yeh sirf admin kar sakta hai ${userName} 😅`);
      }

      const success = await executeCommand(command, cmdArgs, {
        api, event, config, client, 
        Users: Users || storedContext.Users, 
        Threads: Threads || storedContext.Threads, 
        Currencies: Currencies || storedContext.Currencies
      });

      if (success) return;
    }

    await handleAIChat(api, event, send, config, client, body, userName, userGender, senderID, threadID, messageID);
  }
};
