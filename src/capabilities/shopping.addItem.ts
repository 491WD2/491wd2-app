import type { FamilyData } from "../data/familyData";
import { applyShoppingAddItem, type ShoppingAddItemOutcome } from "../household/actions";
import type { HouseholdCapability } from "./types";

export type ShoppingAddItemInput = {
  name: string;
};

export const shoppingAddItemCapability: HouseholdCapability<
  ShoppingAddItemInput,
  ShoppingAddItemOutcome
> = {
  id: "shopping.addItem",
  execute(data: FamilyData, input: ShoppingAddItemInput) {
    return applyShoppingAddItem(data, input.name);
  },
};
