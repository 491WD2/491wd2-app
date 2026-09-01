import type { Dispatch, SetStateAction } from "react";
import type { FamilyData } from "../../data/familyData";

export type DashboardPreviewProps = {
  data: FamilyData;
  setData: Dispatch<SetStateAction<FamilyData>>;
  navigateWithinApp: (href: string) => void;
  onOpenPantry: () => void;
  onOpenShopping: () => void;
  onOpenCalendar: () => void;
  onOpenTasks?: () => void;
  onOpenMemberDashboard?: (memberId: string) => void;
};

export type DashboardPreviewNavProps = Pick<
  DashboardPreviewProps,
  | "navigateWithinApp"
  | "onOpenPantry"
  | "onOpenShopping"
  | "onOpenCalendar"
  | "onOpenTasks"
  | "onOpenMemberDashboard"
>;

export type DashboardGo = (href: string, fallback?: () => void) => void;
