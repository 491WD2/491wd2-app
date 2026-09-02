/** Predictable result for household mutations that must not corrupt FamilyData. */
export type HouseholdActionResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };
