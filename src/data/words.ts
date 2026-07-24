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
  { id: 'body', title: 'The Body', icon: '🖐️', blurb: 'Name yourself, head to toe.' },
  { id: 'animals', title: 'Animals', icon: '🐐', blurb: 'Creatures at home and in the wild.' },
  { id: 'fruits', title: 'Fruits', icon: '🥭', blurb: 'Sweet words for the fruit stall.' },
  { id: 'vegetables', title: 'Vegetables', icon: '🥕', blurb: 'Everything at the sabzi shop.' },
  { id: 'clothing', title: 'Clothing', icon: '👕', blurb: 'What you wear each day.' },
  { id: 'school', title: 'School', icon: '🏫', blurb: 'Words for the classroom.' },
  { id: 'time', title: 'Time & Day', icon: '⏰', blurb: 'Morning, night, today, tomorrow.' },
  { id: 'weather', title: 'Weather', icon: '🌦️', blurb: 'Sun, rain, heat and cold.' },
  { id: 'places', title: 'Places', icon: '🏙️', blurb: 'Around town and beyond.' },
  { id: 'transport', title: 'Getting Around', icon: '🚗', blurb: 'Cars, trains and boats.' },
  { id: 'verbs', title: 'Actions', icon: '🏃', blurb: 'The verbs you use most.' },
  { id: 'adjectives', title: 'Describing', icon: '📏', blurb: 'Big, small, good, new…' },
  { id: 'feelings', title: 'Feelings', icon: '😊', blurb: 'How you and others feel.' },
  { id: 'questions', title: 'Question Words', icon: '❓', blurb: 'Who, what, where, when.' },
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
  { id: 'w-mahina', urdu: 'مہینہ', roman: 'mahina', meaning: 'month', emoji: '📅', topic: 'time' },
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
];

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
