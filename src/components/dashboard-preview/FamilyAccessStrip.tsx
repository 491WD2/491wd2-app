import { getMemberFullName, getMemberInitials } from "../../lib/utils";
import type { DashboardPreviewModel } from "../../lib/dashboard-preview/useDashboardPreviewModel";
import type { DashboardGo } from "./types";

const MEMBER_DOTS = [
  "#2F9BC4",
  "#3CBC95",
  "#4FC3D9",
  "#E8A317",
  "#5B8DEF",
  "#E15A4A",
] as const;

function memberDot(index: number): string {
  return MEMBER_DOTS[index % MEMBER_DOTS.length];
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

type FamilyAccessStripProps = {
  model: DashboardPreviewModel;
  go: DashboardGo;
  onOpenMemberDashboard?: (memberId: string) => void;
};

export function FamilyAccessStrip({
  model,
  go,
  onOpenMemberDashboard,
}: FamilyAccessStripProps) {
  const { orderedMembers, selectedMemberId } = model;
  const memberCountLabel =
    orderedMembers.length === 1 ? "1 member" : `${orderedMembers.length} members`;

  const openMember = (memberId: string) => {
    if (onOpenMemberDashboard) {
      onOpenMemberDashboard(memberId);
      return;
    }
    go(`/family/${encodeURIComponent(memberId)}`);
  };

  return (
    <section
      className="dashboard-preview__card dashboard-preview__card--compact dashboard-preview__family-strip"
      aria-label="Family access"
    >
      <header className="dashboard-preview__card-head dashboard-preview__card-head--row dashboard-preview__card-head--compact">
        <h2 className="dashboard-preview__section-title">Family</h2>
        <p className="dashboard-preview__meta">
          {orderedMembers.length === 0
            ? "Add members in Settings"
            : `${memberCountLabel} · tap to open`}
        </p>
      </header>

      {orderedMembers.length === 0 ? (
        <p className="dashboard-preview__placeholder">
          No active family members yet. Add them in Settings.
        </p>
      ) : (
        <div className="dashboard-preview__family" role="list" aria-label="Family members">
          {orderedMembers.map((member, index) => {
            const selected = member.id === selectedMemberId;
            const displayName = firstName(getMemberFullName(member));
            return (
              <button
                key={member.id}
                type="button"
                role="listitem"
                className={[
                  "dashboard-preview__family-member",
                  selected ? "is-selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => openMember(member.id)}
                aria-pressed={selected}
                title={getMemberFullName(member)}
                aria-label={`${getMemberFullName(member)}${selected ? ", current" : ""}`}
              >
                <span
                  className="dashboard-preview__family-avatar"
                  style={{ backgroundColor: memberDot(index) }}
                  aria-hidden="true"
                >
                  {getMemberInitials(member)}
                </span>
                <span className="dashboard-preview__family-name">{displayName}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
