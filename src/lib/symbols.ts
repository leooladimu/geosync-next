/** Glyph constants — replaces SYMBOLS from geoSync3.5 theme.js */
export const SYMBOLS = {
  earth: "♁",
  earthAlt: "⊕",
  sun: "☉︎",
  moon: "☽︎",
  spring: "♈︎",
  summer: "♋︎",
  fall: "♎︎",
  winter: "♑︎",
  star: "✦︎",
} as const;

export const SEASON_SYMBOLS: Record<string, string> = {
  spring: "♈︎",
  summer: "☉︎",
  fall:   "♎︎",
  winter: "♑︎",
};
