/**
 * Themed vocabulary — organised into topics the way Drops/Memrise group words,
 * so a single session stays coherent (all food, all family, …). Each item is
 * self-contained: script, Roman transliteration, meaning, and an emoji used as
 * a translation-free visual cue.
 */

import { ALL_PACKS } from './vocab';

/** Course stage a piece of content belongs to. */
export type Level = 'beginner' | 'elementary' | 'intermediate' | 'advanced';

export type Word = {
  id: string;
  urdu: string;
  roman: string;
  meaning: string;
  emoji: string;
  topic: string;
  /** Defaults to the topic's level when omitted. */
  level?: Level;
};

export type Topic = {
  id: string;
  title: string;
  icon: string;
  blurb: string;
  level: Level;
};

const CORE_TOPICS: Topic[] = [
  { id: 'first-words', title: 'First Words', icon: '✨', blurb: 'The words you reach for every day.', level: 'beginner' },
  { id: 'family', title: 'Family', icon: '👨‍👩‍👧', blurb: 'The people you learn Urdu to speak with.', level: 'beginner' },
  { id: 'food', title: 'Food & Drink', icon: '🍲', blurb: 'From chai to roti, the table vocabulary.', level: 'beginner' },
  { id: 'home', title: 'Around the Home', icon: '🏠', blurb: 'Objects and rooms you name daily.', level: 'beginner' },
  { id: 'nature', title: 'Nature', icon: '🌙', blurb: 'Sky, water, earth and weather.', level: 'beginner' },
  { id: 'colours', title: 'Colours', icon: '🎨', blurb: 'Describe the world around you.', level: 'beginner' },
  { id: 'numbers', title: 'Numbers', icon: '🔢', blurb: 'One to ten, and counting.', level: 'beginner' },
  { id: 'greetings', title: 'Greetings', icon: '🤝', blurb: 'Open and close a conversation warmly.', level: 'beginner' },
  { id: 'body', title: 'The Body', icon: '🖐️', blurb: 'Name yourself, head to toe.', level: 'elementary' },
  { id: 'animals', title: 'Animals', icon: '🐐', blurb: 'Creatures at home and in the wild.', level: 'elementary' },
  { id: 'fruits', title: 'Fruits', icon: '🥭', blurb: 'Sweet words for the fruit stall.', level: 'elementary' },
  { id: 'vegetables', title: 'Vegetables', icon: '🥕', blurb: 'Everything at the sabzi shop.', level: 'elementary' },
  { id: 'clothing', title: 'Clothing', icon: '👕', blurb: 'What you wear each day.', level: 'elementary' },
  { id: 'school', title: 'School', icon: '🏫', blurb: 'Words for the classroom.', level: 'elementary' },
  { id: 'time', title: 'Time & Day', icon: '⏰', blurb: 'Morning, night, today, tomorrow.', level: 'elementary' },
  { id: 'weather', title: 'Weather', icon: '🌦️', blurb: 'Sun, rain, heat and cold.', level: 'elementary' },
  { id: 'places', title: 'Places', icon: '🏙️', blurb: 'Around town and beyond.', level: 'elementary' },
  { id: 'transport', title: 'Getting Around', icon: '🚗', blurb: 'Cars, trains and boats.', level: 'elementary' },
  { id: 'verbs', title: 'Actions', icon: '🏃', blurb: 'The verbs you use most.', level: 'elementary' },
  { id: 'adjectives', title: 'Describing', icon: '📏', blurb: 'Big, small, good, new…', level: 'elementary' },
  { id: 'feelings', title: 'Feelings', icon: '😊', blurb: 'How you and others feel.', level: 'elementary' },
  { id: 'questions', title: 'Question Words', icon: '❓', blurb: 'Who, what, where, when.', level: 'elementary' },
  // ---- intermediate ----
  { id: 'jobs', title: 'Work & Jobs', icon: '👷', blurb: 'Professions and working life.', level: 'intermediate' },
  { id: 'health', title: 'Health', icon: '🩺', blurb: 'At the doctor, feeling unwell.', level: 'intermediate' },
  { id: 'money', title: 'Money & Shopping', icon: '💰', blurb: 'Prices, buying and selling.', level: 'intermediate' },
  { id: 'travel', title: 'Travel', icon: '🧳', blurb: 'Journeys, tickets and hotels.', level: 'intermediate' },
  { id: 'city', title: 'In the City', icon: '🏛️', blurb: 'Streets, buildings and services.', level: 'intermediate' },
  { id: 'cooking', title: 'Cooking', icon: '🍳', blurb: 'In the kitchen, making food.', level: 'intermediate' },
  { id: 'sports', title: 'Sports & Leisure', icon: '⚽', blurb: 'Games, hobbies and free time.', level: 'intermediate' },
  { id: 'days', title: 'Days & Months', icon: '🗓️', blurb: 'The week and the calendar.', level: 'intermediate' },
  { id: 'directions', title: 'Directions', icon: '🧭', blurb: 'Left, right, near and far.', level: 'intermediate' },
  { id: 'verbs2', title: 'More Actions', icon: '🤸', blurb: 'A wider set of everyday verbs.', level: 'intermediate' },
  // ---- advanced ----
  { id: 'emotions', title: 'Emotions & Mind', icon: '🧠', blurb: 'Subtler feelings and thoughts.', level: 'advanced' },
  { id: 'abstract', title: 'Ideas & Values', icon: '💭', blurb: 'Truth, freedom, justice, hope.', level: 'advanced' },
  { id: 'culture', title: 'Culture & Faith', icon: '🕌', blurb: 'Festivals, poetry and tradition.', level: 'advanced' },
  { id: 'tech', title: 'Modern Life', icon: '📱', blurb: 'Technology and the news.', level: 'advanced' },
  { id: 'nature2', title: 'The Natural World', icon: '🏞️', blurb: 'Rivers, deserts, seasons.', level: 'advanced' },
  { id: 'connectors', title: 'Linking Words', icon: '🔗', blurb: 'But, because, therefore, although.', level: 'advanced' },
];

