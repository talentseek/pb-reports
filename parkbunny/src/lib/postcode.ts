// Postcode validation and normalization — supports GB and NL
import type { MarketCode } from './market-config'

// ── UK ────────────────────────────────────────────────────────────────
const UK_POSTCODE_REGEX = /^(GIR 0AA|(?:(?:[A-Z]{1,2}\d[A-Z\d]?|ASCN|STHL|TDCU|BBND|[A-Z]{1,2}\d{1,2}|BFPO) ?\d[ABD-HJLN-UW-Z]{2}))$/i;

export function normalizePostcode(input: string): string | null {
  const s = input.trim().toUpperCase().replace(/\s+/g, "");
  if (s.length < 5) return null;
  const normalized = `${s.slice(0, s.length - 3)} ${s.slice(-3)}`;
  return UK_POSTCODE_REGEX.test(normalized) ? normalized : null;
}

export function validateUkPostcodes(raw: string): { valid: boolean; postcodes?: string[]; message?: string } {
  return validatePostcodes(raw, 'GB');
}

// ── NL ────────────────────────────────────────────────────────────────
const NL_POSTCODE_REGEX = /^[1-9][0-9]{3}\s(?!SA|SD|SS)[A-Z]{2}$/i;

function normalizeNlPostcode(input: string): string | null {
  const s = input.trim().toUpperCase().replace(/\s+/g, "");
  if (s.length !== 6) return null;
  // Format: 4 digits + space + 2 letters
  const normalized = `${s.slice(0, 4)} ${s.slice(4)}`;
  return NL_POSTCODE_REGEX.test(normalized) ? normalized : null;
}

// ── Universal ─────────────────────────────────────────────────────────
const NORMALIZERS: Record<MarketCode, (input: string) => string | null> = {
  GB: normalizePostcode,
  NL: normalizeNlPostcode,
}

const MARKET_LABELS: Record<MarketCode, string> = {
  GB: 'UK',
  NL: 'Dutch',
}

export function validatePostcodes(raw: string, market: MarketCode = 'GB'): { valid: boolean; postcodes?: string[]; message?: string } {
  const normalize = NORMALIZERS[market] ?? NORMALIZERS.GB;
  const label = MARKET_LABELS[market] ?? market;
  const parts = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return { valid: false, message: 'Please enter at least one postcode' };
  const normalized: string[] = [];
  for (const p of parts) {
    const n = normalize(p);
    if (!n) return { valid: false, message: `Invalid ${label} postcode: ${p}` };
    if (!normalized.includes(n)) normalized.push(n);
  }
  return { valid: true, postcodes: normalized };
}
