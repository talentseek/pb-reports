// Basic UK postcode validation and normalization
// Accepts common formats and returns uppercased, single-spaced codes, deduped

const UK_POSTCODE_REGEX = /^(GIR 0AA|(?:(?:[A-Z]{1,2}\d[A-Z\d]?|ASCN|STHL|TDCU|BBND|[A-Z]{1,2}\d{1,2}|BFPO) ?\d[ABD-HJLN-UW-Z]{2}))$/i;

export function normalizePostcode(input: string): string | null {
  const s = input.trim().toUpperCase().replace(/\s+/g, "");
  if (s.length < 5) return null;
  // insert space before last 3 chars
  const normalized = `${s.slice(0, s.length - 3)} ${s.slice(-3)}`;
  return UK_POSTCODE_REGEX.test(normalized) ? normalized : null;
}

export function validateUkPostcodes(raw: string): { valid: boolean; postcodes?: string[]; message?: string } {
  const parts = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const normalized: string[] = [];
  for (const p of parts) {
    const n = normalizePostcode(p);
    if (!n) return { valid: false, message: `Invalid UK postcode: ${p}` };
    if (!normalized.includes(n)) normalized.push(n);
  }
  return { valid: true, postcodes: normalized };
}


