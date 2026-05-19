import type { Dispatch, SetStateAction } from "react";
import type { FamilyData } from "../../../data/familyData";
import type { DashboardInboxMode } from "../../../lib/dashboardCommandCenterFilters";
import { HouseholdAlertsPanel } from "../HouseholdAlertsPanel";
import { hubCardClass } from "./dashboardHubTokens";

/** Notifications on Home — always SmartHR light card (ignore global dark theme on Dashboard). */
export function DashboardHubActivityCard({
  data,
  setData,
  currentMemberId,
  onViewAll,
  inboxMode,
  targetMemberId,
}: {
  data: FamilyData;
  setData: Dispatch<SetStateAction<FamilyData>>;
  currentMemberId?: string;
  onViewAll?: () => void;
  inboxMode?: DashboardInboxMode;
  targetMemberId?: string;
}) {
  return (
    <HouseholdAlertsPanel
      data={data}
      setData={setData}
      currentMemberId={currentMemberId}
      premiumDark={false}
      maxItems={4}
      className={hubCardClass}
      onViewAll={onViewAll}
      viewAllLabel="View all"
      inboxMode={inboxMode}
      targetMemberId={targetMemberId}
    />
  );
}