const CORE_WORDS: Word[] = [
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
  { id: 'w-behen', urdu: 'بہن', roman: 'behen', meaning: 'sister', emoji: '👩', topic: 'family' },
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
  { id: 'w-mez', urdu: 'میز', roman: 'mez', meaning: 'table', emoji: '🛋️', topic: 'home' },
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
  { id: 'w-nau', urdu: 'نو', roman: 'nau', meaning: 'nine', emoji: '9️⃣', topic: 'numbers' },
  { id: 'w-das', urdu: 'دس', roman: 'das', meaning: 'ten', emoji: '🔟', topic: 'numbers' },
  { id: 'w-sifar', urdu: 'صفر', roman: 'sifar', meaning: 'zero', emoji: '0️⃣', topic: 'numbers' },

  // greetings
  { id: 'w-salam', urdu: 'سلام', roman: 'salaam', meaning: 'peace / hello', emoji: '🕊️', topic: 'greetings' },
  { id: 'w-shukriya', urdu: 'شکریہ', roman: 'shukriya', meaning: 'thank you', emoji: '🙏', topic: 'greetings' },
  { id: 'w-haan', urdu: 'ہاں', roman: 'haañ', meaning: 'yes', emoji: '✅', topic: 'greetings' },
  { id: 'w-nahi', urdu: 'نہیں', roman: 'nahiñ', meaning: 'no', emoji: '❌', topic: 'greetings' },
  { id: 'w-maaf', urdu: 'معاف', roman: 'maaf', meaning: 'forgive / sorry', emoji: '🙇', topic: 'greetings' },
  { id: 'w-khush', urdu: 'خوش', roman: 'khush', meaning: 'happy', emoji: '😊', topic: 'greetings' },

  // body
  { id: 'w-sar', urdu: 'سر', roman: 'sar', meaning: 'head', emoji: '🧑', topic: 'body' },
  { id: 'w-aankh', urdu: 'آنکھ', roman: 'aankh', meaning: 'eye', emoji: '👁️', topic: 'body' },
  { id: 'w-kaan', urdu: 'کان', roman: 'kaan', meaning: 'ear', emoji: '👂', topic: 'body' },
  { id: 'w-naak', urdu: 'ناک', roman: 'naak', meaning: 'nose', emoji: '👃', topic: 'body' },
  { id: 'w-munh', urdu: 'منہ', roman: 'munh', meaning: 'mouth', emoji: '👄', topic: 'body' },
  { id: 'w-haath', urdu: 'ہاتھ', roman: 'haath', meaning: 'hand', emoji: '✋', topic: 'body' },
  { id: 'w-paaon', urdu: 'پاؤں', roman: 'paaoñ', meaning: 'foot', emoji: '🦶', topic: 'body' },
  { id: 'w-baal', urdu: 'بال', roman: 'baal', meaning: 'hair', emoji: '💇', topic: 'body' },
  { id: 'w-daant', urdu: 'دانت', roman: 'daant', meaning: 'tooth', emoji: '🦷', topic: 'body' },
  { id: 'w-zabaan', urdu: 'زبان', roman: 'zabaan', meaning: 'tongue', emoji: '👅', topic: 'body' },

  // animals
  { id: 'w-kutta', urdu: 'کتا', roman: 'kutta', meaning: 'dog', emoji: '🐕', topic: 'animals' },
  { id: 'w-billi', urdu: 'بلی', roman: 'billi', meaning: 'cat', emoji: '🐈', topic: 'animals' },
  { id: 'w-ghora', urdu: 'گھوڑا', roman: 'ghoṛa', meaning: 'horse', emoji: '🐎', topic: 'animals' },
  { id: 'w-gaay', urdu: 'گائے', roman: 'gaay', meaning: 'cow', emoji: '🐄', topic: 'animals' },
  { id: 'w-bakri', urdu: 'بکری', roman: 'bakri', meaning: 'goat', emoji: '🐐', topic: 'animals' },
  { id: 'w-sher', urdu: 'شیر', roman: 'sher', meaning: 'lion', emoji: '🦁', topic: 'animals' },
  { id: 'w-machhli', urdu: 'مچھلی', roman: 'machhli', meaning: 'fish', emoji: '🐟', topic: 'animals' },
  { id: 'w-parinda', urdu: 'پرندہ', roman: 'parinda', meaning: 'bird', emoji: '🐦', topic: 'animals' },
  { id: 'w-haathi', urdu: 'ہاتھی', roman: 'haathi', meaning: 'elephant', emoji: '🐘', topic: 'animals' },
  { id: 'w-saanp', urdu: 'سانپ', roman: 'saanp', meaning: 'snake', emoji: '🐍', topic: 'animals' },

  // fruits
  { id: 'w-kela', urdu: 'کیلا', roman: 'kela', meaning: 'banana', emoji: '🍌', topic: 'fruits' },
  { id: 'w-aam', urdu: 'آم', roman: 'aam', meaning: 'mango', emoji: '🥭', topic: 'fruits' },
  { id: 'w-naarangi', urdu: 'نارنگی', roman: 'naarangi', meaning: 'orange', emoji: '🍊', topic: 'fruits' },
  { id: 'w-angoor', urdu: 'انگور', roman: 'angoor', meaning: 'grapes', emoji: '🍇', topic: 'fruits' },
  { id: 'w-tarbooz', urdu: 'تربوز', roman: 'tarbooz', meaning: 'watermelon', emoji: '🍉', topic: 'fruits' },
  { id: 'w-laimoon', urdu: 'لیموں', roman: 'laimoon', meaning: 'lemon', emoji: '🍋', topic: 'fruits' },
  { id: 'w-aaroo', urdu: 'آڑو', roman: 'aaṛoo', meaning: 'peach', emoji: '🍑', topic: 'fruits' },
  { id: 'w-cherry', urdu: 'چیری', roman: 'cherry', meaning: 'cherry', emoji: '🍒', topic: 'fruits' },

  // vegetables
  { id: 'w-aaloo', urdu: 'آلو', roman: 'aaloo', meaning: 'potato', emoji: '🥔', topic: 'vegetables' },
  { id: 'w-piyaaz', urdu: 'پیاز', roman: 'piyaaz', meaning: 'onion', emoji: '🧅', topic: 'vegetables' },
  { id: 'w-tamaatar', urdu: 'ٹماٹر', roman: 'ṭamaaṭar', meaning: 'tomato', emoji: '🍅', topic: 'vegetables' },
  { id: 'w-gaajar', urdu: 'گاجر', roman: 'gaajar', meaning: 'carrot', emoji: '🥕', topic: 'vegetables' },
  { id: 'w-lehsan', urdu: 'لہسن', roman: 'lehsan', meaning: 'garlic', emoji: '🧄', topic: 'vegetables' },
  { id: 'w-mirch', urdu: 'مرچ', roman: 'mirch', meaning: 'chilli', emoji: '🌶️', topic: 'vegetables' },
  { id: 'w-makai', urdu: 'مکئی', roman: 'makai', meaning: 'corn', emoji: '🌽', topic: 'vegetables' },
  { id: 'w-baingan', urdu: 'بینگن', roman: 'baingan', meaning: 'eggplant', emoji: '🍆', topic: 'vegetables' },
  { id: 'w-matar', urdu: 'مٹر', roman: 'maṭar', meaning: 'peas', emoji: '🫛', topic: 'vegetables' },
  { id: 'w-palak', urdu: 'پالک', roman: 'paalak', meaning: 'spinach', emoji: '🥬', topic: 'vegetables' },

  // clothing
  { id: 'w-qameez', urdu: 'قمیض', roman: 'qameez', meaning: 'shirt', emoji: '👕', topic: 'clothing' },
  { id: 'w-shalwaar', urdu: 'شلوار', roman: 'shalwaar', meaning: 'trousers', emoji: '👖', topic: 'clothing' },
  { id: 'w-dupatta', urdu: 'دوپٹہ', roman: 'dupaṭṭa', meaning: 'scarf', emoji: '🧣', topic: 'clothing' },
  { id: 'w-topi', urdu: 'ٹوپی', roman: 'ṭopi', meaning: 'cap', emoji: '🧢', topic: 'clothing' },
  { id: 'w-joote', urdu: 'جوتے', roman: 'joote', meaning: 'shoes', emoji: '👟', topic: 'clothing' },
  { id: 'w-coat', urdu: 'کوٹ', roman: 'coaṭ', meaning: 'coat', emoji: '🧥', topic: 'clothing' },
  { id: 'w-juraab', urdu: 'جراب', roman: 'juraab', meaning: 'sock', emoji: '🧦', topic: 'clothing' },
  { id: 'w-chashma', urdu: 'چشمہ', roman: 'chashma', meaning: 'glasses', emoji: '👓', topic: 'clothing' },

  // school
  { id: 'w-iskool', urdu: 'اسکول', roman: 'iskool', meaning: 'school', emoji: '🏫', topic: 'school' },
  { id: 'w-ustaad', urdu: 'استاد', roman: 'ustaad', meaning: 'teacher', emoji: '👨‍🏫', topic: 'school' },
  { id: 'w-taalibilm', urdu: 'طالبِ علم', roman: 'taalib-e-ilm', meaning: 'student', emoji: '🧑‍🎓', topic: 'school' },
  { id: 'w-qalam', urdu: 'قلم', roman: 'qalam', meaning: 'pen', emoji: '🖊️', topic: 'school' },
  { id: 'w-pencil', urdu: 'پنسل', roman: 'pencil', meaning: 'pencil', emoji: '✏️', topic: 'school' },
  { id: 'w-kaaghaz', urdu: 'کاغذ', roman: 'kaaghaz', meaning: 'paper', emoji: '📄', topic: 'school' },
  { id: 'w-kaapi', urdu: 'کاپی', roman: 'kaapi', meaning: 'notebook', emoji: '📓', topic: 'school' },
  { id: 'w-basta', urdu: 'بستہ', roman: 'basta', meaning: 'schoolbag', emoji: '🎒', topic: 'school' },

  // time & day
  { id: 'w-din', urdu: 'دن', roman: 'din', meaning: 'day', emoji: '☀️', topic: 'time' },
  { id: 'w-raat', urdu: 'رات', roman: 'raat', meaning: 'night', emoji: '🌙', topic: 'time' },
  { id: 'w-subah', urdu: 'صبح', roman: 'subah', meaning: 'morning', emoji: '🌅', topic: 'time' },
  { id: 'w-shaam', urdu: 'شام', roman: 'shaam', meaning: 'evening', emoji: '🌆', topic: 'time' },
  { id: 'w-aaj', urdu: 'آج', roman: 'aaj', meaning: 'today', emoji: '📅', topic: 'time' },
  { id: 'w-kal', urdu: 'کل', roman: 'kal', meaning: 'tomorrow / yesterday', emoji: '📆', topic: 'time' },
  { id: 'w-hafta', urdu: 'ہفتہ', roman: 'hafta', meaning: 'week', emoji: '🗓️', topic: 'time' },
  { id: 'w-mahina', urdu: 'مہینہ', roman: 'mahina', meaning: 'month', emoji: '🗒️', topic: 'time' },
  { id: 'w-saal', urdu: 'سال', roman: 'saal', meaning: 'year', emoji: '🎊', topic: 'time' },
  { id: 'w-ghanta', urdu: 'گھنٹہ', roman: 'ghanṭa', meaning: 'hour', emoji: '⏳', topic: 'time' },

  // weather
  { id: 'w-baadal', urdu: 'بادل', roman: 'baadal', meaning: 'cloud', emoji: '☁️', topic: 'weather' },
  { id: 'w-hawa', urdu: 'ہوا', roman: 'hawa', meaning: 'wind / air', emoji: '💨', topic: 'weather' },
  { id: 'w-barf', urdu: 'برف', roman: 'barf', meaning: 'snow / ice', emoji: '❄️', topic: 'weather' },
  { id: 'w-garmi', urdu: 'گرمی', roman: 'garmi', meaning: 'heat / summer', emoji: '🥵', topic: 'weather' },
  { id: 'w-sardi', urdu: 'سردی', roman: 'sardi', meaning: 'cold / winter', emoji: '🥶', topic: 'weather' },
  { id: 'w-toofaan', urdu: 'طوفان', roman: 'toofaan', meaning: 'storm', emoji: '🌩️', topic: 'weather' },
  { id: 'w-dhoop', urdu: 'دھوپ', roman: 'dhoop', meaning: 'sunshine', emoji: '🌞', topic: 'weather' },
  { id: 'w-kohra', urdu: 'کہرا', roman: 'kohra', meaning: 'fog', emoji: '🌫️', topic: 'weather' },

  // places
  { id: 'w-shahr', urdu: 'شہر', roman: 'shahr', meaning: 'city', emoji: '🏙️', topic: 'places' },
  { id: 'w-gaaon', urdu: 'گاؤں', roman: 'gaaoñ', meaning: 'village', emoji: '🏡', topic: 'places' },
  { id: 'w-bazaar', urdu: 'بازار', roman: 'bazaar', meaning: 'market', emoji: '🏬', topic: 'places' },
  { id: 'w-masjid', urdu: 'مسجد', roman: 'masjid', meaning: 'mosque', emoji: '🕌', topic: 'places' },
  { id: 'w-haspataal', urdu: 'ہسپتال', roman: 'haspataal', meaning: 'hospital', emoji: '🏥', topic: 'places' },
  { id: 'w-dukaan', urdu: 'دکان', roman: 'dukaan', meaning: 'shop', emoji: '🏪', topic: 'places' },
  { id: 'w-sarak', urdu: 'سڑک', roman: 'saṛak', meaning: 'road', emoji: '🛣️', topic: 'places' },
  { id: 'w-baagh', urdu: 'باغ', roman: 'baagh', meaning: 'garden', emoji: '🌳', topic: 'places' },
  { id: 'w-daftar', urdu: 'دفتر', roman: 'daftar', meaning: 'office', emoji: '🏢', topic: 'places' },

  // transport
  { id: 'w-gaari', urdu: 'گاڑی', roman: 'gaaṛi', meaning: 'car', emoji: '🚗', topic: 'transport' },
  { id: 'w-bas', urdu: 'بس', roman: 'bas', meaning: 'bus', emoji: '🚌', topic: 'transport' },
  { id: 'w-train', urdu: 'ٹرین', roman: 'train', meaning: 'train', emoji: '🚆', topic: 'transport' },
  { id: 'w-jahaaz', urdu: 'جہاز', roman: 'jahaaz', meaning: 'plane / ship', emoji: '✈️', topic: 'transport' },
  { id: 'w-cycle', urdu: 'سائیکل', roman: 'cycle', meaning: 'bicycle', emoji: '🚲', topic: 'transport' },
  { id: 'w-kashti', urdu: 'کشتی', roman: 'kashti', meaning: 'boat', emoji: '⛵', topic: 'transport' },
  { id: 'w-rickshaw', urdu: 'رکشہ', roman: 'rickshaw', meaning: 'rickshaw', emoji: '🛺', topic: 'transport' },
  { id: 'w-motorcycle', urdu: 'موٹرسائیکل', roman: 'moṭarcycle', meaning: 'motorbike', emoji: '🏍️', topic: 'transport' },

  // verbs (actions)
  { id: 'w-khaana-v', urdu: 'کھانا', roman: 'khaana', meaning: 'to eat', emoji: '🍽️', topic: 'verbs' },
  { id: 'w-peena', urdu: 'پینا', roman: 'peena', meaning: 'to drink', emoji: '🥤', topic: 'verbs' },
  { id: 'w-jaana', urdu: 'جانا', roman: 'jaana', meaning: 'to go', emoji: '🚶', topic: 'verbs' },
  { id: 'w-aana', urdu: 'آنا', roman: 'aana', meaning: 'to come', emoji: '🙋‍♂️', topic: 'verbs' },
  { id: 'w-dekhna', urdu: 'دیکھنا', roman: 'dekhna', meaning: 'to see', emoji: '👀', topic: 'verbs' },
  { id: 'w-bolna', urdu: 'بولنا', roman: 'bolna', meaning: 'to speak', emoji: '🗣️', topic: 'verbs' },
  { id: 'w-parhna', urdu: 'پڑھنا', roman: 'paṛhna', meaning: 'to read', emoji: '📖', topic: 'verbs' },
  { id: 'w-likhna', urdu: 'لکھنا', roman: 'likhna', meaning: 'to write', emoji: '✍️', topic: 'verbs' },
  { id: 'w-sona', urdu: 'سونا', roman: 'sona', meaning: 'to sleep', emoji: '😴', topic: 'verbs' },
  { id: 'w-karna', urdu: 'کرنا', roman: 'karna', meaning: 'to do', emoji: '🤲', topic: 'verbs' },

  // adjectives (describing)
  { id: 'w-bara', urdu: 'بڑا', roman: 'baṛa', meaning: 'big', emoji: '🔺', topic: 'adjectives' },
  { id: 'w-chhota', urdu: 'چھوٹا', roman: 'chhoṭa', meaning: 'small', emoji: '🔻', topic: 'adjectives' },
  { id: 'w-achha', urdu: 'اچھا', roman: 'achha', meaning: 'good', emoji: '👍', topic: 'adjectives' },
  { id: 'w-bura', urdu: 'برا', roman: 'bura', meaning: 'bad', emoji: '👎', topic: 'adjectives' },
  { id: 'w-naya', urdu: 'نیا', roman: 'naya', meaning: 'new', emoji: '✨', topic: 'adjectives' },
  { id: 'w-puraana', urdu: 'پرانا', roman: 'puraana', meaning: 'old', emoji: '📦', topic: 'adjectives' },
  { id: 'w-lamba', urdu: 'لمبا', roman: 'lamba', meaning: 'long / tall', emoji: '📏', topic: 'adjectives' },
  { id: 'w-khoobsurat', urdu: 'خوبصورت', roman: 'khoobsurat', meaning: 'beautiful', emoji: '😍', topic: 'adjectives' },
  { id: 'w-tez', urdu: 'تیز', roman: 'tez', meaning: 'fast', emoji: '⚡', topic: 'adjectives' },
  { id: 'w-aahista', urdu: 'آہستہ', roman: 'aahista', meaning: 'slow', emoji: '🐢', topic: 'adjectives' },

  // feelings
  { id: 'w-udaas', urdu: 'اداس', roman: 'udaas', meaning: 'sad', emoji: '😢', topic: 'feelings' },
  { id: 'w-gussa', urdu: 'غصہ', roman: 'gussa', meaning: 'anger', emoji: '😠', topic: 'feelings' },
  { id: 'w-thaka', urdu: 'تھکا', roman: 'thaka', meaning: 'tired', emoji: '😪', topic: 'feelings' },
  { id: 'w-bhookha', urdu: 'بھوکا', roman: 'bhookha', meaning: 'hungry', emoji: '🍽️', topic: 'feelings' },
  { id: 'w-pyaasa', urdu: 'پیاسا', roman: 'pyaasa', meaning: 'thirsty', emoji: '🥤', topic: 'feelings' },
  { id: 'w-dara', urdu: 'ڈرا', roman: 'ḍara', meaning: 'afraid', emoji: '😨', topic: 'feelings' },
  { id: 'w-mohabbat', urdu: 'محبت', roman: 'mohabbat', meaning: 'love', emoji: '❤️', topic: 'feelings' },
  { id: 'w-hairaan', urdu: 'حیران', roman: 'hairaan', meaning: 'surprised', emoji: '😲', topic: 'feelings' },

  // question words
  { id: 'w-kya', urdu: 'کیا', roman: 'kya', meaning: 'what', emoji: '❓', topic: 'questions' },
  { id: 'w-kaun', urdu: 'کون', roman: 'kaun', meaning: 'who', emoji: '🙋', topic: 'questions' },
  { id: 'w-kahaan', urdu: 'کہاں', roman: 'kahaañ', meaning: 'where', emoji: '📍', topic: 'questions' },
  { id: 'w-kab', urdu: 'کب', roman: 'kab', meaning: 'when', emoji: '⏰', topic: 'questions' },
  { id: 'w-kyun', urdu: 'کیوں', roman: 'kyuñ', meaning: 'why', emoji: '🤔', topic: 'questions' },
  { id: 'w-kaise', urdu: 'کیسے', roman: 'kaise', meaning: 'how', emoji: '🔧', topic: 'questions' },
  { id: 'w-kitna', urdu: 'کتنا', roman: 'kitna', meaning: 'how much', emoji: '🔢', topic: 'questions' },
  { id: 'w-kaunsa', urdu: 'کونسا', roman: 'kaunsa', meaning: 'which', emoji: '👉', topic: 'questions' },

  // ============ INTERMEDIATE ============
  // jobs
  { id: 'w-doctor', urdu: 'ڈاکٹر', roman: 'ḍākṭar', meaning: 'doctor', emoji: '🧑‍⚕️', topic: 'jobs' },
  { id: 'w-kisaan', urdu: 'کسان', roman: 'kisaan', meaning: 'farmer', emoji: '🧑‍🌾', topic: 'jobs' },
  { id: 'w-darzi', urdu: 'درزی', roman: 'darzi', meaning: 'tailor', emoji: '🧵', topic: 'jobs' },
  { id: 'w-naanbai', urdu: 'نانبائی', roman: 'naanbaai', meaning: 'baker', emoji: '🥖', topic: 'jobs' },
  { id: 'w-wakeel', urdu: 'وکیل', roman: 'wakeel', meaning: 'lawyer', emoji: '⚖️', topic: 'jobs' },
  { id: 'w-injineer', urdu: 'انجینئر', roman: 'injineer', meaning: 'engineer', emoji: '🧑‍🔧', topic: 'jobs' },
  { id: 'w-mazdoor', urdu: 'مزدور', roman: 'mazdoor', meaning: 'labourer', emoji: '👷', topic: 'jobs' },
  { id: 'w-sipaahi', urdu: 'سپاہی', roman: 'sipaahi', meaning: 'soldier', emoji: '🪖', topic: 'jobs' },
  { id: 'w-naukri', urdu: 'نوکری', roman: 'naukri', meaning: 'job', emoji: '📋', topic: 'jobs' },
  { id: 'w-tankhwaah', urdu: 'تنخواہ', roman: 'tankhwaah', meaning: 'salary', emoji: '🧾', topic: 'jobs' },

  // health
  { id: 'w-tabiyat', urdu: 'طبیعت', roman: 'tabiyat', meaning: 'health / condition', emoji: '🩺', topic: 'health' },
  { id: 'w-bimaar', urdu: 'بیمار', roman: 'bimaar', meaning: 'ill', emoji: '🤒', topic: 'health' },
  { id: 'w-dawa', urdu: 'دوا', roman: 'dawa', meaning: 'medicine', emoji: '💊', topic: 'health' },
  { id: 'w-dard', urdu: 'درد', roman: 'dard', meaning: 'pain', emoji: '😖', topic: 'health' },
  { id: 'w-bukhaar', urdu: 'بخار', roman: 'bukhaar', meaning: 'fever', emoji: '🌡️', topic: 'health' },
  { id: 'w-khaansi', urdu: 'کھانسی', roman: 'khaansi', meaning: 'cough', emoji: '😷', topic: 'health' },
  { id: 'w-zakhm', urdu: 'زخم', roman: 'zakhm', meaning: 'wound', emoji: '🩹', topic: 'health' },
  { id: 'w-sehat', urdu: 'صحت', roman: 'sehat', meaning: 'good health', emoji: '💪', topic: 'health' },
  { id: 'w-aaraam', urdu: 'آرام', roman: 'aaraam', meaning: 'rest / comfort', emoji: '🛌', topic: 'health' },
  { id: 'w-nabz', urdu: 'نبض', roman: 'nabz', meaning: 'pulse', emoji: '💓', topic: 'health' },

  // money & shopping
  { id: 'w-paisa', urdu: 'پیسہ', roman: 'paisa', meaning: 'money', emoji: '💰', topic: 'money' },
  { id: 'w-qeemat', urdu: 'قیمت', roman: 'qeemat', meaning: 'price', emoji: '🏷️', topic: 'money' },
  { id: 'w-sasta', urdu: 'سستا', roman: 'sasta', meaning: 'cheap', emoji: '📉', topic: 'money' },
  { id: 'w-mehnga', urdu: 'مہنگا', roman: 'mehnga', meaning: 'expensive', emoji: '📈', topic: 'money' },
  { id: 'w-kharidna', urdu: 'خریدنا', roman: 'khareedna', meaning: 'to buy', emoji: '🛒', topic: 'money' },
  { id: 'w-bechna', urdu: 'بیچنا', roman: 'bechna', meaning: 'to sell', emoji: '🤝', topic: 'money' },
  { id: 'w-hisaab', urdu: 'حساب', roman: 'hisaab', meaning: 'bill / account', emoji: '🧮', topic: 'money' },
  { id: 'w-rupya', urdu: 'روپیہ', roman: 'rupya', meaning: 'rupee', emoji: '💵', topic: 'money' },
  { id: 'w-bank', urdu: 'بینک', roman: 'bank', meaning: 'bank', emoji: '🏦', topic: 'money' },
  { id: 'w-tohfa', urdu: 'تحفہ', roman: 'tohfa', meaning: 'gift', emoji: '🎁', topic: 'money' },

  // travel
  { id: 'w-safar', urdu: 'سفر', roman: 'safar', meaning: 'journey', emoji: '🧳', topic: 'travel' },
  { id: 'w-tikat', urdu: 'ٹکٹ', roman: 'ṭikaṭ', meaning: 'ticket', emoji: '🎫', topic: 'travel' },
  { id: 'w-hotal', urdu: 'ہوٹل', roman: 'hoṭal', meaning: 'hotel', emoji: '🏨', topic: 'travel' },
  { id: 'w-samaan', urdu: 'سامان', roman: 'saamaan', meaning: 'luggage', emoji: '🎒', topic: 'travel', level: 'intermediate' },
  { id: 'w-passport', urdu: 'پاسپورٹ', roman: 'paasporṭ', meaning: 'passport', emoji: '🛂', topic: 'travel' },
  { id: 'w-mulk', urdu: 'ملک', roman: 'mulk', meaning: 'country', emoji: '🌍', topic: 'travel' },
  { id: 'w-sarhad', urdu: 'سرحد', roman: 'sarhad', meaning: 'border', emoji: '🚧', topic: 'travel' },
  { id: 'w-naqsha', urdu: 'نقشہ', roman: 'naqsha', meaning: 'map', emoji: '🗺️', topic: 'travel' },
  { id: 'w-kamra', urdu: 'کمرہ', roman: 'kamra', meaning: 'room', emoji: '🛎️', topic: 'travel' },
  { id: 'w-chhutti', urdu: 'چھٹی', roman: 'chhuṭṭi', meaning: 'holiday / leave', emoji: '🏖️', topic: 'travel' },

  // city
  { id: 'w-imaarat', urdu: 'عمارت', roman: 'imaarat', meaning: 'building', emoji: '🏛️', topic: 'city' },
  { id: 'w-pul', urdu: 'پل', roman: 'pul', meaning: 'bridge', emoji: '🌉', topic: 'city' },
  { id: 'w-thaana', urdu: 'تھانہ', roman: 'thaana', meaning: 'police station', emoji: '🚓', topic: 'city' },
  { id: 'w-dakkhana', urdu: 'ڈاک خانہ', roman: 'ḍaak-khaana', meaning: 'post office', emoji: '📮', topic: 'city' },
  { id: 'w-library', urdu: 'کتب خانہ', roman: 'kutub-khaana', meaning: 'library', emoji: '📚', topic: 'city' },
  { id: 'w-chowk', urdu: 'چوک', roman: 'chowk', meaning: 'town square', emoji: '⛲', topic: 'city' },
  { id: 'w-gali', urdu: 'گلی', roman: 'gali', meaning: 'lane / alley', emoji: '🛤️', topic: 'city' },
  { id: 'w-mehmaan', urdu: 'مہمان', roman: 'mehmaan', meaning: 'guest', emoji: '🙋‍♂️', topic: 'city' },
  { id: 'w-hujoom', urdu: 'ہجوم', roman: 'hujoom', meaning: 'crowd', emoji: '👥', topic: 'city' },
  { id: 'w-shor', urdu: 'شور', roman: 'shor', meaning: 'noise', emoji: '📢', topic: 'city' },

  // cooking
  { id: 'w-pakaana', urdu: 'پکانا', roman: 'pakaana', meaning: 'to cook', emoji: '🍳', topic: 'cooking' },
  { id: 'w-degchi', urdu: 'دیگچی', roman: 'degchi', meaning: 'cooking pot', emoji: '🍲', topic: 'cooking' },
  { id: 'w-chamach', urdu: 'چمچ', roman: 'chamach', meaning: 'spoon', emoji: '🥄', topic: 'cooking' },
  { id: 'w-chaaqu', urdu: 'چاقو', roman: 'chaaqu', meaning: 'knife', emoji: '🔪', topic: 'cooking' },
  { id: 'w-plate', urdu: 'پلیٹ', roman: 'pleṭ', meaning: 'plate', emoji: '🍽️', topic: 'cooking' },
  { id: 'w-masala', urdu: 'مصالحہ', roman: 'masaala', meaning: 'spice', emoji: '🌶️', topic: 'cooking' },
  { id: 'w-tel', urdu: 'تیل', roman: 'tel', meaning: 'oil', emoji: '🫗', topic: 'cooking' },
  { id: 'w-aata', urdu: 'آٹا', roman: 'aaṭa', meaning: 'flour', emoji: '🌾', topic: 'cooking' },
  { id: 'w-cheeni', urdu: 'چینی', roman: 'cheeni', meaning: 'sugar', emoji: '🍬', topic: 'cooking' },
  { id: 'w-aag', urdu: 'آگ', roman: 'aag', meaning: 'fire', emoji: '🔥', topic: 'cooking' },

  // sports & leisure
  { id: 'w-khel', urdu: 'کھیل', roman: 'khel', meaning: 'game / sport', emoji: '⚽', topic: 'sports' },
  { id: 'w-khelna', urdu: 'کھیلنا', roman: 'khelna', meaning: 'to play', emoji: '🤸', topic: 'sports' },
  { id: 'w-gend', urdu: 'گیند', roman: 'gend', meaning: 'ball', emoji: '🏐', topic: 'sports' },
  { id: 'w-cricket', urdu: 'کرکٹ', roman: 'krikeṭ', meaning: 'cricket', emoji: '🏏', topic: 'sports' },
  { id: 'w-tairna', urdu: 'تیرنا', roman: 'tairna', meaning: 'to swim', emoji: '🏊', topic: 'sports' },
  { id: 'w-daurna', urdu: 'دوڑنا', roman: 'dauṛna', meaning: 'to run', emoji: '🏃', topic: 'sports' },
  { id: 'w-jeetna', urdu: 'جیتنا', roman: 'jeetna', meaning: 'to win', emoji: '🏆', topic: 'sports' },
  { id: 'w-haarna', urdu: 'ہارنا', roman: 'haarna', meaning: 'to lose', emoji: '🥈', topic: 'sports' },
  { id: 'w-shauq', urdu: 'شوق', roman: 'shauq', meaning: 'hobby / passion', emoji: '🎨', topic: 'sports' },
  { id: 'w-gaana', urdu: 'گانا', roman: 'gaana', meaning: 'song / to sing', emoji: '🎵', topic: 'sports' },

  // days & months
  { id: 'w-peer', urdu: 'پیر', roman: 'peer', meaning: 'Monday', emoji: '1️⃣', topic: 'days' },
  { id: 'w-mangal', urdu: 'منگل', roman: 'mangal', meaning: 'Tuesday', emoji: '2️⃣', topic: 'days' },
  { id: 'w-budh', urdu: 'بدھ', roman: 'budh', meaning: 'Wednesday', emoji: '3️⃣', topic: 'days' },
  { id: 'w-jumeraat', urdu: 'جمعرات', roman: 'jumeraat', meaning: 'Thursday', emoji: '4️⃣', topic: 'days' },
  { id: 'w-juma', urdu: 'جمعہ', roman: 'juma', meaning: 'Friday', emoji: '5️⃣', topic: 'days' },
  { id: 'w-hafta-din', urdu: 'ہفتہ', roman: 'hafta', meaning: 'Saturday (also: week)', emoji: '6️⃣', topic: 'days' },
  { id: 'w-itwaar', urdu: 'اتوار', roman: 'itwaar', meaning: 'Sunday', emoji: '7️⃣', topic: 'days' },
  { id: 'w-tareekh', urdu: 'تاریخ', roman: 'taareekh', meaning: 'date / history', emoji: '📆', topic: 'days' },
  { id: 'w-mausam', urdu: 'موسم', roman: 'mausam', meaning: 'season / weather', emoji: '🍂', topic: 'days' },
  { id: 'w-sadi', urdu: 'صدی', roman: 'sadi', meaning: 'century', emoji: '🏛️', topic: 'days' },
  // the twelve months — Urdu uses the same names as English, adapted to its
  // own script and sounds, the way most languages that adopted the Gregorian
  // calendar do
  { id: 'w-january', urdu: 'جنوری', roman: 'janvari', meaning: 'January', emoji: '📅', topic: 'days' },
  { id: 'w-february', urdu: 'فروری', roman: 'farvari', meaning: 'February', emoji: '📅', topic: 'days' },
  { id: 'w-march', urdu: 'مارچ', roman: 'maarch', meaning: 'March', emoji: '📅', topic: 'days' },
  { id: 'w-april', urdu: 'اپریل', roman: 'aprail', meaning: 'April', emoji: '📅', topic: 'days' },
  { id: 'w-may', urdu: 'مئی', roman: 'maee', meaning: 'May', emoji: '📅', topic: 'days' },
  { id: 'w-june', urdu: 'جون', roman: 'joon', meaning: 'June', emoji: '📅', topic: 'days' },
  { id: 'w-july', urdu: 'جولائی', roman: 'julaaee', meaning: 'July', emoji: '📅', topic: 'days' },
  { id: 'w-august', urdu: 'اگست', roman: 'agast', meaning: 'August', emoji: '📅', topic: 'days' },
  { id: 'w-september', urdu: 'ستمبر', roman: 'sitambar', meaning: 'September', emoji: '📅', topic: 'days' },
  { id: 'w-october', urdu: 'اکتوبر', roman: 'aktoobar', meaning: 'October', emoji: '📅', topic: 'days' },
  { id: 'w-november', urdu: 'نومبر', roman: 'nawambar', meaning: 'November', emoji: '📅', topic: 'days' },
  { id: 'w-december', urdu: 'دسمبر', roman: 'disambar', meaning: 'December', emoji: '📅', topic: 'days' },

  // directions
  { id: 'w-daayaan', urdu: 'دایاں', roman: 'daayaañ', meaning: 'right', emoji: '➡️', topic: 'directions' },
  { id: 'w-baayaan', urdu: 'بایاں', roman: 'baayaañ', meaning: 'left', emoji: '⬅️', topic: 'directions' },
  { id: 'w-seedha', urdu: 'سیدھا', roman: 'seedha', meaning: 'straight', emoji: '⬆️', topic: 'directions' },
  { id: 'w-qareeb', urdu: 'قریب', roman: 'qareeb', meaning: 'near', emoji: '📍', topic: 'directions' },
  { id: 'w-door', urdu: 'دور', roman: 'door', meaning: 'far', emoji: '🔭', topic: 'directions' },
  { id: 'w-oopar', urdu: 'اوپر', roman: 'oopar', meaning: 'above / up', emoji: '🔼', topic: 'directions' },
  { id: 'w-neeche', urdu: 'نیچے', roman: 'neeche', meaning: 'below / down', emoji: '🔽', topic: 'directions' },
  { id: 'w-andar', urdu: 'اندر', roman: 'andar', meaning: 'inside', emoji: '📥', topic: 'directions' },
  { id: 'w-baahar', urdu: 'باہر', roman: 'baahar', meaning: 'outside', emoji: '📤', topic: 'directions' },
  { id: 'w-saamne', urdu: 'سامنے', roman: 'saamne', meaning: 'in front of', emoji: '🔛', topic: 'directions' },

  // more verbs
  { id: 'w-sunna', urdu: 'سننا', roman: 'sunna', meaning: 'to hear', emoji: '👂', topic: 'verbs2' },
  { id: 'w-samajhna', urdu: 'سمجھنا', roman: 'samajhna', meaning: 'to understand', emoji: '💡', topic: 'verbs2' },
  { id: 'w-sochna', urdu: 'سوچنا', roman: 'sochna', meaning: 'to think', emoji: '🤔', topic: 'verbs2' },
  { id: 'w-dena', urdu: 'دینا', roman: 'dena', meaning: 'to give', emoji: '🤲', topic: 'verbs2' },
  { id: 'w-lena', urdu: 'لینا', roman: 'lena', meaning: 'to take', emoji: '🫴', topic: 'verbs2' },
  { id: 'w-baithna', urdu: 'بیٹھنا', roman: 'baiṭhna', meaning: 'to sit', emoji: '🪑', topic: 'verbs2' },
  { id: 'w-uthna', urdu: 'اٹھنا', roman: 'uṭhna', meaning: 'to get up', emoji: '🧍', topic: 'verbs2' },
  { id: 'w-chalna', urdu: 'چلنا', roman: 'chalna', meaning: 'to walk / move', emoji: '🚶', topic: 'verbs2' },
  { id: 'w-rakhna', urdu: 'رکھنا', roman: 'rakhna', meaning: 'to put / keep', emoji: '📦', topic: 'verbs2' },
  { id: 'w-milna', urdu: 'ملنا', roman: 'milna', meaning: 'to meet', emoji: '🤝', topic: 'verbs2' },

  // ============ ADVANCED ============
  // emotions & mind
  { id: 'w-umeed', urdu: 'امید', roman: 'umeed', meaning: 'hope', emoji: '🌅', topic: 'emotions' },
  { id: 'w-fikr', urdu: 'فکر', roman: 'fikr', meaning: 'worry / thought', emoji: '😟', topic: 'emotions' },
  { id: 'w-yaqeen', urdu: 'یقین', roman: 'yaqeen', meaning: 'certainty / belief', emoji: '🤞', topic: 'emotions' },
  { id: 'w-hausla', urdu: 'حوصلہ', roman: 'hausla', meaning: 'courage', emoji: '🦁', topic: 'emotions' },
  { id: 'w-sabr', urdu: 'صبر', roman: 'sabr', meaning: 'patience', emoji: '⏳', topic: 'emotions' },
  { id: 'w-hasrat', urdu: 'حسرت', roman: 'hasrat', meaning: 'longing', emoji: '🥺', topic: 'emotions' },
  { id: 'w-sukoon', urdu: 'سکون', roman: 'sukoon', meaning: 'peace / calm', emoji: '🕊️', topic: 'emotions' },
  { id: 'w-tanhai', urdu: 'تنہائی', roman: 'tanhaai', meaning: 'solitude', emoji: '🌘', topic: 'emotions' },
  { id: 'w-khwaab', urdu: 'خواب', roman: 'khwaab', meaning: 'dream', emoji: '💤', topic: 'emotions' },
  { id: 'w-yaad', urdu: 'یاد', roman: 'yaad', meaning: 'memory', emoji: '💭', topic: 'emotions' },

  // ideas & values
  { id: 'w-sach', urdu: 'سچ', roman: 'sach', meaning: 'truth', emoji: '✅', topic: 'abstract' },
  { id: 'w-jhoot', urdu: 'جھوٹ', roman: 'jhooṭ', meaning: 'lie', emoji: '❌', topic: 'abstract' },
  { id: 'w-insaaf', urdu: 'انصاف', roman: 'insaaf', meaning: 'justice', emoji: '⚖️', topic: 'abstract' },
  { id: 'w-azadi', urdu: 'آزادی', roman: 'aazaadi', meaning: 'freedom', emoji: '🕊️', topic: 'abstract' },
  { id: 'w-ilm', urdu: 'علم', roman: 'ilm', meaning: 'knowledge', emoji: '📚', topic: 'abstract' },
  { id: 'w-aqal', urdu: 'عقل', roman: 'aqal', meaning: 'reason / wisdom', emoji: '🧠', topic: 'abstract' },
  { id: 'w-izzat', urdu: 'عزت', roman: 'izzat', meaning: 'honour / respect', emoji: '🎖️', topic: 'abstract' },
  { id: 'w-farz', urdu: 'فرض', roman: 'farz', meaning: 'duty', emoji: '📜', topic: 'abstract' },
  { id: 'w-imkaan', urdu: 'امکان', roman: 'imkaan', meaning: 'possibility', emoji: '🎲', topic: 'abstract' },
  { id: 'w-taraqqi', urdu: 'ترقی', roman: 'taraqqi', meaning: 'progress', emoji: '📈', topic: 'abstract' },

  // culture & faith
  { id: 'w-eid', urdu: 'عید', roman: 'eid', meaning: 'Eid (festival)', emoji: '🌙', topic: 'culture' },
  { id: 'w-shaayari', urdu: 'شاعری', roman: 'shaayari', meaning: 'poetry', emoji: '📝', topic: 'culture' },
  { id: 'w-ghazal', urdu: 'غزل', roman: 'ghazal', meaning: 'ghazal (poem)', emoji: '🎼', topic: 'culture' },
  { id: 'w-rivaayat', urdu: 'روایت', roman: 'riwaayat', meaning: 'tradition', emoji: '🏺', topic: 'culture' },
  { id: 'w-tehzeeb', urdu: 'تہذیب', roman: 'tehzeeb', meaning: 'culture / refinement', emoji: '🎭', topic: 'culture' },
  { id: 'w-dua', urdu: 'دعا', roman: 'dua', meaning: 'prayer / supplication', emoji: '🤲', topic: 'culture' },
  { id: 'w-namaz', urdu: 'نماز', roman: 'namaaz', meaning: 'prayer (ritual)', emoji: '🕌', topic: 'culture' },
  { id: 'w-roza', urdu: 'روزہ', roman: 'roza', meaning: 'fast (Ramadan)', emoji: '🌛', topic: 'culture' },
  { id: 'w-mehndi', urdu: 'مہندی', roman: 'mehndi', meaning: 'henna', emoji: '🌿', topic: 'culture' },
  { id: 'w-dastaan', urdu: 'داستان', roman: 'daastaan', meaning: 'tale / saga', emoji: '📖', topic: 'culture' },

  // modern life
  { id: 'w-computer', urdu: 'کمپیوٹر', roman: 'kampyooṭar', meaning: 'computer', emoji: '💻', topic: 'tech' },
  { id: 'w-mobile', urdu: 'موبائل', roman: 'mobaail', meaning: 'mobile phone', emoji: '📱', topic: 'tech' },
  { id: 'w-internet', urdu: 'انٹرنیٹ', roman: 'inṭarneṭ', meaning: 'internet', emoji: '🌐', topic: 'tech' },
  { id: 'w-khabar', urdu: 'خبر', roman: 'khabar', meaning: 'news', emoji: '📰', topic: 'tech' },
  { id: 'w-akhbaar', urdu: 'اخبار', roman: 'akhbaar', meaning: 'newspaper', emoji: '🗞️', topic: 'tech' },
  { id: 'w-bijli', urdu: 'بجلی', roman: 'bijli', meaning: 'electricity', emoji: '⚡', topic: 'tech' },
  { id: 'w-machine', urdu: 'مشین', roman: 'masheen', meaning: 'machine', emoji: '⚙️', topic: 'tech' },
  { id: 'w-tasveer', urdu: 'تصویر', roman: 'tasweer', meaning: 'picture', emoji: '🖼️', topic: 'tech' },
  { id: 'w-paighaam', urdu: 'پیغام', roman: 'paighaam', meaning: 'message', emoji: '✉️', topic: 'tech' },
  { id: 'w-ilaaj', urdu: 'علاج', roman: 'ilaaj', meaning: 'treatment / cure', emoji: '🏥', topic: 'tech' },

  // the natural world
  { id: 'w-darya', urdu: 'دریا', roman: 'darya', meaning: 'river', emoji: '🏞️', topic: 'nature2' },
  { id: 'w-sehra', urdu: 'صحرا', roman: 'sehra', meaning: 'desert', emoji: '🏜️', topic: 'nature2' },
  { id: 'w-jangal', urdu: 'جنگل', roman: 'jangal', meaning: 'forest', emoji: '🌲', topic: 'nature2' },
  { id: 'w-jheel', urdu: 'جھیل', roman: 'jheel', meaning: 'lake', emoji: '🏔️', topic: 'nature2' },
  { id: 'w-aasmaan', urdu: 'آسمان', roman: 'aasmaan', meaning: 'sky', emoji: '🌌', topic: 'nature2' },
  { id: 'w-zalzala', urdu: 'زلزلہ', roman: 'zalzala', meaning: 'earthquake', emoji: '🌋', topic: 'nature2' },
  { id: 'w-bahaar', urdu: 'بہار', roman: 'bahaar', meaning: 'spring (season)', emoji: '🌷', topic: 'nature2' },
  { id: 'w-khizaan', urdu: 'خزاں', roman: 'khizaañ', meaning: 'autumn', emoji: '🍁', topic: 'nature2' },
  { id: 'w-fasal', urdu: 'فصل', roman: 'fasal', meaning: 'crop / harvest', emoji: '🌾', topic: 'nature2' },
  { id: 'w-qudrat', urdu: 'قدرت', roman: 'qudrat', meaning: 'nature', emoji: '🍃', topic: 'nature2' },

  // linking words
  { id: 'w-lekin', urdu: 'لیکن', roman: 'lekin', meaning: 'but', emoji: '↔️', topic: 'connectors' },
  { id: 'w-kyunke', urdu: 'کیونکہ', roman: 'kyunke', meaning: 'because', emoji: '➰', topic: 'connectors' },
  { id: 'w-isliye', urdu: 'اس لیے', roman: 'is liye', meaning: 'therefore', emoji: '➡️', topic: 'connectors' },
  { id: 'w-agar', urdu: 'اگر', roman: 'agar', meaning: 'if', emoji: '🔀', topic: 'connectors' },
  { id: 'w-agarche', urdu: 'اگرچہ', roman: 'agarche', meaning: 'although', emoji: '🔁', topic: 'connectors' },
  { id: 'w-phir-bhi', urdu: 'پھر بھی', roman: 'phir bhi', meaning: 'even so', emoji: '🔂', topic: 'connectors' },
  { id: 'w-aur', urdu: 'اور', roman: 'aur', meaning: 'and', emoji: '➕', topic: 'connectors' },
  { id: 'w-ya', urdu: 'یا', roman: 'ya', meaning: 'or', emoji: '⤴️', topic: 'connectors' },
  { id: 'w-magar', urdu: 'مگر', roman: 'magar', meaning: 'however', emoji: '↩️', topic: 'connectors' },
  { id: 'w-taake', urdu: 'تاکہ', roman: 'taake', meaning: 'so that', emoji: '🎯', topic: 'connectors' },
];

