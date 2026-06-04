export function meaningKey(input) {
  let s = String(input || '').toLowerCase();
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  s = s.replace(/['’]/g, '');
  s = s.replace(/[^a-z0-9]+/g, ' ');
  s = s.replace(/\b(this|that|the|a|an|is|are|was|were|be|being|been|to|of|for|and|or|but|with|without|very|really|kind|sort|thing|stuff|people|someone|something|anything|everything|always|never|maybe|probably|basically|literally)\b/g, ' ');
  s = s.replace(/\b(statement|claim|truth|belief|reflects|reality|consistently|enough|survive|evidence|repeatable|pressure|testing|test)\b/g, ' ');
  s = s.replace(/\bcorrupts\b/g, 'corrupt');
  s = s.replace(/\bevil\b/g, 'bad');
  s = s.replace(/\bexperts\b/g, 'expert');
  s = s.replace(/\bpays\b/g, 'pay');
  s = s.replace(/\bhard work\b/g, 'work');
  // written contractions (apostrophes already stripped above)
  s = s.replace(/\b(doesnt|didnt|dont|wont|isnt|arent|wasnt|werent|hasnt|hadnt|cant|shouldnt|wouldnt|couldnt)\b/g, ' ');
  // additional function words and prepositions
  s = s.replace(/\b(on|in|not|no|does|did|do|will|would|could|should|has|have|had)\b/g, ' ');
  // simple suffix normalisation — -s first so "landings" → "landing" → "land"
  s = s.replace(/(\w{4,})s\b/g, '$1');
  s = s.replace(/(\w{4,})ing\b/g, '$1');
  s = s.replace(/(\w{4,})ed\b/g, '$1');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

export function meaningMatch(a, b) {
  const ka = meaningKey(a);
  const kb = meaningKey(b);
  if (!ka || !kb) return false;
  if (ka === kb) return true;
  const aw = new Set(ka.split(' ').filter(Boolean));
  const bw = new Set(kb.split(' ').filter(Boolean));
  if (!aw.size || !bw.size) return false;
  let overlap = 0;
  for (const w of aw) if (bw.has(w)) overlap++;
  const ratio = overlap / Math.min(aw.size, bw.size);
  return ratio >= 0.65 && overlap >= 2;
}
