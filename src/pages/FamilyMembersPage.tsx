import { ArrowUpRight, CalendarDays, ClipboardList, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { type FamilyMember } from "../data/familyData";
import {
  getMemberAgeGroups,
  getMemberStatuses,
  mergeLists,
} from "../lib/customization";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Field";
import { createActivity } from "../lib/activity";
import { cn, getMemberFullName, getMemberInitials } from "../lib/utils";
import type { PageProps } from "./pageTypes";
import {
  MemberEditForm,
  MemberField,
  shouldLogMemberUpdate,
} from "../components/family/memberEditShared";
import {
  EmptyStatePanel,
  ModuleWorkspaceHeader,
  WorkspaceFilterBar,
  WorkspacePageShell,
} from "../components/workspace/ModuleWorkspace";
import { useKioskShell } from "../components/layout/KioskShellContext";
import { WidgetPageShell } from "../components/widgets";
import { wrkMetricCellClassName, wrkPanelClassName } from "../components/workspace/workspaceDesign";

const themeStyles: Record<string, string> = {
  blue: "border-blue-400/25 bg-blue-500/10 text-blue-100",
  green: "border-emerald-400/25 bg-emerald-500/10 text-emerald-100",
  emerald: "border-emerald-400/25 bg-emerald-500/10 text-emerald-100",
  purple: "border-violet-400/25 bg-violet-500/12 text-violet-100",
  violet: "border-violet-400/25 bg-violet-500/12 text-violet-100",
  amber: "border-amber-400/28 bg-amber-500/10 text-amber-100",
  orange: "border-orange-400/28 bg-orange-500/10 text-orange-100",
  rose: "border-rose-400/25 bg-rose-500/10 text-rose-100",
  slate: "border-slate-500/30 bg-slate-500/10 text-slate-800",
};

export function FamilyMembersPage({
  data,
  setData,
  onOpenMemberDashboard,
  onOpenTasks,
  onOpenCalendar,
}: PageProps) {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortMode, setSortMode] = useState("name");
  const [editingMemberId, setEditingMemberId] = useState<string | undefined>();
  const kioskShell = useKioskShell();
  const today = new Date().toISOString().slice(0, 10);
  const admin = data.adminSettings;
  const statusOptionsForForms = useMemo(
    () => mergeLists(getMemberStatuses(admin), data.familyMembers.map((m) => m.status)),
    [admin, data.familyMembers],
  );
  const ageGroupOptionsForForms = useMemo(
    () => mergeLists(getMemberAgeGroups(admin), data.familyMembers.map((m) => m.ageGroup)),
    [admin, data.familyMembers],
  );
  const memberSummaries = data.familyMembers.map((member) => ({
    member,
    openResponsibilities: data.tasks.filter(
      (task) =>
        task.assignedMemberId === member.id &&
        task.status !== "Done" &&
        task.status !== "Completed",
    ),
    upcomingEvents: data.planner.filter(
      (event) =>
        (event.assignedMemberIds?.includes(member.id) ||
          event.assignedMemberId === member.id) &&
        event.date >= today,
    ),
  }));
  const filteredSummaries = memberSummaries
    .filter(({ member }) => {
      const query = searchText.trim().toLowerCase();
      const matchesSearch =
        !query ||
        member.name.toLowerCase().includes(query) ||
        (member.nickname ?? "").toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || member.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortMode === "responsibilities") {
        return b.openResponsibilities.length - a.openResponsibilities.length;
      }
      if (sortMode === "updated") {
        return (b.member.updatedAt ?? "").localeCompare(a.member.updatedAt ?? "");
      }
      return a.member.name.localeCompare(b.member.name);
    });

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
  }

  function updateMember(id: string, updates: Partial<FamilyMember>) {
    setData((current) => {
      const member = current.familyMembers.find((item) => item.id === id);
      const nextData = {
        ...current,
        familyMembers: current.familyMembers.map((item) =>
          item.id === id
            ? { ...item, ...updates, updatedAt: new Date().toISOString() }
            : item,
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
          familyMembers: current.familyMembers.filter(
            (item) => item.id !== member.id,
          ),
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
  }

  const roster = (
    <WorkspacePageShell>
      <ModuleWorkspaceHeader
        action={
          <Button onClick={addMember} variant="primary">
            <Plus className="h-4 w-4" />
            Add Member
          </Button>
        }
        description="Household directory, responsibilities, and personal pages."
        eyebrow="Household operations"
        metrics={[
          { label: "Household", value: data.familyMembers.length },
          {
            label: "Active",
            value: data.familyMembers.filter((m) => m.status === "active").length,
          },
          { label: "In view", value: filteredSummaries.length },
        ]}
        title="Members"
      />

      <WorkspaceFilterBar>
        <div className="mb-3">
          <h2 className="text-base font-semibold tracking-tight text-slate-900">Filter</h2>
          <p className="mt-1 text-sm text-slate-500">Search and narrow the roster.</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_160px_190px]">
          <label className="space-y-1">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Search by name
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <Input
                className="pl-9"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search household"
              />
            </div>
          </label>
          <MemberField label="Status">
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              {statusOptionsForForms.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </Select>
          </MemberField>
          <MemberField label="Sort">
            <Select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
              <option value="name">Name</option>
              <option value="responsibilities">Most open responsibilities</option>
              <option value="updated">Recently updated</option>
            </Select>
          </MemberField>
        </div>
      </WorkspaceFilterBar>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">Directory</h2>
          <p className="mt-1 text-sm text-slate-500">
            {filteredSummaries.length} member{filteredSummaries.length === 1 ? "" : "s"} in this view.
          </p>
        </div>
        <div className={cn(wrkPanelClassName, "overflow-hidden p-0")}>
          {filteredSummaries.length === 0 ? (
            <div className="p-5">
              <EmptyStatePanel
                title="No one matches this filter"
                text="Clear search or status filters, or add a member from Settings → Members & PINs."
              />
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {filteredSummaries.map(
                ({
                  member,
                  openResponsibilities,
                  upcomingEvents,
                }) => {
                  const nextItem = getNextMemberItem(openResponsibilities, upcomingEvents);
                  const isEditing = editingMemberId === member.id;
                  const fullName = getMemberFullName(member);
                  return (
                    <div
                      className={cn(
                        "px-4 py-5 sm:px-6",
                        member.status !== "active" && "opacity-75",
                      )}
                      key={member.id}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 flex-1 gap-3">
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
                            <button
                              className="text-left"
                              onClick={() => onOpenMemberDashboard?.(member.id)}
                              type="button"
                            >
                              <h3 className="text-base font-semibold leading-snug text-slate-950 break-words">
                                {fullName}
                              </h3>
                              {member.nickname ? (
                                <p className="mt-0.5 text-sm text-slate-500">
                                  “{member.nickname}”
                                </p>
                              ) : null}
                            </button>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge tone={member.status === "active" ? "green" : "neutral"}>
                                {member.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="grid shrink-0 gap-2 sm:grid-cols-2 sm:gap-3 lg:w-[220px]">
                          <DirectoryMetric label="Tasks" value={openResponsibilities.length} />
                          <DirectoryMetric label="Events" value={upcomingEvents.length} />
                        </div>
                      </div>
                      <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 ring-1 ring-slate-950/[0.04]">
                        Next: {nextItem}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button onClick={() => onOpenMemberDashboard?.(member.id)} variant="primary">
                          <ArrowUpRight className="h-4 w-4" />
                          Open profile
                        </Button>
                        <Button onClick={() => setEditingMemberId(isEditing ? undefined : member.id)} variant="secondary">
                          Edit member
                        </Button>
                        <Button onClick={onOpenTasks} variant="secondary">
                          <ClipboardList className="h-4 w-4" />
                          Add task
                        </Button>
                        <Button onClick={onOpenCalendar} variant="secondary">
                          <CalendarDays className="h-4 w-4" />
                          Add event
                        </Button>
                      </div>
                      {isEditing ? (
                        <MemberEditForm
                          ageGroupOptions={ageGroupOptionsForForms}
                          allMembers={data.familyMembers}
                          member={member}
                          onRemove={() => removeMember(member)}
                          onUpdate={(updates) => updateMember(member.id, updates)}
                          statusOptions={statusOptionsForForms}
                        />
                      ) : null}
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>
      </section>
    </WorkspacePageShell>
  );

  return kioskShell ? <WidgetPageShell>{roster}</WidgetPageShell> : roster;
}

function DirectoryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className={cn("motion-card", wrkMetricCellClassName)}>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-slate-950">{value}</p>
    </div>
  );
}

function getNextMemberItem(
  tasks: Array<{ title: string; dueDate: string; nextDueDate: string; type: string }>,
  events: Array<{ title: string; date: string }>,
) {
  const nextTask = [...tasks].sort((a, b) =>
    getTaskDate(a).localeCompare(getTaskDate(b)),
  )[0];
  const nextEvent = [...events].sort((a, b) => a.date.localeCompare(b.date))[0];

  if (nextTask && (!nextEvent || getTaskDate(nextTask) <= nextEvent.date)) {
    return nextTask.title;
  }

  if (nextEvent) {
    return nextEvent.title;
  }

  return "No upcoming household item";
}

function getTaskDate(task: { dueDate: string; nextDueDate: string; type: string }) {
  return task.type === "chore" ? task.nextDueDate || task.dueDate : task.dueDate;
}
