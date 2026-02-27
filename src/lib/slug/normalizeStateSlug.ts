/**
 * Normalize directory emirate slugs.
 *
 * The database uses full-name slugs (dubai, abu-dhabi, sharjah, etc.)
 * This function normalizes abbreviations to the DB slug.
 */
const ABBREV_TO_FULL: Record<string, string> = {
  dxb: "dubai",
  auh: "abu-dhabi",
  shj: "sharjah",
  ajm: "ajman",
  rak: "ras-al-khaimah",
  fuj: "fujairah",
  uaq: "umm-al-quwain",
};

export function normalizeStateSlug(input?: string | null): string {
  const s = (input || "").trim();
  if (!s) return "";
  const lower = s.toLowerCase();
  // If it's an abbreviation, convert to full slug; otherwise keep as-is
  return ABBREV_TO_FULL[lower] ?? lower;
}
