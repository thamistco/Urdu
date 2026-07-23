/**
 * Themed vocabulary — organised into topics the way Drops/Memrise group words,
 * so a single session stays coherent (all food, all family, …). Each item is
 * self-contained: script, Roman transliteration, meaning, and an emoji used as
 * a translation-free visual cue.
 */

export type Word = {
  id: string;
  urdu: string;
  roman: string;
  meaning: string;
  emoji: string;
  topic: string;
};

export type Topic = {
  id: string;
  title: string;
  icon: string;
  blurb: string;
};

export const TOPICS: Topic[] = [
  { id: 'first-words', title: 'First Words', icon: '✨', blurb: 'The words you reach for every day.' },
  { id: 'family', title: 'Family', icon: '👨‍👩‍👧', blurb: 'The people you learn Urdu to speak with.' },
  { id: 'food', title: 'Food & Drink', icon: '🍲', blurb: 'From chai to roti — the table vocabulary.' },
  { id: 'home', title: 'Around the Home', icon: '🏠', blurb: 'Objects and rooms you name daily.' },
  { id: 'nature', title: 'Nature', icon: '🌙', blurb: 'Sky, water, earth and weather.' },
  { id: 'colours', title: 'Colours', icon: '🎨', blurb: 'Describe the world around you.' },
  { id: 'numbers', title: 'Numbers', icon: '🔢', blurb: 'One to ten, and counting.' },
  { id: 'greetings', title: 'Greetings', icon: '🤝', blurb: 'Open and close a conversation warmly.' },
];

