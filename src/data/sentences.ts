/**
 * Sentences and short reading passages — original content written for Harf.
 *
 * Two purposes:
 *  1. `SENTENCES` feed the sentence-building exercise: the learner assembles a
 *     sentence from shuffled word tiles, which teaches Urdu word order
 *     (subject → object → verb) far better than any explanation.
 *  2. `PASSAGES` are short graded readings. Following the classic primer
 *     method, each one reuses vocabulary the learner already has, so reading
 *     feels like recognition rather than decoding.
 */

import type { Level } from './words';

export type Sentence = {
  id: string;
  /** words in correct order — the tile pool is these, shuffled */
  words: string[];
  roman: string;
  meaning: string;
  level: Level;
  /** grammar concept this sentence illustrates, if any */
  concept?: string;
};

export const SENTENCES: Sentence[] = [
  // ---- beginner: X is Y ----
  { id: 's-1', words: ['یہ', 'کتاب', 'ہے'], roman: 'ye kitaab hai', meaning: 'This is a book', level: 'beginner', concept: 'g-to-be' },
  { id: 's-2', words: ['میں', 'خوش', 'ہوں'], roman: 'main khush hoon', meaning: 'I am happy', level: 'beginner', concept: 'g-to-be' },
  { id: 's-3', words: ['وہ', 'میرا', 'دوست', 'ہے'], roman: 'wo mera dost hai', meaning: 'He is my friend', level: 'beginner', concept: 'g-to-be' },
  { id: 's-4', words: ['آپ', 'کیسے', 'ہیں'], roman: 'aap kaise hain', meaning: 'How are you?', level: 'beginner' },
  { id: 's-5', words: ['میرا', 'نام', 'علی', 'ہے'], roman: 'mera naam Ali hai', meaning: 'My name is Ali', level: 'beginner', concept: 'g-possess' },
  { id: 's-6', words: ['یہ', 'میری', 'ماں', 'ہیں'], roman: 'ye meri maañ hain', meaning: 'This is my mother', level: 'beginner', concept: 'g-possess' },
  { id: 's-7', words: ['پانی', 'ٹھنڈا', 'ہے'], roman: 'paani ṭhanḍa hai', meaning: 'The water is cold', level: 'beginner' },
  { id: 's-8', words: ['وہ', 'بڑا', 'گھر', 'ہے'], roman: 'wo baṛa ghar hai', meaning: 'That is a big house', level: 'beginner', concept: 'g-gender' },
  { id: 's-29', words: ['یہ', 'میرا', 'گھر', 'ہے'], roman: 'ye mera ghar hai', meaning: 'This is my house', level: 'beginner', concept: 'g-possess' },
  { id: 's-30', words: ['میں', 'ڈاکٹر', 'ہوں'], roman: 'main ḍākṭar hoon', meaning: 'I am a doctor', level: 'beginner', concept: 'g-to-be' },
  { id: 's-31', words: ['تم', 'بیمار', 'ہو'], roman: 'tum bimaar ho', meaning: 'You are ill', level: 'beginner', concept: 'g-to-be' },
  { id: 's-32', words: ['ہم', 'دوست', 'ہیں'], roman: 'ham dost hain', meaning: 'We are friends', level: 'beginner', concept: 'g-to-be' },
  { id: 's-33', words: ['یہ', 'چائے', 'گرم', 'ہے'], roman: 'ye chai garam hai', meaning: 'This tea is hot', level: 'beginner' },
  { id: 's-34', words: ['میری', 'بہن', 'چھوٹی', 'ہے'], roman: 'meri behen chhoṭi hai', meaning: 'My sister is small', level: 'beginner', concept: 'g-gender' },
  { id: 's-35', words: ['میرا', 'بھائی', 'لمبا', 'ہے'], roman: 'mera bhai lamba hai', meaning: 'My brother is tall', level: 'beginner', concept: 'g-gender' },
  { id: 's-36', words: ['یہ', 'کتاب', 'اچھی', 'ہے'], roman: 'ye kitaab achhi hai', meaning: 'This book is good', level: 'beginner', concept: 'g-gender' },
  { id: 's-37', words: ['وہ', 'لڑکا', 'ہوشیار', 'ہے'], roman: 'wo laṛka hoshiyaar hai', meaning: 'That boy is clever', level: 'beginner' },
  { id: 's-38', words: ['یہاں', 'دو', 'لڑکے', 'ہیں'], roman: 'yahaañ do laṛke hain', meaning: 'There are two boys here', level: 'beginner', concept: 'g-plurals' },
  { id: 's-39', words: ['میز', 'پر', 'تین', 'کتابیں', 'ہیں'], roman: 'mez par teen kitaabeñ hain', meaning: 'There are three books on the table', level: 'beginner', concept: 'g-plurals' },
  { id: 's-40', words: ['یہ', 'پھول', 'خوبصورت', 'ہے'], roman: 'ye phool khoobsurat hai', meaning: 'This flower is beautiful', level: 'beginner' },
  { id: 's-41', words: ['آپ', 'کا', 'نام', 'کیا', 'ہے'], roman: 'aap ka naam kya hai', meaning: 'What is your name?', level: 'beginner', concept: 'g-questions' },
  { id: 's-42', words: ['یہ', 'میری', 'کتاب', 'ہے'], roman: 'ye meri kitaab hai', meaning: 'This is my book', level: 'beginner', concept: 'g-possess' },
  { id: 's-43', words: ['وہ', 'ہمارا', 'اسکول', 'ہے'], roman: 'wo hamaara iskool hai', meaning: 'That is our school', level: 'beginner', concept: 'g-possess' },
  { id: 's-44', words: ['دودھ', 'سفید', 'ہے'], roman: 'doodh safed hai', meaning: 'Milk is white', level: 'beginner' },
  { id: 's-45', words: ['آسمان', 'نیلا', 'ہے'], roman: 'aasmaan neela hai', meaning: 'The sky is blue', level: 'beginner' },
  { id: 's-46', words: ['میں', 'ٹھیک', 'ہوں'], roman: 'main ṭheek hoon', meaning: 'I am fine', level: 'beginner', concept: 'g-to-be' },
  { id: 's-47', words: ['یہ', 'میرے', 'والد', 'ہیں'], roman: 'ye mere waalid hain', meaning: 'This is my father', level: 'beginner', concept: 'g-possess' },
  { id: 's-48', words: ['کمرہ', 'صاف', 'ہے'], roman: 'kamra saaf hai', meaning: 'The room is clean', level: 'beginner' },
  { id: 's-49', words: ['وہ', 'لڑکی', 'ذہین', 'ہے'], roman: 'wo laṛki zaheen hai', meaning: 'That girl is intelligent', level: 'beginner', concept: 'g-gender' },
  { id: 's-50', words: ['میرے', 'پاس', 'قلم', 'ہے'], roman: 'mere paas qalam hai', meaning: 'I have a pen', level: 'beginner', concept: 'g-possess' },
  { id: 's-51', words: ['یہ', 'گھر', 'پرانا', 'ہے'], roman: 'ye ghar puraana hai', meaning: 'This house is old', level: 'beginner' },
  { id: 's-52', words: ['سیب', 'لال', 'ہے'], roman: 'seb laal hai', meaning: 'The apple is red', level: 'beginner' },
  { id: 's-53', words: ['ہم', 'خوش', 'ہیں'], roman: 'ham khush hain', meaning: 'We are happy', level: 'beginner', concept: 'g-to-be' },
  { id: 's-54', words: ['تم', 'میرے', 'دوست', 'ہو'], roman: 'tum mere dost ho', meaning: 'You are my friend', level: 'beginner', concept: 'g-to-be' },
  { id: 's-55', words: ['یہ', 'کھانا', 'مزیدار', 'ہے'], roman: 'ye khaana mazedaar hai', meaning: 'This food is delicious', level: 'beginner' },
  { id: 's-56', words: ['رات', 'ٹھنڈی', 'ہے'], roman: 'raat ṭhanḍi hai', meaning: 'The night is cold', level: 'beginner', concept: 'g-gender' },
  { id: 's-57', words: ['دروازہ', 'بند', 'ہے'], roman: 'darwaaza band hai', meaning: 'The door is closed', level: 'beginner' },

  // ---- elementary: place, possession, questions ----
  { id: 's-9', words: ['کتاب', 'میز', 'پر', 'ہے'], roman: 'kitaab mez par hai', meaning: 'The book is on the table', level: 'elementary', concept: 'g-postpositions' },
  { id: 's-10', words: ['ہم', 'گھر', 'میں', 'ہیں'], roman: 'ham ghar meñ hain', meaning: 'We are in the house', level: 'elementary', concept: 'g-postpositions' },
  { id: 's-11', words: ['آپ', 'کہاں', 'رہتے', 'ہیں'], roman: 'aap kahaañ rehte hain', meaning: 'Where do you live?', level: 'elementary' },
  { id: 's-12', words: ['یہ', 'کتنے', 'کا', 'ہے'], roman: 'ye kitne ka hai', meaning: 'How much is this?', level: 'elementary' },
  { id: 's-13', words: ['میرے', 'دو', 'بھائی', 'ہیں'], roman: 'mere do bhai hain', meaning: 'I have two brothers', level: 'elementary', concept: 'g-possess' },
  { id: 's-14', words: ['کمرے', 'میں', 'کوئی', 'نہیں'], roman: 'kamre meñ koi nahiñ', meaning: 'There is nobody in the room', level: 'elementary', concept: 'g-oblique' },
  { id: 's-15', words: ['بچے', 'باغ', 'میں', 'کھیلتے', 'ہیں'], roman: 'bachche baagh meñ khelte hain', meaning: 'The children play in the garden', level: 'elementary' },
  { id: 's-58', words: ['میں', 'بازار', 'سے', 'آیا'], roman: 'main bazaar se aaya', meaning: 'I came from the market', level: 'elementary', concept: 'g-postpositions' },
  { id: 's-59', words: ['لڑکے', 'کو', 'کتاب', 'دو'], roman: 'laṛke ko kitaab do', meaning: 'Give the book to the boy', level: 'elementary', concept: 'g-oblique' },
  { id: 's-60', words: ['کمرے', 'میں', 'میز', 'ہے'], roman: 'kamre meñ mez hai', meaning: 'There is a table in the room', level: 'elementary', concept: 'g-oblique' },
  { id: 's-61', words: ['چابی', 'دراز', 'میں', 'ہے'], roman: 'chaabi daraaz meñ hai', meaning: 'The key is in the drawer', level: 'elementary', concept: 'g-postpositions' },
  { id: 's-62', words: ['ہم', 'رات', 'تک', 'کام', 'کرتے', 'ہیں'], roman: 'ham raat tak kaam karte hain', meaning: 'We work until night', level: 'elementary', concept: 'g-postpositions' },
  { id: 's-63', words: ['وہ', 'میرے', 'ساتھ', 'آیا'], roman: 'wo mere saath aaya', meaning: 'He came with me', level: 'elementary', concept: 'g-postpositions' },
  { id: 's-64', words: ['مجھے', 'یہ', 'پسند', 'نہیں'], roman: 'mujhe ye pasand nahiñ', meaning: "I don't like this", level: 'elementary', concept: 'g-negation' },
  { id: 's-65', words: ['وہ', 'یہاں', 'نہیں', 'ہے'], roman: 'wo yahaañ nahiñ hai', meaning: 'He is not here', level: 'elementary', concept: 'g-negation' },
  { id: 's-66', words: ['میں', 'اردو', 'نہیں', 'بولتا'], roman: 'main urdu nahiñ bolta', meaning: "I don't speak Urdu", level: 'elementary', concept: 'g-negation' },
  { id: 's-67', words: ['دروازہ', 'مت', 'کھولو'], roman: 'darwaaza mat kholo', meaning: "Don't open the door", level: 'elementary', concept: 'g-negation' },
  { id: 's-68', words: ['آپ', 'کہاں', 'جا', 'رہے', 'ہیں'], roman: 'aap kahaañ ja rahe hain', meaning: 'Where are you going?', level: 'elementary', concept: 'g-questions' },
  { id: 's-69', words: ['یہ', 'کس', 'کا', 'ہے'], roman: 'ye kis ka hai', meaning: 'Whose is this?', level: 'elementary', concept: 'g-questions' },
  { id: 's-70', words: ['آپ', 'کب', 'آئیں', 'گے'], roman: 'aap kab aayeñ ge', meaning: 'When will you come?', level: 'elementary', concept: 'g-questions' },
  { id: 's-71', words: ['کیا', 'آپ', 'اردو', 'بولتے', 'ہیں'], roman: 'kya aap urdu bolte hain', meaning: 'Do you speak Urdu?', level: 'elementary', concept: 'g-questions' },
  { id: 's-72', words: ['میں', 'تھکا', 'ہوں', 'لیکن', 'خوش', 'ہوں'], roman: 'main thaka hoon lekin khush hoon', meaning: 'I am tired but happy', level: 'elementary', concept: 'g-conjunctions' },
  { id: 's-73', words: ['روٹی', 'اور', 'سالن', 'لاؤ'], roman: 'roti aur saalan laao', meaning: 'Bring bread and curry', level: 'elementary', concept: 'g-conjunctions' },
  { id: 's-74', words: ['میں', 'نہیں', 'آیا', 'کیونکہ', 'میں', 'بیمار', 'تھا'], roman: 'main nahiñ aaya kyoñke main bimaar tha', meaning: 'I did not come because I was ill', level: 'elementary', concept: 'g-conjunctions' },
  { id: 's-75', words: ['استاد', 'کا', 'کمرہ', 'بڑا', 'ہے'], roman: 'ustaad ka kamra baṛa hai', meaning: "The teacher's room is big", level: 'elementary', concept: 'g-possess' },
  { id: 's-76', words: ['علی', 'کی', 'بہن', 'ڈاکٹر', 'ہے'], roman: 'Ali ki behen ḍākṭar hai', meaning: "Ali's sister is a doctor", level: 'elementary', concept: 'g-possess' },
  { id: 's-77', words: ['میرے', 'تین', 'دوست', 'ہیں'], roman: 'mere teen dost hain', meaning: 'I have three friends', level: 'elementary', concept: 'g-possess' },
  { id: 's-78', words: ['بچے', 'باغ', 'میں', 'ہیں'], roman: 'bachche baagh meñ hain', meaning: 'The children are in the garden', level: 'elementary', concept: 'g-postpositions' },
  { id: 's-79', words: ['گاڑی', 'گھر', 'کے', 'سامنے', 'ہے'], roman: 'gaaṛi ghar ke saamne hai', meaning: 'The car is in front of the house', level: 'elementary', concept: 'g-postpositions' },
  { id: 's-80', words: ['پانی', 'گلاس', 'میں', 'ہے'], roman: 'paani glaas meñ hai', meaning: 'The water is in the glass', level: 'elementary', concept: 'g-postpositions' },
  { id: 's-81', words: ['لڑکوں', 'سے', 'پوچھو'], roman: 'laṛkoñ se poochho', meaning: 'Ask the boys', level: 'elementary', concept: 'g-oblique' },
  { id: 's-82', words: ['یہ', 'راستہ', 'اسٹیشن', 'تک', 'جاتا', 'ہے'], roman: 'ye raasta station tak jaata hai', meaning: 'This road goes to the station', level: 'elementary', concept: 'g-postpositions' },
  { id: 's-83', words: ['آج', 'موسم', 'اچھا', 'ہے'], roman: 'aaj mausam achha hai', meaning: 'The weather is nice today', level: 'elementary' },
  { id: 's-84', words: ['مجھے', 'ایک', 'کمرہ', 'چاہیے'], roman: 'mujhe ek kamra chaahiye', meaning: 'I need a room', level: 'elementary' },
  { id: 's-85', words: ['دفتر', 'شہر', 'میں', 'ہے'], roman: 'daftar shehar meñ hai', meaning: 'The office is in the city', level: 'elementary', concept: 'g-postpositions' },
  { id: 's-86', words: ['چائے', 'یا', 'کافی'], roman: 'chai ya coffee', meaning: 'Tea or coffee?', level: 'elementary', concept: 'g-conjunctions' },

  // ---- intermediate: tenses, daily life ----
  { id: 's-16', words: ['میں', 'روز', 'کام', 'کرتا', 'ہوں'], roman: 'main roz kaam karta hoon', meaning: 'I work every day', level: 'intermediate', concept: 'g-present' },
  { id: 's-17', words: ['وہ', 'چائے', 'پیتی', 'ہے'], roman: 'wo chai peeti hai', meaning: 'She drinks tea', level: 'intermediate', concept: 'g-present' },
  { id: 's-18', words: ['بارش', 'ہو', 'رہی', 'ہے'], roman: 'baarish ho rahi hai', meaning: 'It is raining', level: 'intermediate', concept: 'g-continuous' },
  { id: 's-19', words: ['میں', 'کل', 'بازار', 'جاؤں', 'گا'], roman: 'main kal bazaar jaaoon ga', meaning: 'I will go to the market tomorrow', level: 'intermediate', concept: 'g-future' },
  { id: 's-20', words: ['وہ', 'گھر', 'میں', 'نہیں', 'تھا'], roman: 'wo ghar meñ nahiñ tha', meaning: 'He was not at home', level: 'intermediate', concept: 'g-past' },
  { id: 's-21', words: ['ڈاکٹر', 'نے', 'دوا', 'دی'], roman: 'ḍākṭar ne dawa di', meaning: 'The doctor gave medicine', level: 'intermediate', concept: 'g-perfect' },
  { id: 's-22', words: ['ہمیں', 'ٹکٹ', 'خریدنا', 'ہے'], roman: 'hameñ ṭikaṭ khareedna hai', meaning: 'We have to buy a ticket', level: 'intermediate', concept: 'g-obligation' },
  { id: 's-87', words: ['میں', 'ہر', 'روز', 'اردو', 'پڑھتا', 'ہوں'], roman: 'main har roz urdu paṛhta hoon', meaning: 'I study Urdu every day', level: 'intermediate', concept: 'g-present' },
  { id: 's-88', words: ['بچے', 'اسکول', 'جاتے', 'ہیں'], roman: 'bachche iskool jaate hain', meaning: 'The children go to school', level: 'intermediate', concept: 'g-present' },
  { id: 's-89', words: ['وہ', 'صبح', 'جلدی', 'اٹھتی', 'ہے'], roman: 'wo subah jaldi uṭhti hai', meaning: 'She gets up early in the morning', level: 'intermediate', concept: 'g-present' },
  { id: 's-90', words: ['ہم', 'اردو', 'بولتے', 'ہیں'], roman: 'ham urdu bolte hain', meaning: 'We speak Urdu', level: 'intermediate', concept: 'g-present' },
  { id: 's-91', words: ['میں', 'کھانا', 'کھا', 'رہا', 'ہوں'], roman: 'main khaana kha raha hoon', meaning: 'I am eating food', level: 'intermediate', concept: 'g-continuous' },
  { id: 's-92', words: ['وہ', 'خط', 'لکھ', 'رہی', 'ہے'], roman: 'wo khat likh rahi hai', meaning: 'She is writing a letter', level: 'intermediate', concept: 'g-continuous' },
  { id: 's-93', words: ['بچے', 'باہر', 'کھیل', 'رہے', 'ہیں'], roman: 'bachche baahar khel rahe hain', meaning: 'The children are playing outside', level: 'intermediate', concept: 'g-continuous' },
  { id: 's-94', words: ['کتاب', 'میز', 'پر', 'تھی'], roman: 'kitaab mez par thi', meaning: 'The book was on the table', level: 'intermediate', concept: 'g-past' },
  { id: 's-95', words: ['ہم', 'کل', 'لاہور', 'میں', 'تھے'], roman: 'ham kal Lahore meñ the', meaning: 'We were in Lahore yesterday', level: 'intermediate', concept: 'g-past' },
  { id: 's-96', words: ['میں', 'پہلے', 'یہاں', 'رہتا', 'تھا'], roman: 'main pehle yahaañ rehta tha', meaning: 'I used to live here', level: 'intermediate', concept: 'g-past' },
  { id: 's-97', words: ['وہ', 'خط', 'لکھے', 'گی'], roman: 'wo khat likhe gi', meaning: 'She will write a letter', level: 'intermediate', concept: 'g-future' },
  { id: 's-98', words: ['ہم', 'اگلے', 'ہفتے', 'ملیں', 'گے'], roman: 'ham agle hafte mileñ ge', meaning: 'We will meet next week', level: 'intermediate', concept: 'g-future' },
  { id: 's-99', words: ['میں', 'آپ', 'کو', 'فون', 'کروں', 'گا'], roman: 'main aap ko fon karoon ga', meaning: 'I will call you', level: 'intermediate', concept: 'g-future' },
  { id: 's-100', words: ['مجھے', 'چائے', 'پسند', 'ہے'], roman: 'mujhe chai pasand hai', meaning: 'I like tea', level: 'intermediate', concept: 'g-dative' },
  { id: 's-101', words: ['اُسے', 'اردو', 'آتی', 'ہے'], roman: 'use urdu aati hai', meaning: 'She knows Urdu', level: 'intermediate', concept: 'g-dative' },
  { id: 's-102', words: ['ہمیں', 'بھوک', 'لگی', 'ہے'], roman: 'hameñ bhook lagi hai', meaning: 'We are hungry', level: 'intermediate', concept: 'g-dative' },
  { id: 's-103', words: ['مجھے', 'سردی', 'لگ', 'رہی', 'ہے'], roman: 'mujhe sardi lag rahi hai', meaning: 'I am feeling cold', level: 'intermediate', concept: 'g-dative' },
  { id: 's-104', words: ['کیا', 'آپ', 'اردو', 'بول', 'سکتے', 'ہیں'], roman: 'kya aap urdu bol sakte hain', meaning: 'Can you speak Urdu?', level: 'intermediate', concept: 'g-ability' },
  { id: 's-105', words: ['میں', 'آج', 'نہیں', 'آ', 'سکتا'], roman: 'main aaj nahiñ aa sakta', meaning: 'I cannot come today', level: 'intermediate', concept: 'g-ability' },
  { id: 's-106', words: ['وہ', 'اچھا', 'گا', 'سکتی', 'ہے'], roman: 'wo achha ga sakti hai', meaning: 'She can sing well', level: 'intermediate', concept: 'g-ability' },
  { id: 's-107', words: ['مجھے', 'بازار', 'جانا', 'ہے'], roman: 'mujhe bazaar jaana hai', meaning: 'I have to go to the market', level: 'intermediate', concept: 'g-obligation' },
  { id: 's-108', words: ['آپ', 'کو', 'آرام', 'کرنا', 'چاہیے'], roman: 'aap ko aaraam karna chaahiye', meaning: 'You should rest', level: 'intermediate', concept: 'g-obligation' },
  { id: 's-109', words: ['مجھے', 'جلدی', 'اٹھنا', 'پڑا'], roman: 'mujhe jaldi uṭhna paṛa', meaning: 'I had to get up early', level: 'intermediate', concept: 'g-obligation' },
  { id: 's-110', words: ['چائے', 'کافی', 'سے', 'سستی', 'ہے'], roman: 'chai coffee se sasti hai', meaning: 'Tea is cheaper than coffee', level: 'intermediate', concept: 'g-comparative' },
  { id: 's-111', words: ['یہ', 'کتاب', 'سب', 'سے', 'اچھی', 'ہے'], roman: 'ye kitaab sab se achhi hai', meaning: 'This book is the best', level: 'intermediate', concept: 'g-comparative' },
  { id: 's-112', words: ['وہ', 'مجھ', 'سے', 'لمبا', 'ہے'], roman: 'wo mujh se lamba hai', meaning: 'He is taller than me', level: 'intermediate', concept: 'g-comparative' },
  { id: 's-113', words: ['ٹرین', 'بس', 'سے', 'تیز', 'ہے'], roman: 'ṭrain bas se tez hai', meaning: 'The train is faster than the bus', level: 'intermediate', concept: 'g-comparative' },
  { id: 's-114', words: ['میں', 'ڈاکٹر', 'سے', 'ملنے', 'گیا'], roman: 'main ḍākṭar se milne gaya', meaning: 'I went to meet the doctor', level: 'intermediate' },

  // ---- advanced: opinion, nuance ----
  { id: 's-23', words: ['مجھے', 'یہ', 'کتاب', 'بہت', 'پسند', 'آئی'], roman: 'mujhe ye kitaab bahut pasand aayi', meaning: 'I liked this book very much', level: 'advanced' },
  { id: 's-24', words: ['اگر', 'وقت', 'ہو', 'تو', 'ملیں'], roman: 'agar waqt ho to mileñ', meaning: 'If there is time, let us meet', level: 'advanced', concept: 'g-subjunctive' },
  { id: 's-25', words: ['وہ', 'محنتی', 'ہے', 'لیکن', 'خاموش', 'ہے'], roman: 'wo mehnati hai lekin khaamosh hai', meaning: 'He is hard-working but quiet', level: 'advanced' },
  { id: 's-26', words: ['مجھے', 'امید', 'ہے', 'کہ', 'آپ', 'آئیں', 'گے'], roman: 'mujhe umeed hai ke aap aayeñ ge', meaning: 'I hope that you will come', level: 'advanced' },
  { id: 's-27', words: ['اُس', 'نے', 'خط', 'لکھا', 'تھا'], roman: 'us ne khat likha tha', meaning: 'He had written the letter', level: 'advanced', concept: 'g-perfect' },
  { id: 's-28', words: ['ذرا', 'آہستہ', 'بولیے'], roman: 'zara aahista boliye', meaning: 'Please speak slowly', level: 'advanced', concept: 'g-imperative' },
  { id: 's-115', words: ['اندر', 'تشریف', 'لائیے'], roman: 'andar tashreef laaiye', meaning: 'Please come in', level: 'advanced', concept: 'g-imperative' },
  { id: 's-116', words: ['یہاں', 'مت', 'بیٹھو'], roman: 'yahaañ mat baiṭho', meaning: "Don't sit here", level: 'advanced', concept: 'g-imperative' },
  { id: 's-117', words: ['دروازہ', 'بند', 'کر', 'دیجیے'], roman: 'darwaaza band kar deejiye', meaning: 'Please close the door', level: 'advanced', concept: 'g-imperative' },
  { id: 's-118', words: ['مجھے', 'معاف', 'کیجیے'], roman: 'mujhe maaf keejiye', meaning: 'Please forgive me', level: 'advanced', concept: 'g-imperative' },
  { id: 's-119', words: ['شاید', 'وہ', 'کل', 'آئے'], roman: 'shaayad wo kal aaye', meaning: 'Perhaps he will come tomorrow', level: 'advanced', concept: 'g-subjunctive' },
  { id: 's-120', words: ['میں', 'کیا', 'کروں'], roman: 'main kya karoon', meaning: 'What should I do?', level: 'advanced', concept: 'g-subjunctive' },
  { id: 's-121', words: ['اگر', 'بارش', 'ہو', 'تو', 'ہم', 'نہ', 'جائیں'], roman: 'agar baarish ho to ham na jaayeñ', meaning: "If it rains, let's not go", level: 'advanced', concept: 'g-subjunctive' },
  { id: 's-122', words: ['میں', 'نے', 'کھانا', 'کھایا'], roman: 'main ne khaana khaaya', meaning: 'I ate the food', level: 'advanced', concept: 'g-perfect' },
  { id: 's-123', words: ['اُس', 'نے', 'کتاب', 'پڑھی'], roman: 'us ne kitaab paṛhi', meaning: 'He read the book', level: 'advanced', concept: 'g-perfect' },
  { id: 's-124', words: ['وہ', 'گھر', 'گیا', 'ہے'], roman: 'wo ghar gaya hai', meaning: 'He has gone home', level: 'advanced', concept: 'g-perfect' },
  { id: 's-125', words: ['ہم', 'نے', 'فلم', 'دیکھی', 'تھی'], roman: 'ham ne film dekhi thi', meaning: 'We had watched the film', level: 'advanced', concept: 'g-perfect' },
  { id: 's-126', words: ['جو', 'کتاب', 'میز', 'پر', 'ہے', 'وہ', 'میری', 'ہے'], roman: 'jo kitaab mez par hai wo meri hai', meaning: 'The book that is on the table is mine', level: 'advanced', concept: 'g-relative' },
  { id: 's-127', words: ['جب', 'بارش', 'ہوتی', 'ہے', 'تب', 'ٹھنڈ', 'ہوتی', 'ہے'], roman: 'jab baarish hoti hai tab ṭhanḍ hoti hai', meaning: 'When it rains, it gets cold', level: 'advanced', concept: 'g-relative' },
  { id: 's-128', words: ['جہاں', 'چاہ', 'وہاں', 'راہ'], roman: 'jahaañ chaah wahaañ raah', meaning: 'Where there is a will, there is a way', level: 'advanced', concept: 'g-relative' },
  { id: 's-129', words: ['جس', 'نے', 'محنت', 'کی', 'اُس', 'نے', 'پایا'], roman: 'jis ne mehnat ki us ne paaya', meaning: 'The one who worked hard, found', level: 'advanced', concept: 'g-relative' },
  { id: 's-130', words: ['میں', 'نے', 'کھانا', 'کھا', 'لیا'], roman: 'main ne khaana kha liya', meaning: 'I ate up the food', level: 'advanced', concept: 'g-compound' },
  { id: 's-131', words: ['بچہ', 'سو', 'گیا'], roman: 'bachcha so gaya', meaning: 'The child fell asleep', level: 'advanced', concept: 'g-compound' },
  { id: 's-132', words: ['مجھے', 'کتاب', 'دے', 'دو'], roman: 'mujhe kitaab de do', meaning: 'Give me the book', level: 'advanced', concept: 'g-compound' },
  { id: 's-133', words: ['دروازہ', 'کھولا', 'گیا'], roman: 'darwaaza khola gaya', meaning: 'The door was opened', level: 'advanced', concept: 'g-passive' },
  { id: 's-134', words: ['یہ', 'کتاب', 'اردو', 'میں', 'لکھی', 'گئی'], roman: 'ye kitaab urdu meñ likhi gayi', meaning: 'This book was written in Urdu', level: 'advanced', concept: 'g-passive' },
  { id: 's-135', words: ['کھانا', 'تیار', 'کیا', 'جا', 'رہا', 'ہے'], roman: 'khaana tayyaar kiya ja raha hai', meaning: 'The food is being prepared', level: 'advanced', concept: 'g-passive' },
  { id: 's-136', words: ['وہ', 'بچوں', 'کو', 'اردو', 'پڑھاتی', 'ہے'], roman: 'wo bachchoñ ko urdu paṛhaati hai', meaning: 'She teaches Urdu to the children', level: 'advanced', concept: 'g-causative' },
  { id: 's-137', words: ['ماں', 'نے', 'بچے', 'کو', 'کھانا', 'کھلایا'], roman: 'maañ ne bachche ko khaana khilaaya', meaning: 'The mother fed the child', level: 'advanced', concept: 'g-causative' },
  { id: 's-138', words: ['میں', 'نے', 'کپڑے', 'سلوائے'], roman: 'main ne kapṛe silwaaye', meaning: 'I had the clothes stitched', level: 'advanced', concept: 'g-causative' },
  { id: 's-139', words: ['مجھے', 'امید', 'ہے', 'کہ', 'سب', 'ٹھیک', 'ہوگا'], roman: 'mujhe umeed hai ke sab ṭheek hoga', meaning: 'I hope everything will be fine', level: 'advanced' },
  { id: 's-140', words: ['وقت', 'سب', 'سے', 'قیمتی', 'چیز', 'ہے'], roman: 'waqt sab se qeemti cheez hai', meaning: 'Time is the most precious thing', level: 'advanced' },

  // ---- a second pass: daily life, family, time, and place ----
  { id: 's-141', words: ['میری', 'بہن', 'استاد', 'ہے'], roman: 'meri behan ustaad hai', meaning: 'My sister is a teacher', level: 'beginner', concept: 'g-to-be' },
  { id: 's-142', words: ['یہ', 'میرا', 'کمرہ', 'ہے'], roman: 'ye mera kamra hai', meaning: 'This is my room', level: 'beginner', concept: 'g-to-be' },
  { id: 's-143', words: ['اس', 'کی', 'کتاب', 'نئی', 'ہے'], roman: 'us ki kitaab nayi hai', meaning: 'Her book is new', level: 'beginner', concept: 'g-possess' },
  { id: 's-150', words: ['آج', 'جمعہ', 'ہے'], roman: 'aaj juma hai', meaning: 'Today is Friday', level: 'beginner' },
  { id: 's-156', words: ['میرا', 'بھائی', 'ڈاکٹر', 'ہے'], roman: 'mera bhai ḍākṭar hai', meaning: 'My brother is a doctor', level: 'beginner', concept: 'g-to-be' },
  { id: 's-144', words: ['میں', 'ہر', 'روز', 'پانی', 'پیتا', 'ہوں'], roman: 'main har roz paani peeta hoon', meaning: 'I drink water every day', level: 'elementary', concept: 'g-present' },
  { id: 's-145', words: ['وہ', 'اسکول', 'جاتی', 'ہے'], roman: 'wo iskool jaati hai', meaning: 'She goes to school', level: 'elementary', concept: 'g-present' },
  { id: 's-146', words: ['بچے', 'باغ', 'میں', 'کھیل', 'رہے', 'ہیں'], roman: 'bachche baagh meñ khel rahe haiñ', meaning: 'The children are playing in the garden', level: 'elementary' },
  { id: 's-147', words: ['کتاب', 'میز', 'کے', 'اوپر', 'ہے'], roman: 'kitaab mez ke oopar hai', meaning: 'The book is on the table', level: 'elementary', concept: 'g-postpositions' },
  { id: 's-148', words: ['دکان', 'گھر', 'کے', 'پاس', 'ہے'], roman: 'dukaan ghar ke paas hai', meaning: 'The shop is near the house', level: 'elementary', concept: 'g-postpositions' },
  { id: 's-151', words: ['کل', 'میرا', 'امتحان', 'ہے'], roman: 'kal mera imtihaan hai', meaning: 'Tomorrow is my exam', level: 'elementary' },
  { id: 's-152', words: ['وہ', 'روز', 'ورزش', 'کرتا', 'ہے'], roman: 'wo roz warzish karta hai', meaning: 'He exercises every day', level: 'elementary', concept: 'g-present' },
  { id: 's-155', words: ['یہ', 'راستہ', 'کہاں', 'جاتا', 'ہے'], roman: 'ye raasta kahaañ jaata hai', meaning: 'Where does this road go?', level: 'elementary', concept: 'g-questions' },
  { id: 's-149', words: ['میری', 'سالگرہ', 'اپریل', 'میں', 'ہے'], roman: 'meri saalgirah aprail meñ hai', meaning: 'My birthday is in April', level: 'intermediate' },
  { id: 's-153', words: ['مجھے', 'موسیقی', 'پسند', 'ہے'], roman: 'mujhe mausiqi pasand hai', meaning: 'I like music', level: 'intermediate', concept: 'g-dative' },
  { id: 's-154', words: ['ہمیں', 'اردو', 'سیکھنی', 'ہے'], roman: 'hameñ urdu seekhni hai', meaning: 'We need to learn Urdu', level: 'intermediate', concept: 'g-obligation' },
];