/** Core topics plus every modular vocabulary pack. */
export const TOPICS: Topic[] = [...CORE_TOPICS, ...ALL_PACKS.map((p) => p.topic)];
export const WORDS: Word[] = [...CORE_WORDS, ...ALL_PACKS.flatMap((p) => p.words)];

/** Short, high-value phrases for the "speak with family" goal. */
export type Phrase = { id: string; urdu: string; roman: string; meaning: string };

export const PHRASES: Phrase[] = [
  // greetings & courtesy
  { id: 'p-1', urdu: 'السلام علیکم', roman: 'assalaam-o-alaikum', meaning: 'Peace be upon you (hello)' },
  { id: 'p-2', urdu: 'وعلیکم السلام', roman: 'wa-alaikum-assalaam', meaning: 'And peace upon you (reply)' },
  { id: 'p-3', urdu: 'آپ کیسے ہیں؟', roman: 'aap kaise hain?', meaning: 'How are you?' },
  { id: 'p-4', urdu: 'میں ٹھیک ہوں', roman: 'main ṭheek hoon', meaning: 'I am well' },
  { id: 'p-5', urdu: 'شکریہ', roman: 'shukriya', meaning: 'Thank you' },
  { id: 'p-6', urdu: 'کوئی بات نہیں', roman: 'koi baat nahiñ', meaning: "You're welcome / no problem" },
  { id: 'p-7', urdu: 'معاف کیجیے', roman: 'maaf keejiye', meaning: 'Excuse me / sorry' },
  { id: 'p-8', urdu: 'خدا حافظ', roman: 'khuda haafiz', meaning: 'Goodbye' },
  { id: 'p-9', urdu: 'پھر ملیں گے', roman: 'phir milenge', meaning: 'See you again' },

  // introductions
  { id: 'p-10', urdu: 'آپ کا نام کیا ہے؟', roman: 'aap ka naam kya hai?', meaning: "What's your name?" },
  { id: 'p-11', urdu: 'میرا نام ... ہے', roman: 'mera naam ... hai', meaning: 'My name is ...' },
  { id: 'p-12', urdu: 'آپ سے مل کر خوشی ہوئی', roman: 'aap se mil kar khushi hui', meaning: 'Nice to meet you' },
  { id: 'p-13', urdu: 'آپ کہاں سے ہیں؟', roman: 'aap kahaañ se hain?', meaning: 'Where are you from?' },
  { id: 'p-14', urdu: 'میں ... سے ہوں', roman: 'main ... se hoon', meaning: 'I am from ...' },

  // everyday needs
  { id: 'p-15', urdu: 'یہ کیا ہے؟', roman: 'ye kya hai?', meaning: 'What is this?' },
  { id: 'p-16', urdu: 'یہ کتنے کا ہے؟', roman: 'ye kitne ka hai?', meaning: 'How much is this?' },
  { id: 'p-17', urdu: 'مجھے یہ چاہیے', roman: 'mujhe ye chaahiye', meaning: 'I need / want this' },
  { id: 'p-18', urdu: 'مجھے سمجھ نہیں آئی', roman: 'mujhe samajh nahiñ aayi', meaning: "I don't understand" },
  { id: 'p-19', urdu: 'دوبارہ کہیں', roman: 'dobaara kaheñ', meaning: 'Please say it again' },
  { id: 'p-20', urdu: 'آہستہ بولیں', roman: 'aahista boleñ', meaning: 'Please speak slowly' },
  { id: 'p-21', urdu: 'بیت الخلا کہاں ہے؟', roman: 'bait-ul-khala kahaañ hai?', meaning: 'Where is the toilet?' },
  { id: 'p-22', urdu: 'مدد کیجیے', roman: 'madad keejiye', meaning: 'Please help' },

  // feelings & small talk
  { id: 'p-23', urdu: 'مجھے بھوک لگی ہے', roman: 'mujhe bhookh lagi hai', meaning: 'I am hungry' },
  { id: 'p-24', urdu: 'مجھے پیاس لگی ہے', roman: 'mujhe pyaas lagi hai', meaning: 'I am thirsty' },
  { id: 'p-25', urdu: 'مجھے چائے پسند ہے', roman: 'mujhe chai pasand hai', meaning: 'I like tea' },
  { id: 'p-26', urdu: 'بہت اچھا', roman: 'bahut achha', meaning: 'Very good' },
  { id: 'p-27', urdu: 'کیا وقت ہوا ہے؟', roman: 'kya waqt hua hai?', meaning: 'What time is it?' },
  { id: 'p-28', urdu: 'مبارک ہو', roman: 'mubaarak ho', meaning: 'Congratulations' },
];

