/** Pastel kiosk backgrounds per member color theme. */
export const MEMBER_THEME_STYLES: Record<
  string,
  { shell: string; hero: string; accent: string; ring: string; badge: string }
> = {
  blue: {
    shell: "fh-member-theme--blue",
    hero: "from-blue-100/90 via-sky-50/80 to-white",
    accent: "#2563eb",
    ring: "#3b82f6",
    badge: "bg-blue-100 text-blue-900",
  },
  green: {
    shell: "fh-member-theme--green",
    hero: "from-emerald-100/90 via-green-50/80 to-white",
    accent: "#059669",
    ring: "#10b981",
    badge: "bg-emerald-100 text-emerald-900",
  },
  emerald: {
    shell: "fh-member-theme--emerald",
    hero: "from-emerald-100/90 via-green-50/80 to-white",
    accent: "#059669",
    ring: "#10b981",
    badge: "bg-emerald-100 text-emerald-900",
  },
  purple: {
    shell: "fh-member-theme--purple",
    hero: "from-violet-100/90 via-purple-50/80 to-white",
    accent: "#7c3aed",
    ring: "#8b5cf6",
    badge: "bg-violet-100 text-violet-900",
  },
  violet: {
    shell: "fh-member-theme--violet",
    hero: "from-violet-100/90 via-purple-50/80 to-white",
    accent: "#7c3aed",
    ring: "#8b5cf6",
    badge: "bg-violet-100 text-violet-900",
  },
  amber: {
    shell: "fh-member-theme--amber",
    hero: "from-amber-100/90 via-orange-50/80 to-white",
    accent: "#d97706",
    ring: "#f59e0b",
    badge: "bg-amber-100 text-amber-950",
  },
  orange: {
    shell: "fh-member-theme--orange",
    hero: "from-orange-100/90 via-amber-50/80 to-white",
    accent: "#ea580c",
    ring: "#f97316",
    badge: "bg-orange-100 text-orange-950",
  },
  rose: {
    shell: "fh-member-theme--rose",
    hero: "from-rose-100/90 via-pink-50/80 to-white",
    accent: "#e11d48",
    ring: "#f43f5e",
    badge: "bg-rose-100 text-rose-900",
  },
  slate: {
    shell: "fh-member-theme--slate",
    hero: "from-slate-100/90 via-slate-50/80 to-white",
    accent: "#475569",
    ring: "#64748b",
    badge: "bg-slate-200 text-slate-800",
  },
};

export function resolveMemberTheme(colorTheme: string) {
  return MEMBER_THEME_STYLES[colorTheme] ?? MEMBER_THEME_STYLES.slate;
}