/** A short reading passage with comprehension. */
export type Passage = {
  id: string;
  title: string;
  level: Level;
  /** lines of the passage, in order */
  lines: { urdu: string; roman: string; meaning: string }[];
  question: { ask: string; answer: string; options: string[] };
};

export const PASSAGES: Passage[] = [
  {
    id: 'r-1',
    title: 'My house',
    level: 'elementary',
    lines: [
      { urdu: 'یہ میرا گھر ہے۔', roman: 'ye mera ghar hai.', meaning: 'This is my house.' },
      { urdu: 'گھر میں ایک باغ ہے۔', roman: 'ghar meñ ek baagh hai.', meaning: 'There is a garden in the house.' },
      { urdu: 'باغ میں پھول ہیں۔', roman: 'baagh meñ phool hain.', meaning: 'There are flowers in the garden.' },
      { urdu: 'مجھے میرا گھر پسند ہے۔', roman: 'mujhe mera ghar pasand hai.', meaning: 'I like my house.' },
    ],
    question: {
      ask: 'What is in the garden?',
      answer: 'Flowers',
      options: ['Flowers', 'A car', 'Books', 'Water'],
    },
  },
  {
    id: 'r-2',
    title: 'A day at the market',
    level: 'intermediate',
    lines: [
      { urdu: 'صبح میں بازار گیا۔', roman: 'subah main bazaar gaya.', meaning: 'In the morning I went to the market.' },
      { urdu: 'وہاں بہت ہجوم تھا۔', roman: 'wahaañ bahut hujoom tha.', meaning: 'There was a big crowd there.' },
      { urdu: 'میں نے پھل اور سبزی خریدی۔', roman: 'main ne phal aur sabzi khareedi.', meaning: 'I bought fruit and vegetables.' },
      { urdu: 'آم بہت مہنگے تھے۔', roman: 'aam bahut mehnge the.', meaning: 'The mangoes were very expensive.' },
      { urdu: 'پھر میں گھر واپس آیا۔', roman: 'phir main ghar waapas aaya.', meaning: 'Then I came back home.' },
    ],
    question: {
      ask: 'What was expensive?',
      answer: 'The mangoes',
      options: ['The mangoes', 'The vegetables', 'The tickets', 'The tea'],
    },
  },
  {
    id: 'r-3',
    title: 'My daily routine',
    level: 'intermediate',
    lines: [
      { urdu: 'میں روز صبح جلدی اٹھتا ہوں۔', roman: 'main roz subah jaldi uṭhta hoon.', meaning: 'I get up early every morning.' },
      { urdu: 'پہلے چائے پیتا ہوں۔', roman: 'pehle chai peeta hoon.', meaning: 'First I drink tea.' },
      { urdu: 'پھر کام پر جاتا ہوں۔', roman: 'phir kaam par jaata hoon.', meaning: 'Then I go to work.' },
      { urdu: 'شام کو گھر آتا ہوں۔', roman: 'shaam ko ghar aata hoon.', meaning: 'In the evening I come home.' },
      { urdu: 'رات کو کتاب پڑھتا ہوں۔', roman: 'raat ko kitaab paṛhta hoon.', meaning: 'At night I read a book.' },
    ],
    question: {
      ask: 'What does he do first in the morning?',
      answer: 'Drinks tea',
      options: ['Drinks tea', 'Goes to work', 'Reads a book', 'Goes to the market'],
    },
  },
  {
    id: 'r-4',
    title: 'A letter to a friend',
    level: 'advanced',
    lines: [
      { urdu: 'پیارے دوست، السلام علیکم۔', roman: 'pyaare dost, assalaam-o-alaikum.', meaning: 'Dear friend, peace be upon you.' },
      { urdu: 'مجھے امید ہے کہ آپ خیریت سے ہوں گے۔', roman: 'mujhe umeed hai ke aap khairiyat se hoñ ge.', meaning: 'I hope you are well.' },
      { urdu: 'یہاں موسم بہت اچھا ہے۔', roman: 'yahaañ mausam bahut achha hai.', meaning: 'The weather here is very good.' },
      { urdu: 'اگر وقت ہو تو ضرور آئیے۔', roman: 'agar waqt ho to zaroor aaiye.', meaning: 'If you have time, do come.' },
      { urdu: 'آپ کا دوست، احمد۔', roman: 'aap ka dost, Ahmed.', meaning: 'Your friend, Ahmed.' },
    ],
    question: {
      ask: 'What does the writer say about the weather?',
      answer: 'It is very good',
      options: ['It is very good', 'It is very cold', 'It is raining', 'It is too hot'],
    },
  },

  // ---- beginner: four or five short lines, all known words ----
  {
    id: 'r-5',
    title: 'My family',
    level: 'beginner',
    lines: [
      { urdu: 'یہ میرا خاندان ہے۔', roman: 'ye mera khaandaan hai.', meaning: 'This is my family.' },
      { urdu: 'میرے والد ڈاکٹر ہیں۔', roman: 'mere waalid ḍākṭar hain.', meaning: 'My father is a doctor.' },
      { urdu: 'میری ماں استاد ہیں۔', roman: 'meri maañ ustaad hain.', meaning: 'My mother is a teacher.' },
      { urdu: 'میرا ایک بھائی ہے۔', roman: 'mera ek bhai hai.', meaning: 'I have one brother.' },
      { urdu: 'ہم سب خوش ہیں۔', roman: 'ham sab khush hain.', meaning: 'We are all happy.' },
    ],
    question: {
      ask: 'What does the father do?',
      answer: 'He is a doctor',
      options: ['He is a doctor', 'He is a teacher', 'He is a student', 'He is a shopkeeper'],
    },
  },
  {
    id: 'r-6',
    title: 'Tea time',
    level: 'beginner',
    lines: [
      { urdu: 'مجھے چائے پسند ہے۔', roman: 'mujhe chai pasand hai.', meaning: 'I like tea.' },
      { urdu: 'میں روز چائے پیتا ہوں۔', roman: 'main roz chai peeta hoon.', meaning: 'I drink tea every day.' },
      { urdu: 'چائے گرم اور میٹھی ہے۔', roman: 'chai garam aur meeṭhi hai.', meaning: 'The tea is hot and sweet.' },
      { urdu: 'ماں روٹی لاتی ہیں۔', roman: 'maañ roti laati hain.', meaning: 'Mother brings bread.' },
      { urdu: 'یہ دن کا اچھا وقت ہے۔', roman: 'ye din ka achha waqt hai.', meaning: 'This is the best time of the day.' },
    ],
    question: {
      ask: 'How is the tea?',
      answer: 'Hot and sweet',
      options: ['Hot and sweet', 'Cold and bitter', 'Very strong', 'Without sugar'],
    },
  },
  {
    id: 'r-7',
    title: 'Colours around me',
    level: 'beginner',
    lines: [
      { urdu: 'آسمان نیلا ہے۔', roman: 'aasmaan neela hai.', meaning: 'The sky is blue.' },
      { urdu: 'پھول لال ہے۔', roman: 'phool laal hai.', meaning: 'The flower is red.' },
      { urdu: 'درخت ہرا ہے۔', roman: 'darakht hara hai.', meaning: 'The tree is green.' },
      { urdu: 'دودھ سفید ہے۔', roman: 'doodh safed hai.', meaning: 'Milk is white.' },
      { urdu: 'رات کالی ہے۔', roman: 'raat kaali hai.', meaning: 'The night is black.' },
    ],
    question: {
      ask: 'What colour is the tree?',
      answer: 'Green',
      options: ['Green', 'Blue', 'Red', 'White'],
    },
  },

  // ---- elementary ----
  {
    id: 'r-8',
    title: 'At school',
    level: 'elementary',
    lines: [
      { urdu: 'میں روز اسکول جاتا ہوں۔', roman: 'main roz iskool jaata hoon.', meaning: 'I go to school every day.' },
      { urdu: 'اسکول گھر سے قریب ہے۔', roman: 'iskool ghar se qareeb hai.', meaning: 'The school is near the house.' },
      { urdu: 'میرے استاد بہت اچھے ہیں۔', roman: 'mere ustaad bahut achhe hain.', meaning: 'My teachers are very good.' },
      { urdu: 'ہم اردو اور حساب پڑھتے ہیں۔', roman: 'ham urdu aur hisaab paṛhte hain.', meaning: 'We study Urdu and arithmetic.' },
      { urdu: 'چھٹی کے بعد میں گھر آتا ہوں۔', roman: 'chhuṭṭi ke baad main ghar aata hoon.', meaning: 'After school I come home.' },
    ],
    question: {
      ask: 'What do they study?',
      answer: 'Urdu and arithmetic',
      options: ['Urdu and arithmetic', 'Urdu and science', 'Only Urdu', 'History'],
    },
  },
  {
    id: 'r-9',
    title: 'The garden behind the house',
    level: 'elementary',
    lines: [
      { urdu: 'ہمارے گھر کے پیچھے ایک باغ ہے۔', roman: 'hamaare ghar ke peechhe ek baagh hai.', meaning: 'Behind our house there is a garden.' },
      { urdu: 'باغ میں بہت درخت ہیں۔', roman: 'baagh meñ bahut darakht hain.', meaning: 'There are many trees in the garden.' },
      { urdu: 'صبح کو پرندے گاتے ہیں۔', roman: 'subah ko parinde gaate hain.', meaning: 'In the morning the birds sing.' },
      { urdu: 'میں وہاں بیٹھ کر کتاب پڑھتا ہوں۔', roman: 'main wahaañ baiṭh kar kitaab paṛhta hoon.', meaning: 'I sit there and read a book.' },
      { urdu: 'یہ جگہ بہت پرسکون ہے۔', roman: 'ye jagah bahut pursukoon hai.', meaning: 'This place is very peaceful.' },
    ],
    question: {
      ask: 'What do the birds do in the morning?',
      answer: 'They sing',
      options: ['They sing', 'They sleep', 'They fly away', 'They eat fruit'],
    },
  },
  {
    id: 'r-10',
    title: 'My friend Sara',
    level: 'elementary',
    lines: [
      { urdu: 'میری دوست کا نام سارہ ہے۔', roman: 'meri dost ka naam Sara hai.', meaning: "My friend's name is Sara." },
      { urdu: 'وہ میرے ساتھ اسکول میں پڑھتی ہے۔', roman: 'wo mere saath iskool meñ paṛhti hai.', meaning: 'She studies with me at school.' },
      { urdu: 'سارہ کو کتابیں بہت پسند ہیں۔', roman: 'Sara ko kitaabeñ bahut pasand hain.', meaning: 'Sara likes books very much.' },
      { urdu: 'ہم اکثر باغ میں ملتے ہیں۔', roman: 'ham aksar baagh meñ milte hain.', meaning: 'We often meet in the garden.' },
      { urdu: 'وہ بہت مہربان ہے۔', roman: 'wo bahut meherbaan hai.', meaning: 'She is very kind.' },
    ],
    question: {
      ask: 'Where do they often meet?',
      answer: 'In the garden',
      options: ['In the garden', 'At the market', 'At her house', 'In the library'],
    },
  },

  // ---- intermediate ----
  {
    id: 'r-11',
    title: 'A trip to Lahore',
    level: 'intermediate',
    lines: [
      { urdu: 'پچھلے مہینے میں لاہور گیا۔', roman: 'pichhle maheene main Lahore gaya.', meaning: 'Last month I went to Lahore.' },
      { urdu: 'میں ٹرین سے گیا کیونکہ وہ سستی تھی۔', roman: 'main ṭrain se gaya kyoñke wo sasti thi.', meaning: 'I went by train because it was cheap.' },
      { urdu: 'وہاں میں نے پرانی مسجد دیکھی۔', roman: 'wahaañ main ne puraani masjid dekhi.', meaning: 'There I saw the old mosque.' },
      { urdu: 'شام کو ہم نے بازار میں کھانا کھایا۔', roman: 'shaam ko ham ne bazaar meñ khaana khaaya.', meaning: 'In the evening we ate in the market.' },
      { urdu: 'سفر بہت اچھا رہا۔', roman: 'safar bahut achha raha.', meaning: 'The journey was very good.' },
    ],
    question: {
      ask: 'Why did he travel by train?',
      answer: 'Because it was cheap',
      options: ['Because it was cheap', 'Because it was fast', 'Because there was no bus', 'Because a friend asked'],
    },
  },
  {
    id: 'r-12',
    title: 'The rainy day',
    level: 'intermediate',
    lines: [
      { urdu: 'کل صبح سے بارش ہو رہی تھی۔', roman: 'kal subah se baarish ho rahi thi.', meaning: 'It had been raining since yesterday morning.' },
      { urdu: 'سڑکیں پانی سے بھر گئیں۔', roman: 'saṛkeñ paani se bhar gayeeñ.', meaning: 'The roads filled up with water.' },
      { urdu: 'بچے اسکول نہیں جا سکے۔', roman: 'bachche iskool nahiñ ja sake.', meaning: 'The children could not go to school.' },
      { urdu: 'ہم نے گھر میں چائے پی۔', roman: 'ham ne ghar meñ chai pi.', meaning: 'We drank tea at home.' },
      { urdu: 'شام کو موسم صاف ہو گیا۔', roman: 'shaam ko mausam saaf ho gaya.', meaning: 'In the evening the weather cleared up.' },
    ],
    question: {
      ask: 'Why could the children not go to school?',
      answer: 'The roads were full of water',
      options: ['The roads were full of water', 'The school was closed', 'They were ill', 'It was a holiday'],
    },
  },
  {
    id: 'r-13',
    title: 'At the doctor',
    level: 'intermediate',
    lines: [
      { urdu: 'مجھے کل سے بخار تھا۔', roman: 'mujhe kal se bukhaar tha.', meaning: 'I had had a fever since yesterday.' },
      { urdu: 'میں صبح ڈاکٹر کے پاس گیا۔', roman: 'main subah ḍākṭar ke paas gaya.', meaning: 'In the morning I went to the doctor.' },
      { urdu: 'ڈاکٹر نے کہا کہ آرام کرو۔', roman: 'ḍākṭar ne kaha ke aaraam karo.', meaning: 'The doctor said to rest.' },
      { urdu: 'اُنہوں نے دوا بھی دی۔', roman: 'unhoñ ne dawa bhi di.', meaning: 'They also gave medicine.' },
      { urdu: 'اب مجھے بہتر لگ رہا ہے۔', roman: 'ab mujhe behtar lag raha hai.', meaning: 'Now I am feeling better.' },
    ],
    question: {
      ask: 'What did the doctor advise?',
      answer: 'To rest',
      options: ['To rest', 'To come back tomorrow', 'To go to hospital', 'To eat more'],
    },
  },
  {
    id: 'r-14',
    title: 'Eid at home',
    level: 'intermediate',
    lines: [
      { urdu: 'عید کے دن گھر میں رونق تھی۔', roman: 'Eid ke din ghar meñ raunaq thi.', meaning: 'On Eid day the house was full of life.' },
      { urdu: 'ماں نے میٹھی سویاں بنائیں۔', roman: 'maañ ne meeṭhi sewiyaañ banaayeeñ.', meaning: 'Mother made sweet vermicelli.' },
      { urdu: 'سب نے نئے کپڑے پہنے۔', roman: 'sab ne naye kapṛe pehne.', meaning: 'Everyone wore new clothes.' },
      { urdu: 'بچوں کو عیدی ملی۔', roman: 'bachchoñ ko Eidi mili.', meaning: 'The children received Eidi (gift money).' },
      { urdu: 'شام کو مہمان آئے۔', roman: 'shaam ko mehmaan aaye.', meaning: 'In the evening guests came.' },
    ],
    question: {
      ask: 'What did the children receive?',
      answer: 'Eidi: gift money',
      options: ['Eidi: gift money', 'New books', 'Sweets only', 'Nothing'],
    },
  },

  // ---- advanced ----
  {
    id: 'r-15',
    title: 'The old bookseller',
    level: 'advanced',
    lines: [
      { urdu: 'شہر کے پرانے بازار میں ایک چھوٹی سی دکان ہے۔', roman: 'shehar ke puraane bazaar meñ ek chhoṭi si dukaan hai.', meaning: "In the city's old market there is a small shop." },
      { urdu: 'وہاں ایک بوڑھا آدمی کتابیں بیچتا ہے۔', roman: 'wahaañ ek booṛha aadmi kitaabeñ bechta hai.', meaning: 'There an old man sells books.' },
      { urdu: 'اُس کے پاس ایسی کتابیں ہیں جو اب کہیں نہیں ملتیں۔', roman: 'us ke paas aisi kitaabeñ hain jo ab kaheeñ nahiñ miltiñ.', meaning: 'He has books that are no longer found anywhere.' },
      { urdu: 'جو بھی اُس سے بات کرتا ہے، وہ کوئی کہانی سناتا ہے۔', roman: 'jo bhi us se baat karta hai, wo koi kahaani sunaata hai.', meaning: 'Whoever speaks to him, he tells them a story.' },
      { urdu: 'لوگ کتاب سے زیادہ اُس کی باتیں خریدنے آتے ہیں۔', roman: 'log kitaab se zyaada us ki baateñ khareedne aate hain.', meaning: 'People come to buy his words more than his books.' },
    ],
    question: {
      ask: 'Why do people really visit the shop?',
      answer: 'For his stories more than the books',
      options: ['For his stories more than the books', 'Because the books are cheap', 'To sell their own books', 'Because it is the only shop'],
    },
  },
  {
    id: 'r-16',
    title: 'Work and rest',
    level: 'advanced',
    lines: [
      { urdu: 'آج کل ہر شخص مصروف ہے۔', roman: 'aaj kal har shakhs masroof hai.', meaning: 'These days everyone is busy.' },
      { urdu: 'لوگ صبح سے رات تک کام کرتے ہیں۔', roman: 'log subah se raat tak kaam karte hain.', meaning: 'People work from morning until night.' },
      { urdu: 'لیکن آرام بھی ضروری ہے۔', roman: 'lekin aaraam bhi zaroori hai.', meaning: 'But rest is necessary too.' },
      { urdu: 'جو انسان نہیں رکتا، وہ جلد تھک جاتا ہے۔', roman: 'jo insaan nahiñ rukta, wo jald thak jaata hai.', meaning: 'The person who never stops soon grows tired.' },
      { urdu: 'رک کر سوچنا بھی کام کا حصہ ہے۔', roman: 'ruk kar sochna bhi kaam ka hissa hai.', meaning: 'Stopping to think is also part of the work.' },
    ],
    question: {
      ask: 'What does the passage say about rest?',
      answer: 'It is part of working well',
      options: ['It is part of working well', 'It wastes time', 'Only the ill need it', 'It should wait until night'],
    },
  },
  {
    id: 'r-17',
    title: 'An evening of poetry',
    level: 'advanced',
    lines: [
      { urdu: 'جمعے کی شام ہم دوستوں کے ساتھ بیٹھے تھے۔', roman: "jum'e ki shaam ham dostoñ ke saath baiṭhe the.", meaning: 'On Friday evening we were sitting with friends.' },
      { urdu: 'کسی نے پرانا شعر پڑھا۔', roman: 'kisi ne puraana sher paṛha.', meaning: 'Someone recited an old couplet.' },
      { urdu: 'سب خاموش ہو گئے۔', roman: 'sab khaamosh ho gaye.', meaning: 'Everyone fell silent.' },
      { urdu: 'اُس شعر نے وہ بات کہہ دی جو ہم کہہ نہیں سکے۔', roman: 'us sher ne wo baat keh di jo ham keh nahiñ sake.', meaning: 'That couplet said the thing we had not been able to say.' },
      { urdu: 'شاعری ایسی ہی ہوتی ہے۔', roman: 'shaayari aisi hi hoti hai.', meaning: 'That is how poetry is.' },
    ],
    question: {
      ask: 'What happened after the couplet was recited?',
      answer: 'Everyone fell silent',
      options: ['Everyone fell silent', 'Everyone applauded', 'They went home', 'Someone recited another'],
    },
  },
];