export const wordsByTopic = (topic: string) => WORDS.filter((w) => w.topic === topic);
export const getWord = (id: string) => WORDS.find((w) => w.id === id);
export const getTopic = (id: string) => TOPICS.find((t) => t.id === id);
export const topicsByLevel = (level: Level) => TOPICS.filter((t) => t.level === level);

/** A word's level — its own, else inherited from its topic. */
export const levelOfWord = (w: Word): Level => w.level ?? getTopic(w.topic)?.level ?? 'beginner';

export const LEVEL_ORDER: Level[] = ['beginner', 'elementary', 'intermediate', 'advanced'];

export const LEVEL_META: Record<
  Level,
  { title: string; tag: string; blurb: string; romanBlurb?: string; color: string }
> = {
  beginner: {
    title: 'Beginner', tag: 'A1',
    // Only this stage teaches the alphabet, so only this stage's blurb has to
    // change when the learner is not being taught it.
    blurb: 'Read the script and hold your first words.',
    romanBlurb: 'Your first words, and your first sentences.',
    color: '#FFC72C',
  },
  elementary: {
    title: 'Elementary', tag: 'A2',
    blurb: 'Describe your world and ask simple questions.',
    color: '#5FDC96',
  },
  intermediate: {
    title: 'Intermediate', tag: 'B1',
    blurb: 'Handle daily life, work, travel, money, health.',
    color: '#FF7A72',
  },
  advanced: {
    title: 'Advanced', tag: 'B2',
    blurb: 'Express ideas, feelings and opinions with nuance.',
    color: '#5AA9FF',
  },
};
