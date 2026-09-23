/**
 * Devanagari & Marathi to English Transliteration and Text Sanitization Utility for Server
 */

const charMap: Record<string, string> = {
  'अ': 'A', 'आ': 'Aa', 'इ': 'I', 'ई': 'Ee', 'उ': 'U', 'ऊ': 'Oo', 'ऋ': 'Ri',
  'ए': 'E', 'ऐ': 'Ai', 'ओ': 'O', 'औ': 'Au', 'अं': 'An', 'अः': 'Ah',
  'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u', 'ृ': 'ri',
  'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n', 'ँ': 'n', 'ः': 'h',
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
  'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h', 'ळ': 'l',
  'क्ष': 'ksh', 'ज्ञ': 'dny', 'श्र': 'shr',
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
};

const knownDictionary: Record<string, string> = {
  'सुवर्णा': 'Suvarna',
  'जितेंद्र': 'Jitendra',
  'पाटील': 'Patil',
  'सुवर्णा जितेंद्र पाटील': 'Suvarna Jitendra Patil',
  'शितल': 'Shital',
  'महाजन': 'Mahajan',
  'शितल महाजन': 'Shital Mahajan',
  'योगिता': 'Yogita',
  'सोनवणे': 'Sonawane',
  'कविता': 'Kavita',
  'चौधरी': 'Chaudhari',
  'पुनम': 'Punam',
  'बोरद': 'Borad',
  'जळगाव': 'Jalgaon',
  'महाराष्ट्र': 'Maharashtra'
};

export function hasDevanagari(text?: string | null): boolean {
  if (!text) return false;
  return /[\u0900-\u097F]/.test(text);
}

export function isCorruptedQuestionMarks(text?: string | null): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed === '?' || trimmed === '??' || trimmed === '???') return true;
  const qCount = (trimmed.match(/\?/g) || []).length;
  return qCount >= 3 || /\?{2,}/.test(trimmed);
}

export function transliterateMarathi(text?: string | null): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (!hasDevanagari(trimmed)) return trimmed;

  if (knownDictionary[trimmed]) {
    return knownDictionary[trimmed];
  }

  const words = trimmed.split(/(\s+|[,.-])/);
  return words.map(word => {
    const wTrim = word.trim();
    if (knownDictionary[wTrim]) {
      return knownDictionary[wTrim];
    }
    let res = '';
    const chars = Array.from(word);
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      const next = chars[i + 1];
      const nextNext = chars[i + 2];

      if (charMap[c] !== undefined) {
        const isConsonant = /[\u0915-\u0939\u0958-\u095F]/.test(c);
        if (isConsonant) {
          const cRom = charMap[c];
          if (next === '्') {
            res += cRom;
            i++;
            if (nextNext === 'र') {
              res += 'r';
              i++;
              if (chars[i + 1] && charMap[chars[i + 1]] && /[\u093E-\u094C]/.test(chars[i + 1])) {
                // matra follows
              } else if (i === chars.length - 1) {
                res += 'a';
              }
            }
          } else if (next && /[\u093E-\u094C]/.test(next)) {
            res += cRom + charMap[next];
            i++;
          } else {
            const isLast = (i === chars.length - 1) || (chars[i + 1] && !/[\u0905-\u0939]/.test(chars[i + 1]));
            res += isLast ? cRom : cRom + 'a';
          }
        } else {
          res += charMap[c];
        }
      } else {
        res += c;
      }
    }
    if (res.length > 0 && /^[a-zA-Z]/.test(res)) {
      return res.charAt(0).toUpperCase() + res.slice(1);
    }
    return res;
  }).join('');
}

export function formatDisplayName(name?: string | null, fallbackCode?: string): string {
  if (!name || isCorruptedQuestionMarks(name)) {
    return fallbackCode ? `Partner (${fallbackCode})` : 'Woman Partner';
  }

  const clean = name.trim();
  if (hasDevanagari(clean)) {
    const transliterated = transliterateMarathi(clean);
    return transliterated || clean;
  }

  return clean;
}
