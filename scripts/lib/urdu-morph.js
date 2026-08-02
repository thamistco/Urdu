/* eslint-disable */
/**
 * Reduce an inflected Urdu word to a form the vocabulary might actually list.
 *
 * The ordering check asks "was this word taught before it was tested". Asked
 * naively it answers wrongly, because running text is inflected and a
 * vocabulary list is not: the course teaches پینا ("to drink") and the sentence
 * says پیتا, teaches چھوٹا and the sentence says چھوٹی, teaches کمرہ and the
 * sentence says کمرے. None of those are untaught words. A first pass without
 * this reported 216 "words with no vocabulary entry", and the large majority
 * were forms of words sitting in the list three entries away.
 *
 * So: given a surface form, generate the lemmas it could be an inflection of,
 * and let the caller keep whichever one the vocabulary knows. Generating
 * candidates rather than stripping to a stem is what keeps this honest — a rule
 * that guesses wrong produces a candidate nothing matches, which costs nothing,
 * where a stemmer that guesses wrong silently merges two different words.
 *
 * Deliberately not a morphological analyser. Urdu inflection is far richer than
 * this, and the checks this serves would rather report a form it cannot place
 * than quietly accept one it placed wrongly — so `classify()` returns 'unknown'
 * rather than guessing, and the caller reports what is left over.
 */

/**
 * Closed-class words: pronouns and their oblique/possessive forms,
 * postpositions, conjunctions, particles. Grammar teaches these, in its own
 * sequence, and no vocabulary topic owns them — so a check asking "which topic
 * introduced this word" has no sensible answer for any of them.
 *
 * They must be removed *before* the morphology below runs, not after. Several
 * are homographs of verb forms and the suffix rules will happily claim them:
 * کہ ("that", the conjunction) parses as a stem of کہنا, and لیے (the "for" of
 * کے لیے) as a perfective of لینا. Both then get gated on a verbs topic that
 * has nothing to do with them.
 */
const FUNCTION_WORDS = new Set([
  // pronouns, and the oblique forms that look nothing like the direct one
  'اس',
  'اُس',
  'اسے',
  'اُسے',
  'ان',
  'اُن',
  'انہوں',
  'اُنہوں',
  'انہیں',
  'اُنہیں',
  'ہمیں',
  'ہمارا',
  'ہماری',
  'ہمارے',
  'تمہیں',
  'تمہارا',
  'تمہاری',
  'تمہارے',
  'میری',
  'میرے',
  'اپنا',
  'اپنی',
  'اپنے',
  'جس',
  'جن',
  'کس',
  'کن',
  'کسی',
  'کوئی',
  'جو',
  'خود',
  // postpositions
  'پر',
  'پاس',
  'ساتھ',
  'لیے',
  'بغیر',
  'بارے',
  'طرف',
  'وجہ',
  'بعد',
  'پہلے',
  'دوران',
  // conjunctions and particles
  'کہ',
  'تو',
  'ہی',
  'بھی',
  'اگر',
  'مگر',
  'لیکن',
  'یا',
  'اور',
  'نہیں',
  'نہ',
  'کیوں',
  'جب',
  'تب',
  'کاش',
  'ذرا',
  'سی',
  'سے',
  'ایسی',
  'ایسا',
  'ایسے',
  'یہی',
  'وہی',
  'بھر',
  'ہاں',
  'جی',
  // compound postpositions — two words that behave as one grammatical unit,
  // and are taught by the postpositions concept rather than by any topic
  'کے لیے',
  'بعد میں',
  'کے بعد',
  'کے پاس',
  'کے ساتھ',
  'کے بارے میں',
]);

/**
 * Names. A person or a city is not vocabulary, and no lesson will ever teach
 * one — but they read exactly like nouns, so without this every sentence that
 * introduces a character reports an untaught word.
 */
const PROPER_NOUNS = new Set([
  'علی',
  'احمد',
  'سارہ',
  'عمران',
  'فاطمہ',
  'حسن',
  'زینب',
  'بلال',
  'عائشہ',
  'لاہور',
  'کراچی',
  'اسلام آباد',
  'پشاور',
  'ملتان',
  'پاکستان',
]);

/**
 * Verbs whose perfective/oblique stems are not the infinitive minus نا.
 * Urdu has few genuinely irregular verbs and these are all of the ones that
 * appear in the course's sentences; everything else is regular enough for the
 * suffix rules below.
 */
