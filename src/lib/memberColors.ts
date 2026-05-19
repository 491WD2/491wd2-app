import type { CSSProperties } from "react";
import type { FamilyMember } from "../data/familyData";
import { DS } from "./designSystem";
import { getMemberFullName } from "./utils";

/** Canonical gradient stops by first name (household roster). */
export type MemberGradientStops = { from: string; to: string; display: string };

export const CANONICAL_MEMBER_GRADIENT: Record<string, MemberGradientStops> = {
  lorraine: { from: "#6D0000", to: "#E2504E", display: "#E2504E" },
  herschel: { from: "#B35300", to: "#FFB900", display: "#FFB900" },
  stella: { from: "#FFE014", to: "#FFF7B8", display: "#FFE014" },
  nox: { from: "#009700", to: "#AEE52E", display: "#AEE52E" },
  jeremiah: { from: "#000FFD", to: "#BDCBFF", display: "#7D8CFF" },
};

/** Flat hex map for quick lookups (display emphasis). */
export const CANONICAL_MEMBER_HEX_BY_FIRST_NAME: Record<string, string> =
  Object.fromEntries(
    Object.entries(CANONICAL_MEMBER_GRADIENT).map(([k, v]) => [k, v.display]),
  );

const FALLBACK_HEX = DS.primary;

/** Structural Tailwind classes for member chips on dark admin surfaces (pair with inline style from {@link memberChipStyleDark}). */
export const MEMBER_CHIP_SHELL_CLASS =
  "inline-flex max-w-full items-center truncate rounded-full border px-2.5 py-0.5 text-[13px] font-semibold";

/**
 * Returns stable chip wrapper classes. Apply `style={memberChipStyleDark(member)}` or
 * `style={memberChipStyleForId(memberId, familyMembers)}` for per-member coloring.
 */
export function getMemberChipClass(memberId: string, familyMembers: FamilyMember[]): string {
  void memberId;
  void familyMembers;
  return MEMBER_CHIP_SHELL_CLASS;
}

/** When `colorTheme` is set but no name match, approximate a readable hex. */
const COLOR_THEME_HEX: Record<string, string> = {
  rose: CANONICAL_MEMBER_GRADIENT.lorraine!.display,
  orange: CANONICAL_MEMBER_GRADIENT.herschel!.display,
  amber: CANONICAL_MEMBER_GRADIENT.stella!.display,
  yellow: CANONICAL_MEMBER_GRADIENT.stella!.display,
  green: CANONICAL_MEMBER_GRADIENT.nox!.display,
  emerald: CANONICAL_MEMBER_GRADIENT.nox!.display,
  blue: CANONICAL_MEMBER_GRADIENT.jeremiah!.display,
  sky: "#38bdf8",
  teal: DS.primary,
  cyan: "#06b6d4",
  purple: DS.purple,
  violet: "#8b5cf6",
  pink: "#ec4899",
  fuchsia: "#d946ef",
  slate: DS.textMuted,
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace("#", "").trim();
  if (h.length !== 6) return null;
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return { r, g, b };
}

/** RGBA string from hex + alpha (for tinted chips on dark surfaces). */
export function rgbaFromHex(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(0, 183, 199, ${alpha})`;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
}

export function getMemberColor(member: FamilyMember | undefined | null): string {
  if (!member) {
    return FALLBACK_HEX;
  }
  const first =
    getMemberFullName(member).trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (first && CANONICAL_MEMBER_HEX_BY_FIRST_NAME[first]) {
    return CANONICAL_MEMBER_HEX_BY_FIRST_NAME[first]!;
  }
  const theme = (member.colorTheme ?? "").trim().toLowerCase();
  if (theme && COLOR_THEME_HEX[theme]) {
    return COLOR_THEME_HEX[theme]!;
  }
  return FALLBACK_HEX;
}

export function getMemberColorByName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (first && CANONICAL_MEMBER_HEX_BY_FIRST_NAME[first]) {
    return CANONICAL_MEMBER_HEX_BY_FIRST_NAME[first]!;
  }
  return FALLBACK_HEX;
}

export function getMemberColorById(
  memberId: string,
  familyMembers: FamilyMember[],
): string {
  const m = familyMembers.find((x) => x.id === memberId);
  return getMemberColor(m);
}

/** @deprecated Prefer {@link getMemberColorById} — same behavior. */
export function getKitchenMemberAccent(
  memberId: string,
  familyMembers: FamilyMember[],
): string {
  return getMemberColorById(memberId, familyMembers);
}

export function memberChipStyleForId(
  memberId: string,
  familyMembers: FamilyMember[],
): CSSProperties {
  const m = familyMembers.find((x) => x.id === memberId);
  return memberChipStyleDark(m);
}

export function getMemberGradientByName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  const g = first ? CANONICAL_MEMBER_GRADIENT[first] : undefined;
  if (g) {
    return `linear-gradient(135deg, ${g.from} 0%, ${g.to} 100%)`;
  }
  return `linear-gradient(135deg, ${FALLBACK_HEX} 0%, #0d9488 100%)`;
}

/**
 * Pick readable text on dark UI vs light paper-like surfaces.
 * Stella/Jeremiah need darker tones on light backgrounds.
 */
export function getReadableMemberTextColor(
  name: string,
  surface: "dark" | "light",
): string {
  const base = getMemberColorByName(name);
  const first = name.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (surface === "light") {
    if (first === "stella") return "#9A7A00";
    if (first === "jeremiah") return "#3B4DC9";
    if (first === "herschel") return "#B35300";
  }
  if (surface === "dark" && first === "stella") {
    return CANONICAL_MEMBER_GRADIENT.stella!.display;
  }
  return base;
}

/** Inline styles for member chips on dark dashboard cards. */
export function memberChipStyleDark(member: FamilyMember | undefined): CSSProperties {
  const hex = getMemberColor(member);
  return {
    color: hex,
    borderColor: rgbaFromHex(hex, 0.45),
    backgroundColor: rgbaFromHex(hex, 0.14),
  };
}
