/** Household chore kiosk palette — use with Tailwind `household-*` or CSS vars. */
export const CHORE_COLORS = {
  yellow: "#FFD522",
  coral: "#FF4B6C",
  magenta: "#C516E1",
  violet: "#735DFF",
  ink: "#1D1136",
  white: "#FFFFFF",
} as const;

export const CHORE_MEMBER_COLORS: Record<string, string> = {
  Lorraine: CHORE_COLORS.magenta,
  Herschel: CHORE_COLORS.violet,
  Stella: CHORE_COLORS.coral,
  Nox: CHORE_COLORS.yellow,
  Jeremiah: "#3B82F6",
};

export type ChoreShellTab = "home" | "dashboard" | "schedule" | "user";

export const CHORE_SHELL_TABS: Array<{ id: ChoreShellTab; label: string }> = [
  { id: "home", label: "Home" },
  { id: "dashboard", label: "Dashboard" },
  { id: "schedule", label: "Schedule" },
  { id: "user", label: "Users" },
];

/** ~20mm at 96dpi — minimum kiosk touch target. */
export const CHORE_TOUCH_MIN_PX = 76;
