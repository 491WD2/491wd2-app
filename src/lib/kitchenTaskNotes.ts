/** Short guidance per chore — keyed by normalized labels (new defaults + common variants). */
const NOTES: Record<string, string[]> = {
  "clean counters": [
    "Wipe all counters.",
    "Clear crumbs.",
    "Move items back neatly.",
  ],
  counters: [
    "Wipe all counters.",
    "Clear crumbs.",
    "Move items back neatly.",
  ],
  "clear counters": [
    "Wipe all counters.",
    "Clear crumbs.",
    "Move items back neatly.",
  ],
  "clean sink": ["Rinse sink.", "Wipe faucet.", "Check drain area."],
  sink: ["Rinse sink.", "Wipe faucet.", "Check drain area."],
  dishes: [
    "Load dishwasher or hand-wash.",
    "Nothing left soaking overnight.",
    "Cycle dishwasher if full.",
  ],
  "wipe table": ["Clear crumbs.", "Wipe surface.", "Chairs tucked in if needed."],
  table: ["Clear crumbs.", "Wipe surface.", "Chairs tucked in if needed."],
  "wipe counters and table": ["Counters first.", "Then table.", "Dry streak-prone spots."],
  "sweep floor": ["Sweep high-traffic zones.", "Shake rugs if needed.", "Spot-mop sticky spots."],
  trash: ["Bag tied.", "Replace liner.", "Touch exterior if sticky."],
  "take out trash": ["Bag tied.", "Replace liner.", "Touch exterior if sticky."],
  "check stove": ["Wipe spills.", "Confirm burners off.", "Knobs clean."],
  stove: ["Wipe spills.", "Confirm burners off.", "Knobs clean."],
  "clear fridge items if needed": [
    "Toss expired leftovers.",
    "Move older items forward.",
    "Wipe obvious spills.",
  ],
  fridge: [
    "Toss expired leftovers.",
    "Move older items forward.",
    "Wipe obvious spills.",
  ],
};

function normalizeKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "");
}

export function getKitchenTaskNotesLines(label: string): string[] {
  const n = normalizeKey(label);
  if (NOTES[n]) {
    return NOTES[n];
  }
  const words = n.split(" ");
  for (const w of words) {
    if (w.length > 3 && NOTES[w]) {
      return NOTES[w];
    }
  }
  return [`Focus on “${label.trim()}” thoroughly before marking done.`];
}
