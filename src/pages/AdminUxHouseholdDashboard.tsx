import type { Dispatch, SetStateAction } from "react";
import type { FamilyData } from "../data/familyData";
import { NotionHomeWorkspace } from "../components/notion/NotionHomeWorkspace";

export type AdminUxHouseholdDashboardProps = {
  data: FamilyData;
  setData: Dispatch<SetStateAction<FamilyData>>;
  navigateWithinApp: (href: string) => void;
  onOpenPantry: () => void;
  onOpenShopping: () => void;
  onOpenTasks: () => void;
  onOpenCalendar: () => void;
  onOpenSettings: () => void;
  onOpenMemberDashboard?: (memberId: string) => void;
};

/**
 * Streamlined household home for /adminux — Notion-style workspace (Stage N1A).
 * `onOpenSettings` remains on the props contract for CurrentBuild wiring; Home uses navigateWithinApp for modules.
 */
export function AdminUxHouseholdDashboard(props: AdminUxHouseholdDashboardProps) {
  const { onOpenSettings: _settings, ...homeProps } = props;
  void _settings;
  return <NotionHomeWorkspace {...homeProps} />;
}
