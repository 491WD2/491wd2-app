import type { Dispatch, SetStateAction } from "react";
import type { FamilyData } from "../data/familyData";

export type PageProps = {
  data: FamilyData;
  setData: Dispatch<SetStateAction<FamilyData>>;
  onOpenMemberDashboard?: (memberId: string) => void;
  onOpenDashboard?: () => void;
  onOpenFamily?: () => void;
  onOpenTasks?: () => void;
  onOpenProjects?: () => void;
  onOpenPantry?: () => void;
  onOpenShopping?: () => void;
  onOpenCalendar?: () => void;
  onOpenPlanner?: () => void;
  onOpenSettings?: () => void;
  onSwitchUser?: () => void;
  onLockScreen?: () => void;
  restrictChildNavigation?: boolean;
  onOpenLogin?: () => void;
  /** Query string when this page is mounted (e.g. `?item=…` on `/pantry`). */
  inventorySearch?: string;
  /** Query string on `/shopping` for deep tabs (`?tab=list`). */
  shoppingSearch?: string;
  /** SPA navigation preserving query when needed (inventory QR deep links). */
  navigateWithinApp?: (href: string) => void;
};
