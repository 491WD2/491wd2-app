/**
 * Read-only selectors for UI — derived views over {@link FamilyData} without mutation.
 */
import type { FamilyData, MessageBoardItem, Pet } from "../data/familyData";
import { messageBoardItemInvolvesMember } from "./dashboardCommandCenterFilters";
import { findMemberById } from "./utils";
import {
  computeFleaMedicationUiStatus,
  latestFleaEntryForPet,
  type FleaMedicationUiStatus,
} from "./petFleaMedication";

/**
 * Session identity for UI only — does not write storage.
 * Order: explicit active member → preferences member → first active roster member.
 */
export function resolveSessionMemberIdForUi(data: FamilyData): string | undefined {
  const tryId = (id: string | undefined): string | undefined => {
    if (!id?.trim()) return undefined;
    return findMemberById(data, id) ? id : undefined;
  };
  const explicit = tryId(data.adminSettings.activeMemberId);
  if (explicit) return explicit;
  const prefs = tryId(data.adminSettings.activePreferencesMemberId);
  if (prefs) return prefs;
  const roster = data.familyMembers.filter((m) => m.status === "active");
  return roster[0]?.id;
}

/** Pinned / important / urgent messages, not past expiresAt. Newest first. */
export function selectImportantMessagesForHome(
  data: FamilyData,
  limit = 5,
): MessageBoardItem[] {
  const today = new Date().toISOString().slice(0, 10);
  const rows = data.messageBoard.filter((m) => {
    if (m.expiresAt && m.expiresAt < today) {
      return false;
    }
    return (
      m.pinned ||
      m.priority === "important" ||
      m.priority === "urgent"
    );
  });
  rows.sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    const ta = a.updatedAt ?? a.createdAt;
    const tb = b.updatedAt ?? b.createdAt;
    return tb.localeCompare(ta);
  });
  return rows.slice(0, limit);
}

/** Important home messages optionally scoped to a roster member (author / related). */
export function selectImportantMessagesForHomeMember(
  data: FamilyData,
  memberId: string | undefined,
  limit = 5,
): MessageBoardItem[] {
  const base = selectImportantMessagesForHome(data, Math.max(limit * 3, 12));
  if (!memberId) {
    return base.slice(0, limit);
  }
  const filtered = base.filter((m) => {
    if (m.authorMemberId === memberId) {
      return true;
    }
    return Boolean(m.relatedMemberIds?.includes(memberId));
  });
  return filtered.slice(0, limit);
}

/**
 * Important home messages: in member view, theirs first then other household items (muted in UI).
 */
export function selectImportantMessagesForDashboardHomeView(
  data: FamilyData,
  memberId: string | undefined,
  limit = 5,
): { item: MessageBoardItem; primary: boolean }[] {
  const pool = selectImportantMessagesForHome(data, Math.max(limit * 4, 16));
  if (!memberId) {
    return pool.slice(0, limit).map((item) => ({ item, primary: true }));
  }
  const ranked = pool.map((item) => ({
    item,
    primary: messageBoardItemInvolvesMember(item, memberId),
  }));
  ranked.sort((a, b) => {
    if (a.primary !== b.primary) {
      return a.primary ? -1 : 1;
    }
    const ta = a.item.updatedAt ?? a.item.createdAt;
    const tb = b.item.updatedAt ?? b.item.createdAt;
    return tb.localeCompare(ta);
  });
  return ranked.slice(0, limit);
}

export type PetFleaAttention = {
  pet: Pet;
  status: FleaMedicationUiStatus;
  lastGivenIso?: string;
};

/** Active pets whose flea status needs attention (not up-to-date). */
export function selectPetsFleaAttention(data: FamilyData): PetFleaAttention[] {
  const out: PetFleaAttention[] = [];
  for (const pet of data.pets) {
    if (!pet.active) {
      continue;
    }
    const latest = latestFleaEntryForPet(pet.id, data.petMedicationEntries);
    const last = latest?.givenAt;
    const status = computeFleaMedicationUiStatus(last);
    if (status === "upToDate" || status === "none") {
      continue;
    }
    out.push({ pet, status, lastGivenIso: last });
  }
  return out.sort((a, b) => a.pet.name.localeCompare(b.pet.name));
}

/** Lightweight counts for diagnostics panels (no side effects). */
export function selectFamilyDataCounts(data: FamilyData) {
  return {
    members: data.familyMembers.length,
    messages: data.messageBoard.length,
    calendarEvents: data.planner.length,
    shopping: data.shopping.length,
    pantry: data.pantry.length,
    cleaningRooms: data.cleaningRooms.length,
    pets: data.pets.length,
    notifications: data.notifications.length,
    tasks: data.tasks.length,
  };
}
