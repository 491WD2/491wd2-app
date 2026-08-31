import type { Dispatch, SetStateAction } from "react";
import type { FamilyData } from "../data/familyData";
import { DashboardPreview } from "../components/dashboard-preview/DashboardPreview";
import { getAppDisplayName } from "../lib/customization";

export type DashboardPreviewPageProps = {
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
 * `/dashboard-preview` — isolated visual experiment.
 * Props mirror Home for CurrentBuild wiring; mutations are not used in the shell pass.
 */
export function DashboardPreviewPage({
  data,
  setData: _setData,
  navigateWithinApp: _navigate,
  onOpenPantry: _pantry,
  onOpenShopping: _shopping,
  onOpenTasks: _tasks,
  onOpenCalendar: _calendar,
  onOpenSettings: _settings,
  onOpenMemberDashboard: _member,
}: DashboardPreviewPageProps) {
  void _setData;
  void _navigate;
  void _pantry;
  void _shopping;
  void _tasks;
  void _calendar;
  void _settings;
  void _member;

  return (
    <DashboardPreview
      data={data}
      householdName={getAppDisplayName(data.adminSettings)}
    />
  );
}
