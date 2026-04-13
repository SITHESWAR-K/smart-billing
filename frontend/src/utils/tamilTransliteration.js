const WORD_MAP = {
  rice: '\u0B85\u0BB0\u0BBF\u0B9A\u0BBF',
  sugar: '\u0B9A\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BB0\u0BC8',
  milk: '\u0BAA\u0BBE\u0BB2\u0BCD',
  curd: '\u0BA4\u0BAF\u0BBF\u0BB0\u0BCD',
  yogurt: '\u0BA4\u0BAF\u0BBF\u0BB0\u0BCD',
  butter: '\u0BB5\u0BC6\u0BA3\u0BCD\u0BA3\u0BC6\u0BAF\u0BCD',
  ghee: '\u0BA8\u0BC6\u0BAF\u0BCD',
  oil: '\u0B8E\u0BA3\u0BCD\u0BA3\u0BC6\u0BAF\u0BCD',
  salt: '\u0B89\u0BAA\u0BCD\u0BAA\u0BC1',
  tea: '\u0BA4\u0BC7\u0BA8\u0BC0\u0BB0\u0BCD',
  coffee: '\u0B95\u0BBE\u0BAA\u0BBF',
  flour: '\u0BAE\u0BBE\u0BB5\u0BC1',
  atta: '\u0BAE\u0BBE\u0BB5\u0BC1',
  soap: '\u0B9A\u0BCB\u0BAA\u0BCD\u0BAA\u0BC1',
  shampoo: '\u0BB7\u0BBE\u0BAE\u0BCD\u0BAA\u0BC1',
  biscuit: '\u0BAA\u0BBF\u0BB8\u0BCD\u0B95\u0B9F\u0BCD',
  noodles: '\u0BA8\u0BC2\u0B9F\u0BC1\u0BB2\u0BCD\u0BB8\u0BCD',
  detergent: '\u0B9F\u0BBF\u0B9F\u0BB0\u0BCD\u0B9C\u0BC6\u0BA9\u0BCD\u0B9F\u0BCD',
  masala: '\u0BAE\u0B9A\u0BBE\u0BB2\u0BBE',
  dal: '\u0BA4\u0BBE\u0BB2\u0BCD',
  wheat: '\u0B95\u0BCB\u0BA4\u0BC1\u0BAE\u0BC8',
  bread: '\u0BB0\u0BCA\u0B9F\u0BCD\u0B9F\u0BBF',
  eggs: '\u0BAE\u0BC1\u0B9F\u0BCD\u0B9F\u0BC8',
  egg: '\u0BAE\u0BC1\u0B9F\u0BCD\u0B9F\u0BC8',
  juice: '\u0B9C\u0BC2\u0BB8\u0BCD',
  tomato: '\u0BA4\u0B95\u0BCD\u0B95\u0BBE\u0BB3\u0BBF',
  onion: '\u0BB5\u0BC6\u0B99\u0BCD\u0B95\u0BBE\u0BAF\u0BAE\u0BCD',
  potato: '\u0B89\u0BB0\u0BC1\u0BB3\u0BC8\u0B95\u0BCD\u0B95\u0BBF\u0BB4\u0B99\u0BCD\u0B95\u0BC1',
  brand: '\u0BAA\u0BBF\u0BB0\u0BBE\u0BA3\u0BCD\u0B9F\u0BCD'
}

const VOWELS = {
  a: '\u0B85',
  aa: '\u0B86',
  i: '\u0B87',
  ii: '\u0B88',
  u: '\u0B89',
  uu: '\u0B8A',
  e: '\u0B8E',
  ee: '\u0B8F',
  ai: '\u0B90',
  o: '\u0B92',
  oo: '\u0B93',
  au: '\u0B94'
}

const VOWEL_SIGNS = {
  a: '',
  aa: '\u0BBE',
  i: '\u0BBF',
  ii: '\u0BC0',
  u: '\u0BC1',
  uu: '\u0BC2',
  e: '\u0BC6',
  ee: '\u0BC7',
  ai: '\u0BC8',
  o: '\u0BCA',
  oo: '\u0BCB',
  au: '\u0BCC'
}

const CONSONANTS = {
  ng: '\u0B99',
  nj: '\u0B9E',
  ch: '\u0B9A',
  sh: '\u0BB7',
  zh: '\u0BB4',
  th: '\u0BA4',
  dh: '\u0BA4',
  ph: '\u0BAA',
  bh: '\u0BAA',
  kh: '\u0B95',
  gh: '\u0B95',
  rr: '\u0BB1',
  ll: '\u0BB3',
  nn: '\u0BA3',
  k: '\u0B95',
  g: '\u0B95',
  c: '\u0B9A',
  s: '\u0B9A',
  j: '\u0B9C',
  t: '\u0B9F',
  d: '\u0B9F',
  n: '\u0BA8',
  p: '\u0BAA',
  b: '\u0BAA',
  m: '\u0BAE',
  y: '\u0BAF',
  r: '\u0BB0',
  l: '\u0BB2',
  v: '\u0BB5',
  h: '\u0BB9',
  f: '\u0B83\u0BAA'
}

const VOWEL_KEYS = Object.keys(VOWELS).sort((a, b) => b.length - a.length)
const CONSONANT_KEYS = Object.keys(CONSONANTS).sort((a, b) => b.length - a.length)

const transliterateWord = (word) => {
  const clean = word.toLowerCase()
  if (WORD_MAP[clean]) return WORD_MAP[clean]

  let result = ''
  let index = 0

  while (index < clean.length) {
    const remaining = clean.slice(index)

    const vowelKey = VOWEL_KEYS.find(key => remaining.startsWith(key))
    if (vowelKey) {
      result += VOWELS[vowelKey]
      index += vowelKey.length
      continue
    }

    const consonantKey = CONSONANT_KEYS.find(key => remaining.startsWith(key))
    if (consonantKey) {
      const next = clean.slice(index + consonantKey.length)
      const nextVowel = VOWEL_KEYS.find(key => next.startsWith(key))

      if (nextVowel) {
        result += CONSONANTS[consonantKey] + VOWEL_SIGNS[nextVowel]
        index += consonantKey.length + nextVowel.length
      } else {
        result += CONSONANTS[consonantKey] + '\u0BCD'
        index += consonantKey.length
      }
      continue
    }

    result += clean[index]
    index += 1
  }

  return result
}

export const toTamilText = (input = '') => {
  if (!input) return ''
  return input.replace(/[A-Za-z]+/g, match => transliterateWord(match))
}

export const getLocalizedProductName = (name = '', brand = '', language = 'en') => {
  const display = [brand, name].filter(Boolean).join(' ').trim()
  if (!display) return ''
  if (language !== 'ta') return display
  return toTamilText(display)
}
