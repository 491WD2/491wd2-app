import type { Dispatch, SetStateAction } from "react";
import type { FamilyData } from "../data/familyData";
import { DashboardPreview } from "../components/dashboard-preview/DashboardPreview";

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
 * `/dashboard-preview` — isolated visual experiment with live household data.
 */
export function DashboardPreviewPage({
  data,
  setData,
  navigateWithinApp,
  onOpenPantry,
  onOpenShopping,
  onOpenTasks,
  onOpenCalendar,
  onOpenMemberDashboard,
}: DashboardPreviewPageProps) {
  return (
    <DashboardPreview
      data={data}
      setData={setData}
      navigateWithinApp={navigateWithinApp}
      onOpenPantry={onOpenPantry}
      onOpenShopping={onOpenShopping}
      onOpenCalendar={onOpenCalendar}
      onOpenTasks={onOpenTasks}
      onOpenMemberDashboard={onOpenMemberDashboard}
    />
  );
}
