/** Rule-based meal ideas for “use up” prompts — no network calls. */

export type RecipeIdeaSuggestion = {
  title: string;
  ingredientsHint?: string[];
};

const RULES: { keys: string[]; ideas: RecipeIdeaSuggestion[] }[] = [
  {
    keys: ["milk", "cream", "half and half"],
    ideas: [
      { title: "Pancakes or waffles", ingredientsHint: ["eggs", "flour"] },
      { title: "Creamy pasta sauce", ingredientsHint: ["pasta", "cheese"] },
      { title: "Smoothie or pudding", ingredientsHint: ["fruit"] },
    ],
  },
  {
    keys: ["pasta", "noodle", "spaghetti"],
    ideas: [
      { title: "Pasta bake", ingredientsHint: ["cheese", "tomato"] },
      { title: "Soup or minestrone", ingredientsHint: ["broth", "vegetables"] },
      { title: "Pasta salad", ingredientsHint: ["vegetables", "dressing"] },
    ],
  },
  {
    keys: ["rice"],
    ideas: [
      { title: "Fried rice", ingredientsHint: ["eggs", "vegetables"] },
      { title: "Rice bowls", ingredientsHint: ["protein", "vegetables"] },
      { title: "Soup", ingredientsHint: ["broth"] },
    ],
  },
  {
    keys: ["corn"],
    ideas: [
      { title: "Corn chowder", ingredientsHint: ["potato", "broth"] },
      { title: "Taco bowls", ingredientsHint: ["beans", "rice"] },
      { title: "Cornbread add-in", ingredientsHint: ["cornmeal"] },
    ],
  },
  {
    keys: ["egg", "eggs"],
    ideas: [
      { title: "Breakfast casserole", ingredientsHint: ["bread", "cheese"] },
      { title: "Fried rice", ingredientsHint: ["rice", "vegetables"] },
      { title: "Pancakes", ingredientsHint: ["flour", "milk"] },
    ],
  },
  {
    keys: ["bean", "beans", "chickpea", "black bean"],
    ideas: [
      { title: "Chili", ingredientsHint: ["tomato", "spices"] },
      { title: "Tacos or burritos", ingredientsHint: ["tortillas", "rice"] },
      { title: "Soup", ingredientsHint: ["broth", "vegetables"] },
    ],
  },
  {
    keys: ["cheese"],
    ideas: [
      { title: "Grilled cheese", ingredientsHint: ["bread"] },
      { title: "Quesadillas", ingredientsHint: ["tortillas"] },
      { title: "Casserole topping", ingredientsHint: ["pasta", "vegetables"] },
    ],
  },
  {
    keys: ["chicken", "turkey"],
    ideas: [
      { title: "Stir-fry", ingredientsHint: ["vegetables", "rice"] },
      { title: "Soup", ingredientsHint: ["broth", "noodles"] },
      { title: "Salad topper", ingredientsHint: ["greens", "dressing"] },
    ],
  },
];

export function getRuleBasedRecipeIdeas(itemName: string): RecipeIdeaSuggestion[] {
  const n = itemName.trim().toLowerCase();
  if (!n) {
    return [{ title: "Soup or skillet meal", ingredientsHint: ["seasonings"] }];
  }
  for (const rule of RULES) {
    if (rule.keys.some((k) => n.includes(k))) {
      return rule.ideas;
    }
  }
  return [
    { title: "One-pan skillet", ingredientsHint: ["oil", "seasonings"] },
    { title: "Soup or stew", ingredientsHint: ["broth", "vegetables"] },
    { title: "Grain bowl", ingredientsHint: ["rice or pasta", "vegetables"] },
  ];
}

/** Lowercase pantry item names for simple overlap hints. */
export function pantryNameKeywords(pantryNames: string[]): Set<string> {
  const s = new Set<string>();
  for (const name of pantryNames) {
    for (const part of name.toLowerCase().split(/[\s,/]+/)) {
      if (part.length > 2) {
        s.add(part);
      }
    }
  }
  return s;
}

export function filterHintsInPantry(
  hints: string[] | undefined,
  pantryKeywords: Set<string>,
): string[] {
  if (!hints?.length) {
    return [];
  }
  return hints.filter((h) => pantryKeywords.has(h.toLowerCase()));
}