const IRREGULAR = {
  // کرنا — to do
  کیا: 'کرنا',
  کی: 'کرنا',
  کیے: 'کرنا',
  کئے: 'کرنا',
  کر: 'کرنا',
  کرو: 'کرنا',
  کیجیے: 'کرنا',
  کروں: 'کرنا',
  // جانا — to go
  گیا: 'جانا',
  گئی: 'جانا',
  گئے: 'جانا',
  جا: 'جانا',
  // دینا — to give
  دیا: 'دینا',
  دی: 'دینا',
  دیے: 'دینا',
  دے: 'دینا',
  دو: 'دینا',
  دیجیے: 'دینا',
  // لینا — to take
  لیا: 'لینا',
  لی: 'لینا',
  لیے: 'لینا',
  لے: 'لینا',
  // ہونا — to be
  ہوا: 'ہونا',
  ہوئی: 'ہونا',
  ہوئے: 'ہونا',
  ہوتا: 'ہونا',
  ہوتی: 'ہونا',
  ہوتے: 'ہونا',
  ہوگا: 'ہونا',
  // آنا — to come
  آیا: 'آنا',
  آئی: 'آنا',
  آئے: 'آنا',
  آ: 'آنا',
  آئیں: 'آنا',
  آئیے: 'آنا',
  گئیں: 'جانا',
  // کہنا — to say. The stem doubles the ہ, so کہہ + نا does not rebuild it.
  کہہ: 'کہنا',
  // لینا / دینا polite imperatives
  لیجیے: 'لینا',
  لائیے: 'لانا',
};

/**
 * Suffixes that attach to a verb stem, longest first so that تیں is tried
 * before تی. Each maps the surface form back to `stem + نا`.
 */
const VERB_SUFFIXES = [
  'تیں',
  'تا',
  'تی',
  'تے',
  'ئیے',
  'یے',
  'ئیں',
  'یں',
  'ؤں',
  'وں',
  'ئے',
  'یا',
  'ی',
  'ے',
  'ا',
  'ؤ',
  'و',
  'نی',
  'نے',
];

/**
 * Reverse noun/adjective inflection: surface ending -> the endings a citation
 * form could have had. Urdu marks gender and number on the ending, so چھوٹی
 * and چھوٹے are both چھوٹا, and کمرے is کمرہ.
 */
const NOMINAL = [
  // feminine / oblique / plural of a masculine -ا or -ہ word
  { from: 'ی', to: ['ا', 'ہ'] },
  { from: 'ے', to: ['ا', 'ہ'] },
  { from: 'وں', to: ['ا', 'ہ', ''] },
  // plural of a feminine -ی word: کرسی -> کرسیاں
  { from: 'یاں', to: ['ی'] },
  { from: 'یوں', to: ['ی'] },
  // plural of a consonant-final feminine: بہن -> بہنیں
  { from: 'یں', to: [''] },
  { from: 'ات', to: [''] },
  // oblique plural of a consonant-final word: بچہ -> بچوں handled above
  { from: 'اں', to: [''] },
];

/**
 * Every lemma `word` could be an inflection of, most likely first.
 * Always includes `word` itself, so a form that needs no analysis costs nothing.
 */
function lemmaCandidates(word) {
  const out = [word];
  const push = (c) => {
    if (c && c.length > 1 && !out.includes(c)) out.push(c);
  };

  if (IRREGULAR[word]) push(IRREGULAR[word]);

  // verb: strip a personal/aspectual ending and restore the infinitive
  for (const suf of VERB_SUFFIXES) {
    if (word.length > suf.length + 1 && word.endsWith(suf)) {
      push(word.slice(0, -suf.length) + 'نا');
    }
  }
  // bare stem used as an imperative: بول -> بولنا
  push(word + 'نا');

  // nominal gender/number
  for (const { from, to } of NOMINAL) {
    if (word.length > from.length && word.endsWith(from)) {
      const base = word.slice(0, -from.length);
      for (const t of to) push(base + t);
    }
  }

  return out;
}

/**
 * Every candidate `known` recognises, not just the first.
 * `known` is anything with a `.has()` — a Set of Urdu surface forms.
 *
 * All of them, because a surface form is often genuinely ambiguous and taking
 * the first match picks a reading rather than reporting one. کرتا is both the
 * garment (a kurta) and "does" — a form of کرنا — and returning only the
 * identity match reads "I work every day" as needing a clothing lesson. پکا is
 * both "ripe" and a form of پکانا, "to cook".
 *
 * Returning the set lets the caller apply the same rule it already applies to a
 * word listed under two topics: if any reading has been taught, the learner can
 * read the word.
 */
function resolve(word, known) {
  return lemmaCandidates(word).filter((c) => known.has(c));
}

/**
 * What kind of thing is this word, for a check that wants to know which lesson
 * introduced it?
 *
 *   'function' — closed-class, taught by grammar, owned by no topic
 *   'name'     — a proper noun, never taught
 *   'lemma'    — vocabulary; `.lemmas` are the entries it could be a form of
 *   'unknown'  — not in the vocabulary under any form this can derive
 *
 * Callers should use this rather than the pieces, because the order matters:
 * function words have to be taken out before morphology gets a chance to parse
 * them as verbs.
 */
function classify(word, known) {
  if (FUNCTION_WORDS.has(word)) return { kind: 'function' };
  if (PROPER_NOUNS.has(word)) return { kind: 'name' };
  const lemmas = resolve(word, known);
  return lemmas.length ? { kind: 'lemma', lemmas } : { kind: 'unknown' };
}

module.exports = { lemmaCandidates, resolve, classify, FUNCTION_WORDS, PROPER_NOUNS, IRREGULAR };
