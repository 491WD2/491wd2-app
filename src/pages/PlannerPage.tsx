import { Plus } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { membersForAssignmentSelect } from "../lib/memberAssignment";
import type { FamilyMember, PlannerEvent } from "../data/familyData";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Field";
import {
  EmptyStatePanel,
  ModuleWorkspaceHeader,
} from "../components/workspace/ModuleWorkspace";
import { createActivity } from "../lib/activity";
import { getCalendarCategories, mergeLists, selectOptionsWithCurrent } from "../lib/customization";
import { getMemberFullName } from "../lib/utils";
import type { PageProps } from "./pageTypes";

export function PlannerPage({ data, setData }: PageProps) {
  const admin = data.adminSettings;
  const calendarCategoryOptions = useMemo(
    () => mergeLists(getCalendarCategories(admin), data.planner.map((e) => e.category)),
    [admin, data.planner],
  );
  function addEvent() {
    const eventId = crypto.randomUUID();
    setData((current) => ({
      ...createActivity(current, {
        type: "created",
        entityType: "planner",
        entityId: eventId,
        entityTitle: "New planner item",
        message: "Created planner item: New planner item.",
      }),
      planner: [
        ...current.planner,
        {
          id: eventId,
          title: "New planner item",
          date: new Date().toISOString().slice(0, 10),
          time: "16:00",
          category: "Family",
          assignedMemberId: "",
          assignedPerson: "Family",
        },
      ],
    }));
  }

  function updateEvent(id: string, updates: Partial<PlannerEvent>) {
    setData((current) => ({
      ...current,
      planner: current.planner.map((item) =>
        item.id === id ? { ...item, ...updates } : item,
      ),
    }));
  }

  return (
    <div className="motion-page space-y-5 sm:space-y-6">
      <ModuleWorkspaceHeader
        action={
          <Button onClick={addEvent} variant="primary">
            <Plus className="h-4 w-4" />
            Add event
          </Button>
        }
        description="Plan school, meals, appointments, and family commitments in one running list."
        eyebrow="Family schedule"
        title="Planner"
      />
      <section className="motion-panel rounded-lg border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-950/[0.04] sm:p-5">
        <div className="space-y-3">
          {data.planner.length === 0 ? (
            <EmptyStatePanel
              title="Nothing on the planner yet"
              text="Capture the next school block, meal plan, or appointment your household should see together."
              action={
                <Button onClick={addEvent} type="button" variant="primary">
                  <Plus className="h-4 w-4" />
                  Add event
                </Button>
              }
            />
          ) : null}
        {[...data.planner].sort(sortEvents).map((event) => (
          <div
            key={event.id}
            className="motion-card grid gap-3 rounded-lg border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_150px_130px_160px_170px]"
          >
            <PlannerField label="Title">
              <Input
                value={event.title}
                onChange={(change) =>
                  updateEvent(event.id, { title: change.target.value })
                }
              />
            </PlannerField>
            <PlannerField label="Date">
              <Input
                type="date"
                value={event.date}
                onChange={(change) =>
                  updateEvent(event.id, { date: change.target.value })
                }
              />
            </PlannerField>
            <PlannerField label="Time">
              <Input
                type="time"
                value={event.time}
                onChange={(change) =>
                  updateEvent(event.id, { time: change.target.value })
                }
              />
            </PlannerField>
            <PlannerField label="Category">
              <Select
                value={event.category}
                onChange={(change) =>
                  updateEvent(event.id, {
                    category: change.target.value as PlannerEvent["category"],
                  })
                }
              >
                {selectOptionsWithCurrent(calendarCategoryOptions, event.category).map(
                  (category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ),
                )}
              </Select>
            </PlannerField>
            <PlannerField label="Person">
              <Select
                value={getAssignedMember(event, data.familyMembers)?.id ?? ""}
                onChange={(change) => {
                  const roster = membersForAssignmentSelect(
                    data.familyMembers,
                    change.target.value,
                  );
                  const member = roster.find((item) => item.id === change.target.value);
                  updateEvent(event.id, {
                    assignedMemberId: change.target.value,
                    assignedMemberIds: change.target.value ? [change.target.value] : [],
                    assignedPerson: member
                      ? getMemberFullName(member)
                      : "Family",
                  });
                }}
              >
                <option value="">Unassigned</option>
                {membersForAssignmentSelect(
                  data.familyMembers,
                  event.assignedMemberId,
                  ...(event.assignedMemberIds ?? []),
                ).map((member) => (
                  <option key={member.id} value={member.id}>
                    {getMemberFullName(member)}
                  </option>
                ))}
              </Select>
            </PlannerField>
            <div className="lg:col-span-5">
              <Badge tone="blue">
                {event.category} · {formatAssignedMember(event, data.familyMembers)}
              </Badge>
            </div>
          </div>
        ))}
        </div>
      </section>
    </div>
  );
}

function getAssignedMember(event: PlannerEvent, members: FamilyMember[]) {
  const roster = membersForAssignmentSelect(
    members,
    event.assignedMemberId,
    ...(event.assignedMemberIds ?? []),
  );
  return (
    roster.find((member) => member.id === event.assignedMemberId) ??
    (!event.assignedMemberId
      ? members.find(
          (member) =>
            member.name.trim().toLowerCase() ===
            event.assignedPerson.trim().toLowerCase(),
        )
      : undefined)
  );
}

function formatAssignedMember(event: PlannerEvent, members: FamilyMember[]) {
  const member = getAssignedMember(event, members);

  if (member) {
    return getMemberFullName(member);
  }

  if (!event.assignedMemberId && event.assignedPerson !== "Family") {
    return event.assignedPerson;
  }

  return "Unassigned";
}

function sortEvents(a: PlannerEvent, b: PlannerEvent) {
  return `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`);
}

function PlannerField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
