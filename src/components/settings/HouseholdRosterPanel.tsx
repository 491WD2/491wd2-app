import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import type { FamilyMember } from "../../data/familyData";
import {
  getMemberAgeGroups,
  getMemberStatuses,
  mergeLists,
} from "../../lib/customization";
import { createActivity } from "../../lib/activity";
import { cn, getMemberFullName, getMemberInitials } from "../../lib/utils";
import type { Dispatch, SetStateAction } from "react";
import type { FamilyData } from "../../data/familyData";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/Field";
import {
  MemberEditForm,
  MemberField,
  shouldLogMemberUpdate,
} from "../family/memberEditShared";
const themeStyles: Record<string, string> = {
  blue: "border-blue-200 bg-blue-50 text-blue-900",
  green: "border-emerald-200 bg-emerald-50 text-emerald-900",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
  purple: "border-violet-200 bg-violet-50 text-violet-900",
  violet: "border-violet-200 bg-violet-50 text-violet-900",
  amber: "border-amber-200 bg-amber-50 text-amber-950",
  orange: "border-orange-200 bg-orange-50 text-orange-950",
  rose: "border-rose-200 bg-rose-50 text-rose-900",
  slate: "border-[#ededed] bg-[#f8f9fa] text-slate-800",
};

export function HouseholdRosterPanel({
  data,
  setData,
}: {
  data: FamilyData;
  setData: Dispatch<SetStateAction<FamilyData>>;
}) {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingMemberId, setEditingMemberId] = useState<string | undefined>();
  const admin = data.adminSettings;
  const statusOptionsForForms = useMemo(
    () => mergeLists(getMemberStatuses(admin), data.familyMembers.map((m) => m.status)),
    [admin, data.familyMembers],
  );
  const ageGroupOptionsForForms = useMemo(
    () => mergeLists(getMemberAgeGroups(admin), data.familyMembers.map((m) => m.ageGroup)),
    [admin, data.familyMembers],
  );

  const filteredMembers = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return data.familyMembers
      .filter((member) => {
        const matchesSearch =
          !q ||
          member.name.toLowerCase().includes(q) ||
          (member.nickname ?? "").toLowerCase().includes(q);
        const matchesStatus = statusFilter === "all" || member.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.familyMembers, searchText, statusFilter]);

  function addMember() {
    const memberId = crypto.randomUUID();
    const now = new Date().toISOString();
    setData((current) => ({
      ...createActivity(current, {
        type: "created",
        entityType: "familyMember",
        entityId: memberId,
        entityTitle: "New family member",
        memberId,
        message: "Added family member: New family member.",
      }),
      familyMembers: [
        ...current.familyMembers,
        {
          id: memberId,
          name: "New family member",
          status: "active",
          colorTheme: "blue",
          notes: "",
          updatedAt: now,
        },
      ],
    }));
    setEditingMemberId(memberId);
  }

  function updateMember(id: string, updates: Partial<FamilyMember>) {
    setData((current) => {
      const member = current.familyMembers.find((item) => item.id === id);
      const nextData = {
        ...current,
        familyMembers: current.familyMembers.map((item) =>
          item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item,
        ),
      };

      if (!member || !shouldLogMemberUpdate(updates)) {
        return nextData;
      }

      return createActivity(nextData, {
        type: "updated",
        entityType: "familyMember",
        entityId: member.id,
        entityTitle: member.name,
        memberId: member.id,
        message: `Updated family member: ${member.name}.`,
      });
    });
  }

  function removeMember(member: FamilyMember) {
    const shouldRemove = window.confirm(
      `Remove ${member.name} from the directory?\n\nTasks and planner rows keep their assignments. Restore only from a backup.`,
    );

    if (!shouldRemove) {
      return;
    }

    setData((current) =>
      createActivity(
        {
          ...current,
          familyMembers: current.familyMembers.filter((item) => item.id !== member.id),
        },
        {
          type: "deleted",
          entityType: "familyMember",
          entityId: member.id,
          entityTitle: member.name,
          memberId: member.id,
          message: `Removed family member: ${member.name}.`,
        },
      ),
    );
    if (editingMemberId === member.id) {
      setEditingMemberId(undefined);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
          <label className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]">
              Search
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <Input
                className="pl-9"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Name or nickname"
              />
            </div>
          </label>
          <MemberField label="Status">
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All</option>
              {statusOptionsForForms.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </Select>
          </MemberField>
        </div>
        <Button type="button" variant="primary" onClick={addMember}>
          <Plus className="h-4 w-4" />
          Add person
        </Button>
      </div>

      <div
        className={cn(
          "overflow-hidden rounded-[8px] border border-[#ededed] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.12)]",
          "divide-y divide-[#ededed] p-0",
        )}
      >
        {filteredMembers.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No members match this filter.</p>
        ) : (
          filteredMembers.map((member) => {
            const isEditing = editingMemberId === member.id;
            const fullName = getMemberFullName(member);
            return (
              <div
                className={cn(
                  "px-4 py-4 sm:px-5",
                  member.status !== "active" && "opacity-75",
                )}
                key={member.id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <div
                      aria-hidden
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-md border text-xs font-bold",
                        themeStyles[member.colorTheme] ?? themeStyles.blue,
                      )}
                    >
                      {getMemberInitials(member)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold leading-snug break-words text-[#1f1f1f]">
                        {fullName}
                      </h3>
                      {member.nickname ? (
                        <p className="mt-0.5 text-sm text-slate-500">“{member.nickname}”</p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge tone={member.status === "active" ? "green" : "neutral"}>
                          {member.status}
                        </Badge>
                        {member.pinCode ? (
                          <Badge tone="blue">PIN set</Badge>
                        ) : (
                          <Badge tone="neutral">No PIN</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditingMemberId(isEditing ? undefined : member.id)}
                  >
                    {isEditing ? "Close editor" : "Edit"}
                  </Button>
                </div>
                {isEditing ? (
                  <div className="mt-4">
                    <MemberEditForm
                      ageGroupOptions={ageGroupOptionsForForms}
                      allMembers={data.familyMembers}
                      member={member}
                      onRemove={() => removeMember(member)}
                      onUpdate={(updates) => updateMember(member.id, updates)}
                      statusOptions={statusOptionsForForms}
                    />
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
