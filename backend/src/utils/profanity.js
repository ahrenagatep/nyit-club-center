// profanity filter for Skill Exchange text (posts, tags, comments, messages)
// blocks slurs and severe profanity; mild words ("damn", "crap", "hell", "ass") are allowed
// matches whole words (so "Scunthorpe", "spicy", "cockpit" pass) and sees through
// common disguises: f*ck, fuuuck, f u c k, f.u.c.k, sh1t, $hit, accents
// a word list can't catch everything; it's a deterrent, not a guarantee

// endings allowed after a profanity root ("bitches", "shitty", "cunts")
const PROFANITY_SUFFIXES = ['', 's', 'es', 'z', 'ed', 'er', 'ers', 'ing', 'in', 'y', 'ty', 'ies', 'head', 'heads', 'face', 'hole', 'holes', 'bag', 'bags', 'show', 'load', 'storm'];
// slurs only take plurals, so words like "spicy" or "raccoon" are never caught
const SLUR_SUFFIXES = ['', 's', 'z'];

// sub: blocked anywhere inside a word (only roots that never occur in clean words)
// word: blocked as a whole word, with the given prefixes/suffixes
const BLOCKED = [
  // severe profanity
  { term: 'fuck', mode: 'sub' },
  { term: 'phuck', mode: 'sub' },
  { term: 'fuk', suffixes: PROFANITY_SUFFIXES },
  { term: 'fck', suffixes: PROFANITY_SUFFIXES },
  { term: 'fcuk', suffixes: PROFANITY_SUFFIXES },
  { term: 'phuk', suffixes: PROFANITY_SUFFIXES },
  { term: 'fuq', suffixes: PROFANITY_SUFFIXES },
  { term: 'stfu' },
  { term: 'gtfo' },
  { term: 'wtf' },
  { term: 'shit', prefixes: ['', 'bull', 'horse', 'dip', 'bat', 'chicken'], suffixes: PROFANITY_SUFFIXES },
  { term: 'bitch', suffixes: PROFANITY_SUFFIXES },
  { term: 'cunt', suffixes: PROFANITY_SUFFIXES },
  { term: 'asshole', suffixes: SLUR_SUFFIXES },
  { term: 'cocksucker', suffixes: SLUR_SUFFIXES },
  { term: 'dickhead', suffixes: SLUR_SUFFIXES },
  { term: 'pussy' },
  { term: 'pussies' },
  { term: 'twat', suffixes: SLUR_SUFFIXES },
  { term: 'whore', suffixes: SLUR_SUFFIXES },
  { term: 'slut', suffixes: [...SLUR_SUFFIXES, 'ty'] },
  { term: 'jizz' },

  // racial and ethnic slurs
  { term: 'nigger', prefixes: ['', 'sand'], suffixes: SLUR_SUFFIXES },
  { term: 'nigga', suffixes: SLUR_SUFFIXES },
  { term: 'niggah', suffixes: SLUR_SUFFIXES },
  { term: 'chink', suffixes: SLUR_SUFFIXES },
  { term: 'gook', suffixes: SLUR_SUFFIXES },
  { term: 'spic', suffixes: SLUR_SUFFIXES },
  { term: 'spick', suffixes: SLUR_SUFFIXES },
  { term: 'wetback', suffixes: SLUR_SUFFIXES },
  { term: 'beaner', suffixes: SLUR_SUFFIXES },
  { term: 'kike', suffixes: SLUR_SUFFIXES },
  { term: 'coon', suffixes: SLUR_SUFFIXES },
  { term: 'raghead', suffixes: SLUR_SUFFIXES },
  { term: 'towelhead', suffixes: SLUR_SUFFIXES },
  { term: 'paki', suffixes: SLUR_SUFFIXES },
  { term: 'zipperhead', suffixes: SLUR_SUFFIXES },

  // slurs about sexuality, gender, and disability
  { term: 'faggot', suffixes: SLUR_SUFFIXES },
  { term: 'fag', suffixes: SLUR_SUFFIXES },
  { term: 'tranny', suffixes: SLUR_SUFFIXES },
  { term: 'trannies' },
  { term: 'retard', suffixes: [...SLUR_SUFFIXES, 'ed'] },
];

// look-alike characters used to dodge filters (applied only inside words that have letters)
const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '!': 'i', '|': 'i', '@': 'a', $: 's', '+': 't' };

const collapseRepeats = (word) => word.replace(/([a-z])\1+/g, '$1');

// every blocked spelling, plain and with repeated letters collapsed ("fuuuck" -> "fuck")
const BLOCKED_WORDS = new Set();
const BLOCKED_ROOTS = []; // 'sub' terms
for (const { term, mode, prefixes = [''], suffixes = [''] } of BLOCKED) {
  if (mode === 'sub') {
    BLOCKED_ROOTS.push(term, collapseRepeats(term));
    continue;
  }
  for (const prefix of prefixes) {
    for (const suffix of suffixes) {
      const word = prefix + term + suffix;
      BLOCKED_WORDS.add(word);
      BLOCKED_WORDS.add(collapseRepeats(word));
    }
  }
}
// spellings a starred word ("f**k") is compared against
const STAR_TARGETS = [...BLOCKED_WORDS, ...BLOCKED_ROOTS.flatMap((root) => PROFANITY_SUFFIXES.map((s) => root + s))];

// useLeet: read look-alikes as letters ("sh1t"); run both ways, because "shit!" must
// still be seen as "shit", not "shiti"
function wordsIn(text, useLeet) {
  const plain = text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
  const words = [];
  let letterRun = []; // single letters in a row: "f u c k" or "f.u.c.k"

  const endRun = () => {
    if (letterRun.length >= 3) words.push(letterRun.join(''));
    letterRun = [];
  };

  for (const chunk of plain.split(/\s+/)) {
    const mapped = useLeet && /[a-z]/.test(chunk) ? [...chunk].map((ch) => LEET[ch] ?? ch).join('') : chunk;
    const parts = mapped.split(/[^a-z*]+/).filter(Boolean);

    for (const part of parts) {
      if (part.length === 1 && part !== '*') {
        letterRun.push(part);
      } else {
        endRun();
        words.push(part);
      }
    }
    // the chunk with its punctuation removed: "fu-ck" -> "fuck"
    if (parts.length > 1) words.push(parts.join(''));
  }
  endRun();
  return words;
}

function isBlockedWord(word) {
  const collapsed = collapseRepeats(word);
  if (BLOCKED_WORDS.has(word) || BLOCKED_WORDS.has(collapsed)) return true;
  if (BLOCKED_ROOTS.some((root) => word.includes(root) || collapsed.includes(root))) return true;

  // "f*ck", "sh**": each * stands for up to two hidden letters
  const letters = word.replace(/\*/g, '');
  if (word.includes('*') && letters.length >= 2) {
    const pattern = new RegExp(`^${word.replace(/\*+/g, (stars) => `[a-z]{0,${stars.length * 2}}`)}$`);
    return STAR_TARGETS.some((target) => pattern.test(target));
  }
  return false;
}

function containsProfanity(text) {
  if (typeof text !== 'string' || !text) return false;
  return wordsIn(text, false).some(isBlockedWord) || wordsIn(text, true).some(isBlockedWord);
}

// fields: { fieldName: text or array of texts }; returns the first field with profanity, or null
function findProfaneField(fields) {
  for (const [name, value] of Object.entries(fields)) {
    const texts = Array.isArray(value) ? value : [value];
    if (texts.some(containsProfanity)) return name;
  }
  return null;
}

module.exports = { containsProfanity, findProfaneField };
