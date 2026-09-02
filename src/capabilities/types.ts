import type { FamilyData } from "../data/familyData";
import type { HouseholdActionResult } from "../household/actions/types";

export type HouseholdCapabilityId = "shopping.addItem" | "chores.complete";

/**
 * Small typed command surface for household behavior.
 * Capabilities call existing 491 actions — they never own persistence.
 */
export type HouseholdCapability<Input, Output> = {
  id: HouseholdCapabilityId;
  execute: (
    data: FamilyData,
    input: Input,
  ) => HouseholdActionResult<Output>;
};
