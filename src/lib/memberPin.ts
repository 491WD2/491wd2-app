import type { FamilyMember } from "../data/familyData";

export function isFourDigitPin(value: string): boolean {
  return /^\d{4}$/.test(value);
}

export function membersMatchingPin(members: FamilyMember[], pin: string): FamilyMember[] {
  if (!isFourDigitPin(pin)) {
    return [];
  }
  return members.filter((m) => m.status === "active" && m.pinCode === pin);
}

export function isPinTakenByOther(
  members: FamilyMember[],
  pin: string,
  exceptMemberId: string,
): boolean {
  if (!isFourDigitPin(pin)) {
    return false;
  }
  return members.some(
    (m) => m.id !== exceptMemberId && m.pinCode === pin,
  );
}
