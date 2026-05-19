import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Apple,
  Beer,
  CakeSlice,
  ChefHat,
  CupSoda,
  Dog,
  Droplets,
  Dumbbell,
  Drumstick,
  Fish,
  Globe2,
  Home,
  Milk,
  Package,
  Popcorn,
  Snowflake,
  UtensilsCrossed,
  Wheat,
} from "lucide-react";

export type GroceryCategoryTheme = {
  accent: string;
  hover: string;
  soft: string;
  icon: LucideIcon;
};

const MEAT_ICON = Drumstick;

export const PANTRY_CATEGORY_DISPLAY_ORDER = [
  "Bakery",
  "Baking Supplies",
  "Beverages",
  "Canned & Jarred",
  "Condiments",
  "Dairy & Eggs",
  "Frozen Foods",
  "Grains Pasta & Dry Goods",
  "Household & Misc Items",
  "International & Ethnic Foods",
  "Meats",
  "Seafood",
  "Pet Food",
  "Prepared Foods",
  "Snacks",
  "Produce",
  "Protein Bars & Supplements",
  "Alcohol",
] as const;

export const PANTRY_VISIBLE_CATEGORY_ORDER = PANTRY_CATEGORY_DISPLAY_ORDER.filter(
  (category) => category !== "Alcohol",
);

const GROCERY_CATEGORY_THEMES: Record<string, GroceryCategoryTheme> = {
  Bakery: { accent: "#f59e0b", hover: "#d97706", soft: "#fffbeb", icon: CakeSlice },
  "Baking Supplies": { accent: "#f97316", hover: "#ea580c", soft: "#fff7ed", icon: ChefHat },
  Beverages: { accent: "#3b82f6", hover: "#2563eb", soft: "#eff6ff", icon: CupSoda },
  "Canned & Jarred": { accent: "#14b8a6", hover: "#0d9488", soft: "#f0fdfa", icon: Package },
  Condiments: { accent: "#ef4444", hover: "#dc2626", soft: "#fef2f2", icon: Droplets },
  "Dairy & Eggs": { accent: "#0ea5e9", hover: "#0284c7", soft: "#f0f9ff", icon: Milk },
  "Frozen Foods": { accent: "#06b6d4", hover: "#0891b2", soft: "#ecfeff", icon: Snowflake },
  "Grains Pasta & Dry Goods": { accent: "#ca8a04", hover: "#a16207", soft: "#fefce8", icon: Wheat },
  "Household & Misc Items": { accent: "#78716c", hover: "#57534e", soft: "#fafaf9", icon: Home },
  "International & Ethnic Foods": { accent: "#a855f7", hover: "#9333ea", soft: "#faf5ff", icon: Globe2 },
  Meats: { accent: "#f43f5e", hover: "#e11d48", soft: "#fff1f2", icon: MEAT_ICON },
  Seafood: { accent: "#6366f1", hover: "#4f46e5", soft: "#eef2ff", icon: Fish },
  "Pet Food": { accent: "#ec4899", hover: "#db2777", soft: "#fdf2f8", icon: Dog },
  "Prepared Foods": { accent: "#ea580c", hover: "#c2410c", soft: "#fff7ed", icon: UtensilsCrossed },
  Snacks: { accent: "#d946ef", hover: "#c026d3", soft: "#fdf4ff", icon: Popcorn },
  Produce: { accent: "#22c55e", hover: "#16a34a", soft: "#f0fdf4", icon: Apple },
  "Protein Bars & Supplements": { accent: "#65a30d", hover: "#4d7c0f", soft: "#f7fee7", icon: Dumbbell },
  Alcohol: { accent: "#7c3aed", hover: "#6d28d9", soft: "#f5f3ff", icon: Beer },
};

const DEFAULT_THEME: GroceryCategoryTheme = {
  accent: "#07515f",
  hover: "#064653",
  soft: "#eef7f9",
  icon: Package,
};

export function getGroceryCategoryTheme(category: string): GroceryCategoryTheme {
  return GROCERY_CATEGORY_THEMES[category] ?? DEFAULT_THEME;
}

export function groceryCategoryThemeStyle(category: string) {
  const theme = getGroceryCategoryTheme(category);
  return {
    "--wd-grocery-cat-accent": theme.accent,
    "--wd-grocery-cat-hover": theme.hover,
    "--wd-grocery-cat-soft": theme.soft,
  } as CSSProperties;
}
