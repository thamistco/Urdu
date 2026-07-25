/**
 * Transliteration for the grammatical forms that are not vocabulary items.
 *
 * The Roman track has to be able to render everything the Script track can,
 * and most of the app already carries its own Roman: every word, phrase,
 * sentence, passage line and dialogue line has a `roman` field. The gap is
 * grammar drills, whose options are inflected endings, copulas, pronouns and
 * tense markers — the pieces of the language that are grammar rather than
 * vocabulary, so they never became `Word` entries.
 *
 * Those forms are listed here. A transliteration is a fact about how a word is
 * pronounced, not an authored expression, and the scheme is the one used
 * throughout the app: doubled vowels for long ones (aa, ee), `ñ` for
 * nasalisation, `ṛ` for the retroflex flap.
 *
 * Bare suffixes are written with a leading hyphen (`-i`, `-oñ`) because that is
 * what they are: endings that attach to a stem, not words a learner could say
 * on their own.
 */

export const GRAMMAR_TRANSLIT: Record<string, string> = {
  // pronouns
  'آپ': 'aap', 'میں': 'main', 'وہ': 'wo', 'ہم': 'hum', 'تم': 'tum', 'یہ': 'ye',
  'مجھے': 'mujhe', 'مجھ': 'mujh', 'میرا': 'mera',

  // to be
  'ہوں': 'hoon', 'ہے': 'hai', 'ہیں': 'hain', 'ہو': 'ho',

  // gender agreement on adjectives
  'اچھا': 'achha', 'اچھی': 'achhi', 'اچھے': 'achhe', 'اچھو': 'achho',
  'بڑا': 'baṛa', 'بڑی': 'baṛi', 'بڑے': 'baṛe', 'بڑیاں': 'baṛiyaañ',

  // plurals and oblique plurals
  'کتابیں': 'kitaabeñ', 'کتابوں': 'kitaaboñ', 'کتابیاں': 'kitaabiyaañ',
  'لڑکے': 'laṛke', 'لڑکوں': 'laṛkoñ',

  // bare endings
  'ی': '-i', 'ا': '-a', 'ے': '-e', 'وں': '-oñ', 'و': '-o', 'یے': '-iye',
  'تی': '-ti', 'تا': '-ta', 'تے': '-te', 'تیں': '-tiñ',

  // postpositions
  'کا': 'ka', 'کی': 'ki', 'کے': 'ke', 'کو': 'ko', 'سے': 'se', 'تک': 'tak', 'نے': 'ne',

  // negation
  'مت': 'mat', 'نہ': 'na',

  // continuous
  'رہا': 'raha', 'رہی': 'rahi', 'رہے': 'rahe', 'رہیں': 'raheñ',

  // past
  'تھا': 'tha', 'تھی': 'thi', 'تھے': 'the', 'تھیں': 'thiñ',

  // future
  'گا': 'ga', 'گی': 'gi', 'گے': 'ge', 'گیں': 'giñ',

  // verb stems and compound verbs that appear as drill options
  'آتا': 'aata', 'آتی': 'aati', 'آتے': 'aate',
  'آیا': 'aaya', 'آئے': 'aaye', 'آتا ہے': 'aata hai', 'آئے گا': 'aaye ga',
  // the causative chain: read it / teach it / have it taught
  'جانتی': 'jaanti', 'پڑھے': 'paṛhe', 'پڑھتے': 'paṛhte', 'پڑھاتے': 'paṛhaate',
  'پڑھواتے': 'paṛhwaate',
  'سکتا': 'sakta', 'سکتی': 'sakti', 'سکتے': 'sakte', 'سکنا': 'sakna',
  'چاہیے': 'chaahiye', 'پڑا': 'paṛa',
  'گیا': 'gaya', 'گئی': 'gayi', 'گئے': 'gaye',
  'لیا': 'liya', 'دیا': 'diya', 'ڈالا': 'ḍaala',

  // place words
  'یہاں': 'yahaañ', 'وہاں': 'wahaañ', 'جہاں': 'jahaañ',
};