export const sentencesByLevel = (level: Level) => SENTENCES.filter((s) => s.level === level);
export const passagesByLevel = (level: Level) => PASSAGES.filter((p) => p.level === level);
export const getPassage = (id: string) => PASSAGES.find((p) => p.id === id);

/**
 * A short two-speaker exchange.
 *
 * Passages teach you to read; dialogues teach you what people actually say to
 * each other, including the parts a textbook leaves out — how a greeting is
 * answered, where the polite form is used, how someone asks for the price
 * without being rude. The comprehension question is about what was *meant*,
 * not just what was said.
 */
export type Dialogue = {
  id: string;
  title: string;
  /** one line of setting, in English */
  setting: string;
  level: Level;
  /** A and B — labelled so the exercise can align and colour them */
  lines: { speaker: 'A' | 'B'; name: string; urdu: string; roman: string; meaning: string }[];
  question: { ask: string; answer: string; options: string[] };
};

export const DIALOGUES: Dialogue[] = [
  {
    id: 'd-1',
    title: 'Meeting someone',
    setting: 'Two people are introduced at a friend’s house.',
    level: 'beginner',
    lines: [
      { speaker: 'A', name: 'Sara', urdu: 'السلام علیکم۔', roman: 'assalaam-o-alaikum.', meaning: 'Peace be upon you.' },
      { speaker: 'B', name: 'Ali', urdu: 'وعلیکم السلام۔', roman: 'wa-alaikum assalaam.', meaning: 'And peace be upon you.' },
      { speaker: 'A', name: 'Sara', urdu: 'میرا نام سارہ ہے۔ آپ کا نام؟', roman: 'mera naam Sara hai. aap ka naam?', meaning: 'My name is Sara. And your name?' },
      { speaker: 'B', name: 'Ali', urdu: 'میں علی ہوں۔ آپ کیسی ہیں؟', roman: 'main Ali hoon. aap kaisi hain?', meaning: 'I am Ali. How are you?' },
      { speaker: 'A', name: 'Sara', urdu: 'میں ٹھیک ہوں، شکریہ۔', roman: 'main ṭheek hoon, shukriya.', meaning: 'I am well, thank you.' },
    ],
    question: {
      ask: 'How does Ali reply to the greeting?',
      answer: 'With the matching greeting back',
      options: ['With the matching greeting back', 'By asking her name first', 'By saying goodbye', 'He does not reply'],
    },
  },
  {
    id: 'd-2',
    title: 'Tea or coffee?',
    setting: 'A guest has just sat down.',
    level: 'beginner',
    lines: [
      { speaker: 'A', name: 'Host', urdu: 'چائے یا کافی؟', roman: 'chai ya coffee?', meaning: 'Tea or coffee?' },
      { speaker: 'B', name: 'Guest', urdu: 'چائے، شکریہ۔', roman: 'chai, shukriya.', meaning: 'Tea, thank you.' },
      { speaker: 'A', name: 'Host', urdu: 'چینی کتنی؟', roman: 'cheeni kitni?', meaning: 'How much sugar?' },
      { speaker: 'B', name: 'Guest', urdu: 'تھوڑی سی۔', roman: 'thoṛi si.', meaning: 'A little.' },
    ],
    question: {
      ask: 'What does the guest choose?',
      answer: 'Tea, with a little sugar',
      options: ['Tea, with a little sugar', 'Coffee, with a lot of sugar', 'Tea, with no sugar', 'Nothing at all'],
    },
  },
  {
    id: 'd-3',
    title: 'Where do you live?',
    setting: 'Small talk between two students.',
    level: 'elementary',
    lines: [
      { speaker: 'A', name: 'Ahmed', urdu: 'آپ کہاں رہتے ہیں؟', roman: 'aap kahaañ rehte hain?', meaning: 'Where do you live?' },
      { speaker: 'B', name: 'Bilal', urdu: 'میں لاہور میں رہتا ہوں۔', roman: 'main Lahore meñ rehta hoon.', meaning: 'I live in Lahore.' },
      { speaker: 'A', name: 'Ahmed', urdu: 'وہاں آپ کا گھر ہے؟', roman: 'wahaañ aap ka ghar hai?', meaning: 'Is your house there?' },
      { speaker: 'B', name: 'Bilal', urdu: 'جی ہاں، شہر کے قریب۔', roman: 'ji haañ, shehar ke qareeb.', meaning: 'Yes, near the city.' },
      { speaker: 'A', name: 'Ahmed', urdu: 'بہت اچھا۔', roman: 'bahut achha.', meaning: 'Very good.' },
    ],
    question: {
      ask: 'Where is Bilal’s house?',
      answer: 'In Lahore, near the city',
      options: ['In Lahore, near the city', 'In Lahore, far from the city', 'In Karachi', 'He did not say'],
    },
  },
  {
    id: 'd-4',
    title: 'At the fruit stall',
    setting: 'In the bazaar, in front of the mangoes.',
    level: 'elementary',
    lines: [
      { speaker: 'A', name: 'Buyer', urdu: 'آم کیسے دیے؟', roman: 'aam kaise diye?', meaning: 'How much are the mangoes?' },
      { speaker: 'B', name: 'Seller', urdu: 'دو سو روپے کلو۔', roman: 'do sau rupay kilo.', meaning: 'Two hundred rupees a kilo.' },
      { speaker: 'A', name: 'Buyer', urdu: 'بہت مہنگے ہیں۔', roman: 'bahut mehnge hain.', meaning: 'That is very expensive.' },
      { speaker: 'B', name: 'Seller', urdu: 'اچھے ہیں، دیکھیے۔', roman: 'achhe hain, dekhiye.', meaning: 'They are good ones, look.' },
      { speaker: 'A', name: 'Buyer', urdu: 'ایک کلو دے دیجیے۔', roman: 'ek kilo de deejiye.', meaning: 'Give me one kilo then.' },
    ],
    question: {
      ask: 'What does the buyer do in the end?',
      answer: 'Buys a kilo anyway',
      options: ['Buys a kilo anyway', 'Walks away', 'Gets a lower price', 'Buys two kilos'],
    },
  },
  {
    id: 'd-5',
    title: 'Asking the way',
    setting: 'A stranger stops someone on the street.',
    level: 'elementary',
    lines: [
      { speaker: 'A', name: 'Visitor', urdu: 'معاف کیجیے، اسٹیشن کدھر ہے؟', roman: 'maaf keejiye, station kidhar hai?', meaning: 'Excuse me, where is the station?' },
      { speaker: 'B', name: 'Local', urdu: 'سیدھے جائیے، پھر دائیں مڑیے۔', roman: 'seedhe jaaiye, phir daaeñ muṛiye.', meaning: 'Go straight, then turn right.' },
      { speaker: 'A', name: 'Visitor', urdu: 'کتنی دور ہے؟', roman: 'kitni door hai?', meaning: 'How far is it?' },
      { speaker: 'B', name: 'Local', urdu: 'دس منٹ پیدل۔', roman: 'das minaṭ paidal.', meaning: 'Ten minutes on foot.' },
      { speaker: 'A', name: 'Visitor', urdu: 'بہت شکریہ۔', roman: 'bahut shukriya.', meaning: 'Thank you very much.' },
    ],
    question: {
      ask: 'Which way should the visitor turn?',
      answer: 'Right, after going straight',
      options: ['Right, after going straight', 'Left, after going straight', 'Right, immediately', 'Back the way they came'],
    },
  },
  {
    id: 'd-6',
    title: 'On the phone',
    setting: 'A call to a friend’s house.',
    level: 'intermediate',
    lines: [
      { speaker: 'A', name: 'Caller', urdu: 'ہیلو، کیا عمران گھر پر ہیں؟', roman: 'hello, kya Imran ghar par hain?', meaning: 'Hello, is Imran at home?' },
      { speaker: 'B', name: 'Sister', urdu: 'نہیں، وہ ابھی باہر گئے ہیں۔', roman: 'nahiñ, wo abhi baahar gaye hain.', meaning: 'No, he has just gone out.' },
      { speaker: 'A', name: 'Caller', urdu: 'کب واپس آئیں گے؟', roman: 'kab waapas aayeñ ge?', meaning: 'When will he be back?' },
      { speaker: 'B', name: 'Sister', urdu: 'شام کو۔ کوئی پیغام؟', roman: 'shaam ko. koi paighaam?', meaning: 'In the evening. Any message?' },
      { speaker: 'A', name: 'Caller', urdu: 'کہہ دیجیے کہ میں نے فون کیا تھا۔', roman: 'keh deejiye ke main ne fon kiya tha.', meaning: 'Please tell him I called.' },
    ],
    question: {
      ask: 'What does the caller ask for?',
      answer: 'That Imran be told they called',
      options: ['That Imran be told they called', 'Imran’s phone number', 'To call back in the evening', 'To leave a written note'],
    },
  },
  {
    id: 'd-7',
    title: 'At the doctor',
    setting: 'A morning appointment.',
    level: 'intermediate',
    lines: [
      { speaker: 'A', name: 'Doctor', urdu: 'کیا تکلیف ہے؟', roman: 'kya takleef hai?', meaning: 'What is the trouble?' },
      { speaker: 'B', name: 'Patient', urdu: 'مجھے دو دن سے بخار ہے۔', roman: 'mujhe do din se bukhaar hai.', meaning: 'I have had a fever for two days.' },
      { speaker: 'A', name: 'Doctor', urdu: 'کھانسی بھی ہے؟', roman: 'khaañsi bhi hai?', meaning: 'Do you have a cough as well?' },
      { speaker: 'B', name: 'Patient', urdu: 'جی، رات کو زیادہ۔', roman: 'ji, raat ko zyaada.', meaning: 'Yes, more at night.' },
      { speaker: 'A', name: 'Doctor', urdu: 'یہ دوا لیجیے اور آرام کیجیے۔', roman: 'ye dawa leejiye aur aaraam keejiye.', meaning: 'Take this medicine and rest.' },
    ],
    question: {
      ask: 'When is the cough worse?',
      answer: 'At night',
      options: ['At night', 'In the morning', 'After eating', 'It is not worse at any time'],
    },
  },
  {
    id: 'd-8',
    title: 'Booking a room',
    setting: 'At a hotel desk, late afternoon.',
    level: 'intermediate',
    lines: [
      { speaker: 'A', name: 'Traveller', urdu: 'کیا کمرہ خالی ہے؟', roman: 'kya kamra khaali hai?', meaning: 'Do you have a room free?' },
      { speaker: 'B', name: 'Clerk', urdu: 'کتنے دن کے لیے؟', roman: 'kitne din ke liye?', meaning: 'For how many days?' },
      { speaker: 'A', name: 'Traveller', urdu: 'دو راتوں کے لیے۔', roman: 'do raatoñ ke liye.', meaning: 'For two nights.' },
      { speaker: 'B', name: 'Clerk', urdu: 'ٹھیک ہے۔ شناختی کارڈ دیجیے۔', roman: 'ṭheek hai. shanaakhti kaarḍ deejiye.', meaning: 'Fine. Please give me your ID card.' },
      { speaker: 'A', name: 'Traveller', urdu: 'یہ رہا۔', roman: 'ye raha.', meaning: 'Here it is.' },
    ],
    question: {
      ask: 'What does the clerk ask for?',
      answer: 'An ID card',
      options: ['An ID card', 'Payment in advance', 'A phone number', 'A signature'],
    },
  },
  {
    id: 'd-9',
    title: 'Weekend plans',
    setting: 'Two colleagues on a Thursday.',
    level: 'intermediate',
    lines: [
      { speaker: 'A', name: 'Nadia', urdu: 'اتوار کو کیا کر رہی ہیں؟', roman: 'itwaar ko kya kar rahi hain?', meaning: 'What are you doing on Sunday?' },
      { speaker: 'B', name: 'Rabia', urdu: 'کچھ خاص نہیں۔ کیوں؟', roman: 'kuchh khaas nahiñ. kyoñ?', meaning: 'Nothing in particular. Why?' },
      { speaker: 'A', name: 'Nadia', urdu: 'ہم باغ جا رہے ہیں۔ آپ بھی آئیے۔', roman: 'ham baagh ja rahe hain. aap bhi aaiye.', meaning: 'We are going to the garden. Do come too.' },
      { speaker: 'B', name: 'Rabia', urdu: 'ضرور، کس وقت؟', roman: 'zaroor, kis waqt?', meaning: 'Certainly, at what time?' },
      { speaker: 'A', name: 'Nadia', urdu: 'صبح دس بجے۔', roman: 'subah das baje.', meaning: 'Ten in the morning.' },
    ],
    question: {
      ask: 'What does Rabia say to the invitation?',
      answer: 'She accepts and asks the time',
      options: ['She accepts and asks the time', 'She says she is busy', 'She suggests another day', 'She does not answer'],
    },
  },
  {
    id: 'd-10',
    title: 'A late arrival',
    setting: 'A guest arrives an hour after they were expected.',
    level: 'advanced',
    lines: [
      { speaker: 'A', name: 'Guest', urdu: 'معافی چاہتا ہوں، دیر ہو گئی۔', roman: 'maafi chaahta hoon, der ho gayi.', meaning: 'I am sorry, I am late.' },
      { speaker: 'B', name: 'Host', urdu: 'کوئی بات نہیں۔ خیریت تو ہے؟', roman: 'koi baat nahiñ. khairiyat to hai?', meaning: 'It does not matter. Is everything all right?' },
      { speaker: 'A', name: 'Guest', urdu: 'راستے میں بہت رش تھا۔', roman: 'raaste meñ bahut rush tha.', meaning: 'There was a lot of traffic on the way.' },
      { speaker: 'B', name: 'Host', urdu: 'آج کل یہی حال ہے۔ تشریف رکھیے۔', roman: 'aaj kal yehi haal hai. tashreef rakhiye.', meaning: 'That is how it is these days. Please sit down.' },
      { speaker: 'A', name: 'Guest', urdu: 'آپ کی مہربانی۔', roman: 'aap ki meherbaani.', meaning: 'That is kind of you.' },
    ],
    question: {
      ask: 'How does the host respond to the apology?',
      answer: 'Waves it off and checks they are well',
      options: ['Waves it off and checks they are well', 'Asks why they did not call', 'Says the food is cold', 'Accepts it coldly'],
    },
  },
  {
    id: 'd-11',
    title: 'Talking about a book',
    setting: 'Two friends after a reading.',
    level: 'advanced',
    lines: [
      { speaker: 'A', name: 'Zara', urdu: 'یہ کتاب آپ نے پڑھی؟', roman: 'ye kitaab aap ne paṛhi?', meaning: 'Have you read this book?' },
      { speaker: 'B', name: 'Hamid', urdu: 'جی، دو بار۔ بہت خوبصورت ہے۔', roman: 'ji, do baar. bahut khoobsurat hai.', meaning: 'Yes, twice. It is very beautiful.' },
      { speaker: 'A', name: 'Zara', urdu: 'مجھے آخری باب سمجھ نہیں آیا۔', roman: 'mujhe aakhri baab samajh nahiñ aaya.', meaning: 'I did not understand the last chapter.' },
      { speaker: 'B', name: 'Hamid', urdu: 'وہ جان بوجھ کر ادھورا چھوڑا گیا ہے۔', roman: 'wo jaan boojh kar adhoora chhoṛa gaya hai.', meaning: 'It was left unfinished on purpose.' },
      { speaker: 'A', name: 'Zara', urdu: 'اب سمجھ آیا۔', roman: 'ab samajh aaya.', meaning: 'Now I understand.' },
    ],
    question: {
      ask: 'What does Hamid say about the last chapter?',
      answer: 'It was left unfinished deliberately',
      options: ['It was left unfinished deliberately', 'It is the best chapter', 'He has not read it', 'It was badly translated'],
    },
  },
  {
    id: 'd-12',
    title: 'Leaving a job',
    setting: 'A quiet word with a manager.',
    level: 'advanced',
    lines: [
      { speaker: 'A', name: 'Employee', urdu: 'مجھے آپ سے ایک بات کرنی ہے۔', roman: 'mujhe aap se ek baat karni hai.', meaning: 'I need to speak with you about something.' },
      { speaker: 'B', name: 'Manager', urdu: 'فرمائیے۔', roman: 'farmaaiye.', meaning: 'Please, go ahead.' },
      { speaker: 'A', name: 'Employee', urdu: 'میں اگلے مہینے یہ کام چھوڑ رہا ہوں۔', roman: 'main agle maheene ye kaam chhoṛ raha hoon.', meaning: 'I am leaving this job next month.' },
      { speaker: 'B', name: 'Manager', urdu: 'افسوس ہوا۔ وجہ پوچھ سکتا ہوں؟', roman: 'afsos hua. wajah poochh sakta hoon?', meaning: 'I am sorry to hear it. May I ask why?' },
      { speaker: 'A', name: 'Employee', urdu: 'مجھے آگے پڑھنا ہے۔', roman: 'mujhe aage paṛhna hai.', meaning: 'I want to study further.' },
    ],
    question: {
      ask: 'Why is the employee leaving?',
      answer: 'To continue their studies',
      options: ['To continue their studies', 'For a better salary', 'They are moving city', 'They did not say'],
    },
  },
];

export const dialoguesByLevel = (level: Level) => DIALOGUES.filter((d) => d.level === level);
export const getDialogue = (id: string) => DIALOGUES.find((d) => d.id === id);