export const WORDS: Word[] = [
  // first-words
  { id: 'w-paani', urdu: 'پانی', roman: 'paani', meaning: 'water', emoji: '💧', topic: 'first-words' },
  { id: 'w-kitaab', urdu: 'کتاب', roman: 'kitaab', meaning: 'book', emoji: '📖', topic: 'first-words' },
  { id: 'w-ghar', urdu: 'گھر', roman: 'ghar', meaning: 'house', emoji: '🏠', topic: 'first-words' },
  { id: 'w-dil', urdu: 'دل', roman: 'dil', meaning: 'heart', emoji: '❤️', topic: 'first-words' },
  { id: 'w-naam', urdu: 'نام', roman: 'naam', meaning: 'name', emoji: '🏷️', topic: 'first-words' },
  { id: 'w-dost', urdu: 'دوست', roman: 'dost', meaning: 'friend', emoji: '🤝', topic: 'first-words' },
  { id: 'w-kaam', urdu: 'کام', roman: 'kaam', meaning: 'work', emoji: '💼', topic: 'first-words' },
  { id: 'w-waqt', urdu: 'وقت', roman: 'waqt', meaning: 'time', emoji: '⏰', topic: 'first-words' },

  // family
  { id: 'w-maan', urdu: 'ماں', roman: 'maañ', meaning: 'mother', emoji: '🤱', topic: 'family' },
  { id: 'w-baap', urdu: 'باپ', roman: 'baap', meaning: 'father', emoji: '👨', topic: 'family' },
  { id: 'w-behen', urdu: 'بہن', roman: 'behen', meaning: 'sister', emoji: '👧', topic: 'family' },
  { id: 'w-bhai', urdu: 'بھائی', roman: 'bhai', meaning: 'brother', emoji: '👦', topic: 'family' },
  { id: 'w-dada', urdu: 'دادا', roman: 'daada', meaning: 'grandfather', emoji: '👴', topic: 'family' },
  { id: 'w-dadi', urdu: 'دادی', roman: 'daadi', meaning: 'grandmother', emoji: '👵', topic: 'family' },
  { id: 'w-beta', urdu: 'بیٹا', roman: 'beṭa', meaning: 'son', emoji: '🧒', topic: 'family' },
  { id: 'w-beti', urdu: 'بیٹی', roman: 'beṭi', meaning: 'daughter', emoji: '👧', topic: 'family' },

  // food
  { id: 'w-roti', urdu: 'روٹی', roman: 'roṭi', meaning: 'bread', emoji: '🫓', topic: 'food' },
  { id: 'w-chai', urdu: 'چائے', roman: 'chai', meaning: 'tea', emoji: '🍵', topic: 'food' },
  { id: 'w-doodh', urdu: 'دودھ', roman: 'doodh', meaning: 'milk', emoji: '🥛', topic: 'food' },
  { id: 'w-seb', urdu: 'سیب', roman: 'seb', meaning: 'apple', emoji: '🍎', topic: 'food' },
  { id: 'w-anda', urdu: 'انڈا', roman: 'anḍa', meaning: 'egg', emoji: '🥚', topic: 'food' },
  { id: 'w-chawal', urdu: 'چاول', roman: 'chaawal', meaning: 'rice', emoji: '🍚', topic: 'food' },
  { id: 'w-gosht', urdu: 'گوشت', roman: 'gosht', meaning: 'meat', emoji: '🍖', topic: 'food' },
  { id: 'w-namak', urdu: 'نمک', roman: 'namak', meaning: 'salt', emoji: '🧂', topic: 'food' },

  // home
  { id: 'w-mez', urdu: 'میز', roman: 'mez', meaning: 'table', emoji: '🪑', topic: 'home' },
  { id: 'w-kursi', urdu: 'کرسی', roman: 'kursi', meaning: 'chair', emoji: '🪑', topic: 'home' },
  { id: 'w-darwaza', urdu: 'دروازہ', roman: 'darwaaza', meaning: 'door', emoji: '🚪', topic: 'home' },
  { id: 'w-khirki', urdu: 'کھڑکی', roman: 'khiṛki', meaning: 'window', emoji: '🪟', topic: 'home' },
  { id: 'w-chabi', urdu: 'چابی', roman: 'chaabi', meaning: 'key', emoji: '🔑', topic: 'home' },
  { id: 'w-ghadi', urdu: 'گھڑی', roman: 'ghaṛi', meaning: 'clock', emoji: '⌚', topic: 'home' },
  { id: 'w-bistar', urdu: 'بستر', roman: 'bistar', meaning: 'bed', emoji: '🛏️', topic: 'home' },
  { id: 'w-chiragh', urdu: 'چراغ', roman: 'chiraagh', meaning: 'lamp', emoji: '🪔', topic: 'home' },

  // nature
  { id: 'w-chaand', urdu: 'چاند', roman: 'chaand', meaning: 'moon', emoji: '🌙', topic: 'nature' },
  { id: 'w-suraj', urdu: 'سورج', roman: 'sooraj', meaning: 'sun', emoji: '☀️', topic: 'nature' },
  { id: 'w-tara', urdu: 'تارا', roman: 'taara', meaning: 'star', emoji: '⭐', topic: 'nature' },
  { id: 'w-phool', urdu: 'پھول', roman: 'phool', meaning: 'flower', emoji: '🌸', topic: 'nature' },
  { id: 'w-darakht', urdu: 'درخت', roman: 'darakht', meaning: 'tree', emoji: '🌳', topic: 'nature' },
  { id: 'w-barish', urdu: 'بارش', roman: 'baarish', meaning: 'rain', emoji: '🌧️', topic: 'nature' },
  { id: 'w-samundar', urdu: 'سمندر', roman: 'samundar', meaning: 'sea', emoji: '🌊', topic: 'nature' },
  { id: 'w-pahaar', urdu: 'پہاڑ', roman: 'pahaaṛ', meaning: 'mountain', emoji: '⛰️', topic: 'nature' },

  // colours
  { id: 'w-laal', urdu: 'لال', roman: 'laal', meaning: 'red', emoji: '🟥', topic: 'colours' },
  { id: 'w-neela', urdu: 'نیلا', roman: 'neela', meaning: 'blue', emoji: '🟦', topic: 'colours' },
  { id: 'w-hara', urdu: 'ہرا', roman: 'hara', meaning: 'green', emoji: '🟩', topic: 'colours' },
  { id: 'w-peela', urdu: 'پیلا', roman: 'peela', meaning: 'yellow', emoji: '🟨', topic: 'colours' },
  { id: 'w-kaala', urdu: 'کالا', roman: 'kaala', meaning: 'black', emoji: '⬛', topic: 'colours' },
  { id: 'w-safed', urdu: 'سفید', roman: 'safed', meaning: 'white', emoji: '⬜', topic: 'colours' },

  // numbers
  { id: 'w-ek', urdu: 'ایک', roman: 'ek', meaning: 'one', emoji: '1️⃣', topic: 'numbers' },
  { id: 'w-do', urdu: 'دو', roman: 'do', meaning: 'two', emoji: '2️⃣', topic: 'numbers' },
  { id: 'w-teen', urdu: 'تین', roman: 'teen', meaning: 'three', emoji: '3️⃣', topic: 'numbers' },
  { id: 'w-chaar', urdu: 'چار', roman: 'chaar', meaning: 'four', emoji: '4️⃣', topic: 'numbers' },
  { id: 'w-paanch', urdu: 'پانچ', roman: 'paañch', meaning: 'five', emoji: '5️⃣', topic: 'numbers' },
  { id: 'w-chhe', urdu: 'چھ', roman: 'chhe', meaning: 'six', emoji: '6️⃣', topic: 'numbers' },
  { id: 'w-saat', urdu: 'سات', roman: 'saat', meaning: 'seven', emoji: '7️⃣', topic: 'numbers' },
  { id: 'w-aath', urdu: 'آٹھ', roman: 'aaṭh', meaning: 'eight', emoji: '8️⃣', topic: 'numbers' },

  // greetings
  { id: 'w-salam', urdu: 'سلام', roman: 'salaam', meaning: 'peace / hello', emoji: '🕊️', topic: 'greetings' },
  { id: 'w-shukriya', urdu: 'شکریہ', roman: 'shukriya', meaning: 'thank you', emoji: '🙏', topic: 'greetings' },
  { id: 'w-haan', urdu: 'ہاں', roman: 'haañ', meaning: 'yes', emoji: '✅', topic: 'greetings' },
  { id: 'w-nahi', urdu: 'نہیں', roman: 'nahiñ', meaning: 'no', emoji: '❌', topic: 'greetings' },
  { id: 'w-maaf', urdu: 'معاف', roman: 'maaf', meaning: 'forgive / sorry', emoji: '🙇', topic: 'greetings' },
  { id: 'w-khush', urdu: 'خوش', roman: 'khush', meaning: 'happy', emoji: '😊', topic: 'greetings' },
];

/** Short, high-value phrases for the "speak with family" goal. */
export type Phrase = { id: string; urdu: string; roman: string; meaning: string };

export const PHRASES: Phrase[] = [
  { id: 'p-1', urdu: 'آپ کیسے ہیں؟', roman: 'aap kaise hain?', meaning: 'How are you?' },
  { id: 'p-2', urdu: 'میں ٹھیک ہوں', roman: 'main ṭheek hoon', meaning: 'I am well' },
  { id: 'p-3', urdu: 'آپ کا نام کیا ہے؟', roman: 'aap ka naam kya hai?', meaning: "What's your name?" },
  { id: 'p-4', urdu: 'مجھے چائے پسند ہے', roman: 'mujhe chai pasand hai', meaning: 'I like tea' },
  { id: 'p-5', urdu: 'پھر ملیں گے', roman: 'phir milenge', meaning: 'See you again' },
];

export const wordsByTopic = (topic: string) => WORDS.filter((w) => w.topic === topic);
export const getWord = (id: string) => WORDS.find((w) => w.id === id);
