import { Plus } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  membersForAssignmentSelect,
  ownerLabelForAssignment,
  resolveAssignmentMember,
} from "../lib/memberAssignment";
import type {
  FamilyMember,
  Project,
  ProjectMilestone,
  ProjectPriority,
  ProjectStatus,
} from "../data/familyData";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input, Select, Textarea } from "../components/ui/Field";
import {
  ModuleActionBar,
  ModuleSubnav,
  ModuleWorkspaceHeader,
  SummaryTile,
  WorkspacePanel,
} from "../components/workspace/ModuleWorkspace";
import { createActivity } from "../lib/activity";
import { formatShortDate, getMemberFullName } from "../lib/utils";
import { getProjectPriorities, getProjectStatuses, mergeLists, selectOptionsWithCurrent } from "../lib/customization";
import type { PageProps } from "./pageTypes";

const milestoneStatuses: ProjectMilestone["status"][] = [
  "not-started",
  "active",
  "done",
];

const projectTabs = [
  { id: "overview", label: "Overview" },
  { id: "active", label: "Active" },
  { id: "waiting", label: "Waiting" },
  { id: "lead", label: "By Lead" },
  { id: "priority", label: "By Priority" },
  { id: "milestones", label: "Milestones" },
  { id: "table", label: "Table" },
] as const;

type ProjectTab = (typeof projectTabs)[number]["id"];

export function ProjectsPage({
  data,
  setData,
  onOpenMemberDashboard,
}: PageProps) {
  const admin = data.adminSettings;
  const projectStatusOptions = useMemo(
    () => mergeLists(getProjectStatuses(admin), data.projects.map((p) => p.status)),
    [admin, data.projects],
  );
  const projectPriorityOptions = useMemo(
    () => mergeLists(getProjectPriorities(admin), data.projects.map((p) => p.priority)),
    [admin, data.projects],
  );
  const [activeTab, setActiveTab] = useState<ProjectTab>("overview");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [leadFilter, setLeadFilter] = useState("all");
  const today = new Date().toISOString().slice(0, 10);
  const projectLeadRoster = useMemo(
    () =>
      membersForAssignmentSelect(
        data.familyMembers,
        ...data.projects.map((p) => p.leadMemberId),
      ),
    [data.familyMembers, data.projects],
  );
  const activeProjects = data.projects.filter((project) => project.status === "active");
  const waitingProjects = data.projects.filter(
    (project) => project.status === "waiting",
  );
  const highPriorityProjects = data.projects.filter(
    (project) => project.priority === "high",
  );
  const dueSoonProjects = data.projects.filter((project) =>
    isProjectDueSoon(project, today),
  );
  const completedRecently = data.projects.filter(
    (project) => project.status === "done" && project.completedDate,
  );
  const filteredProjects = data.projects.filter((project) => {
    if (activeTab === "active" && project.status !== "active") return false;
    if (activeTab === "waiting" && project.status !== "waiting") return false;
    if (statusFilter !== "all" && project.status !== statusFilter) return false;
    if (priorityFilter !== "all" && project.priority !== priorityFilter) return false;
    if (leadFilter !== "all" && project.leadMemberId !== leadFilter) return false;
    return true;
  });

  function addProject() {
    const now = new Date().toISOString();
    const projectId = crypto.randomUUID();
    setData((current) => ({
      ...createActivity(current, {
        type: "created",
        entityType: "project",
        entityId: projectId,
        entityTitle: "New family project",
        message: "Created project: New family project.",
      }),
      projects: [
        ...current.projects,
        {
          id: projectId,
          title: "New family project",
          description: "",
          name: "New family project",
          lead: "Family",
          leadMemberId: "",
          status: "planned",
          priority: "medium",
          startDate: new Date().toISOString().slice(0, 10),
          targetDate: "",
          completedDate: "",
          milestones: [],
          tags: [],
          notes: "",
          createdAt: now,
          updatedAt: now,
          nextStep: "Define the next useful step",
        },
      ],
    }));
  }

  function updateProject(id: string, updates: Partial<Project>) {
    setData((current) => {
      const project = current.projects.find((item) => item.id === id);
      const nextData = {
        ...current,
        projects: current.projects.map((item) =>
          item.id === id
            ? { ...item, ...updates, updatedAt: new Date().toISOString() }
            : item,
        ),
      };

      if (!project || !shouldLogProjectUpdate(updates)) {
        return nextData;
      }

      return createActivity(nextData, {
        type: updates.leadMemberId ? "assigned" : "updated",
        entityType: "project",
        entityId: project.id,
        entityTitle: project.title,
        memberId: updates.leadMemberId || undefined,
        message: `Updated project: ${project.title}.`,
      });
    });
  }

  function addMilestone(project: Project) {
    updateProject(project.id, {
      milestones: [
        ...project.milestones,
        {
          id: crypto.randomUUID(),
          title: "New milestone",
          status: "not-started",
          dueDate: "",
          notes: "",
        },
      ],
    });
  }

  function updateMilestone(
    project: Project,
    milestoneId: string,
    updates: Partial<ProjectMilestone>,
  ) {
    updateProject(project.id, {
      milestones: project.milestones.map((milestone) =>
        milestone.id === milestoneId ? { ...milestone, ...updates } : milestone,
      ),
    });
  }

  return (
    <div className="motion-page space-y-5 sm:space-y-6">
      <ModuleWorkspaceHeader
        description="Track household projects, school/admin work, repairs, milestones, ownership, and priority from a database-style workspace."
        eyebrow="Projects workspace"
        metrics={[
          { label: "Active", value: activeProjects.length },
          { label: "Waiting", value: waitingProjects.length },
          { label: "High", value: highPriorityProjects.length },
          { label: "Due soon", value: dueSoonProjects.length },
        ]}
        title="Projects"
      />

      <ModuleActionBar>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <Button onClick={addProject} variant="primary">
            <Plus className="h-4 w-4" />
            Add project
          </Button>
          <div className="grid gap-3 md:grid-cols-3">
            <ProjectField label="Status">
              <Select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All statuses</option>
                {projectStatusOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </Select>
            </ProjectField>
            <ProjectField label="Priority">
              <Select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
              >
                <option value="all">All priorities</option>
                {projectPriorityOptions.map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </Select>
            </ProjectField>
            <ProjectField label="Lead member">
              <Select
                value={leadFilter}
                onChange={(event) => setLeadFilter(event.target.value)}
              >
                <option value="all">All leads</option>
                <option value="">Unassigned</option>
                {projectLeadRoster.map((member) => (
                  <option key={member.id} value={member.id}>
                    {getMemberFullName(member)}
                  </option>
                ))}
              </Select>
            </ProjectField>
          </div>
        </div>
      </ModuleActionBar>

      <ModuleSubnav
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[...projectTabs]}
      />

      {activeTab === "overview" ? (
        <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
          <WorkspacePanel title="Overview" eyebrow="Workflow summary">
            <div className="grid gap-3 md:grid-cols-5">
              <SummaryTile label="Active" value={activeProjects.length} />
              <SummaryTile label="Waiting" value={waitingProjects.length} />
              <SummaryTile label="High" value={highPriorityProjects.length} />
              <SummaryTile label="Due soon" value={dueSoonProjects.length} />
              <SummaryTile label="Done" value={completedRecently.length} />
            </div>
          </WorkspacePanel>
          <MilestonesPanel projects={data.projects} />
        </section>
      ) : null}

      {activeTab === "lead" ? (
        <GroupedProjects
          addMilestone={addMilestone}
          familyMembers={data.familyMembers}
          groups={[
            ...projectLeadRoster.map((member) => ({
              label: getMemberFullName(member),
              projects: data.projects.filter(
                (project) => project.leadMemberId === member.id,
              ),
            })),
            {
              label: "Unassigned",
              projects: data.projects.filter((project) => !project.leadMemberId),
            },
          ]}
          onOpenMemberDashboard={onOpenMemberDashboard}
          priorityOptions={projectPriorityOptions}
          projectStatusOptions={projectStatusOptions}
          updateMilestone={updateMilestone}
          updateProject={updateProject}
        />
      ) : activeTab === "priority" ? (
        <GroupedProjects
          familyMembers={data.familyMembers}
          addMilestone={addMilestone}
          groups={projectPriorityOptions.map((priority) => ({
            label: priority,
            projects: data.projects.filter((project) => project.priority === priority),
          }))}
          onOpenMemberDashboard={onOpenMemberDashboard}
          priorityOptions={projectPriorityOptions}
          projectStatusOptions={projectStatusOptions}
          updateMilestone={updateMilestone}
          updateProject={updateProject}
        />
      ) : activeTab === "milestones" ? (
        <MilestonesPanel projects={data.projects} />
      ) : activeTab !== "overview" ? (
        <ProjectGrid
          familyMembers={data.familyMembers}
          addMilestone={addMilestone}
          onOpenMemberDashboard={onOpenMemberDashboard}
          priorityOptions={projectPriorityOptions}
          projects={filteredProjects}
          projectStatusOptions={projectStatusOptions}
          tableMode={activeTab === "table"}
          updateMilestone={updateMilestone}
          updateProject={updateProject}
        />
      ) : null}
    </div>
  );
}

function ProjectCard({
  project,
  familyMembers,
  updateProject,
  addMilestone,
  updateMilestone,
  onOpenMemberDashboard,
  projectStatusOptions,
  priorityOptions,
}: {
  project: Project;
  familyMembers: FamilyMember[];
  updateProject: (id: string, updates: Partial<Project>) => void;
  addMilestone: (project: Project) => void;
  updateMilestone: (
    project: Project,
    milestoneId: string,
    updates: Partial<ProjectMilestone>,
  ) => void;
  onOpenMemberDashboard?: (memberId: string) => void;
  projectStatusOptions: string[];
  priorityOptions: string[];
}) {
  const leadRoster = membersForAssignmentSelect(
    familyMembers,
    project.leadMemberId,
  );
  const leadMember = resolveAssignmentMember(leadRoster, project.leadMemberId);
  const doneMilestones = project.milestones.filter(
    (milestone) => milestone.status === "done",
  ).length;
  const milestoneProgress = `${doneMilestones}/${project.milestones.length}`;

  return (
    <div className="motion-card space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          {leadMember && onOpenMemberDashboard ? (
            <button
              className="motion-button text-xs uppercase tracking-[0.16em] text-slate-500 hover:text-blue-700"
              onClick={() => onOpenMemberDashboard(leadMember.id)}
              type="button"
            >
              {leadMember.name}
            </button>
          ) : (
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
              {leadMember
                ? leadMember.name
                : project.lead || "Unassigned"}
            </p>
          )}
          <h3 className="mt-1 text-lg font-semibold text-slate-950">
            {project.title}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Target: {formatShortDate(project.targetDate)} · Milestones{" "}
            {milestoneProgress}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Badge tone={project.status === "active" ? "blue" : "neutral"}>
            {project.status}
          </Badge>
          <Badge tone={project.priority === "high" ? "amber" : "neutral"}>
            {project.priority}
          </Badge>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ProjectField label="Title">
          <Input
            value={project.title}
            onChange={(event) =>
              updateProject(project.id, {
                title: event.target.value,
                name: event.target.value,
              })
            }
          />
        </ProjectField>
        <ProjectField label="Lead member">
          <Select
            value={project.leadMemberId ?? ""}
            onChange={(event) => {
              const id = event.target.value;
              updateProject(project.id, {
                leadMemberId: id,
                lead: ownerLabelForAssignment(
                  membersForAssignmentSelect(familyMembers, id),
                  id,
                  "Family",
                ),
              });
            }}
          >
            <option value="">Unassigned</option>
            {leadRoster.map((member) => (
              <option key={member.id} value={member.id}>
                {getMemberFullName(member)}
              </option>
            ))}
          </Select>
        </ProjectField>
        <ProjectField label="Status">
          <Select
            value={project.status}
            onChange={(event) =>
              updateProject(project.id, {
                status: event.target.value as ProjectStatus,
                completedDate:
                  event.target.value === "done"
                    ? new Date().toISOString().slice(0, 10)
                    : project.completedDate,
              })
            }
          >
            {selectOptionsWithCurrent(projectStatusOptions, project.status).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </ProjectField>
        <ProjectField label="Priority">
          <Select
            value={project.priority}
            onChange={(event) =>
              updateProject(project.id, {
                priority: event.target.value as ProjectPriority,
              })
            }
          >
            {selectOptionsWithCurrent(priorityOptions, project.priority).map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </Select>
        </ProjectField>
        <ProjectField label="Start date">
          <Input
            type="date"
            value={project.startDate}
            onChange={(event) =>
              updateProject(project.id, { startDate: event.target.value })
            }
          />
        </ProjectField>
        <ProjectField label="Target date">
          <Input
            type="date"
            value={project.targetDate}
            onChange={(event) =>
              updateProject(project.id, { targetDate: event.target.value })
            }
          />
        </ProjectField>
      </div>
      <ProjectField label="Description">
        <Textarea
          value={project.description}
          onChange={(event) =>
            updateProject(project.id, { description: event.target.value })
          }
        />
      </ProjectField>
      <ProjectField label="Tags">
        <Input
          value={project.tags.join(", ")}
          onChange={(event) =>
            updateProject(project.id, {
              tags: event.target.value
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
            })
          }
        />
      </ProjectField>
      <ProjectField label="Notes">
        <Textarea
          value={project.notes}
          onChange={(event) =>
            updateProject(project.id, { notes: event.target.value })
          }
        />
      </ProjectField>

      <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Milestones {milestoneProgress}
          </p>
          <Button onClick={() => addMilestone(project)} variant="secondary">
            Add milestone
          </Button>
        </div>
        {project.milestones.length === 0 ? (
          <p className="text-sm text-slate-500">No milestones yet.</p>
        ) : null}
        {project.milestones.map((milestone) => (
          <div
            className="motion-row grid gap-2 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[1fr_130px_130px]"
            key={milestone.id}
          >
            <Input
              value={milestone.title}
              onChange={(event) =>
                updateMilestone(project, milestone.id, {
                  title: event.target.value,
                })
              }
            />
            <Select
              value={milestone.status}
              onChange={(event) =>
                updateMilestone(project, milestone.id, {
                  status: event.target.value as ProjectMilestone["status"],
                })
              }
            >
              {milestoneStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </Select>
            <Input
              type="date"
              value={milestone.dueDate}
              onChange={(event) =>
                updateMilestone(project, milestone.id, {
                  dueDate: event.target.value,
                })
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectGrid({
  projects,
  familyMembers,
  updateProject,
  addMilestone,
  updateMilestone,
  onOpenMemberDashboard,
  projectStatusOptions,
  priorityOptions,
  tableMode = false,
}: {
  projects: Project[];
  familyMembers: FamilyMember[];
  updateProject: (id: string, updates: Partial<Project>) => void;
  addMilestone: (project: Project) => void;
  updateMilestone: (
    project: Project,
    milestoneId: string,
    updates: Partial<ProjectMilestone>,
  ) => void;
  onOpenMemberDashboard?: (memberId: string) => void;
  projectStatusOptions: string[];
  priorityOptions: string[];
  tableMode?: boolean;
}) {
  return (
    <WorkspacePanel
      eyebrow={tableMode ? "Dense management view" : "Editable project cards"}
      title={tableMode ? "Table" : "Projects"}
    >
      <div className={tableMode ? "grid gap-3" : "grid gap-4 xl:grid-cols-2"}>
        {projects.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-slate-500">
            No projects match these filters.
          </div>
        ) : null}
        {projects.map((project) => (
          <ProjectCard
            addMilestone={addMilestone}
            familyMembers={familyMembers}
            key={project.id}
            onOpenMemberDashboard={onOpenMemberDashboard}
            priorityOptions={priorityOptions}
            project={project}
            projectStatusOptions={projectStatusOptions}
            updateMilestone={updateMilestone}
            updateProject={updateProject}
          />
        ))}
      </div>
    </WorkspacePanel>
  );
}

function GroupedProjects({
  groups,
  familyMembers,
  updateProject,
  addMilestone,
  updateMilestone,
  onOpenMemberDashboard,
  projectStatusOptions,
  priorityOptions,
}: {
  groups: Array<{ label: string; projects: Project[] }>;
  familyMembers: FamilyMember[];
  updateProject: (id: string, updates: Partial<Project>) => void;
  addMilestone: (project: Project) => void;
  updateMilestone: (
    project: Project,
    milestoneId: string,
    updates: Partial<ProjectMilestone>,
  ) => void;
  onOpenMemberDashboard?: (memberId: string) => void;
  projectStatusOptions: string[];
  priorityOptions: string[];
}) {
  return (
    <WorkspacePanel title="Grouped Projects" eyebrow="Database grouping">
      <div className="space-y-5">
        {groups.map((group) => (
          <section className="space-y-3" key={group.label}>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold capitalize text-slate-700">
              {group.label} · {group.projects.length}
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {group.projects.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-slate-500">
                  No projects here yet.
                </div>
              ) : null}
              {group.projects.map((project) => (
                <ProjectCard
                  addMilestone={addMilestone}
                  familyMembers={familyMembers}
                  key={project.id}
                  onOpenMemberDashboard={onOpenMemberDashboard}
                  priorityOptions={priorityOptions}
                  project={project}
                  projectStatusOptions={projectStatusOptions}
                  updateMilestone={updateMilestone}
                  updateProject={updateProject}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </WorkspacePanel>
  );
}

function MilestonesPanel({ projects }: { projects: Project[] }) {
  const milestones = projects.flatMap((project) =>
    project.milestones.map((milestone) => ({ project, milestone })),
  );

  return (
    <WorkspacePanel title="Milestones" eyebrow="Project next steps">
      <div className="space-y-2">
        {milestones.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-slate-500">
            Milestones will show here after they are added to projects.
          </div>
        ) : null}
        {milestones.map(({ project, milestone }) => (
          <div
            className="motion-row flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3"
            key={`${project.id}-${milestone.id}`}
          >
            <div>
              <p className="font-medium text-slate-900">{milestone.title}</p>
              <p className="text-sm text-slate-500">
                {project.title} · due {formatShortDate(milestone.dueDate)}
              </p>
            </div>
            <Badge tone={milestone.status === "done" ? "green" : "neutral"}>
              {milestone.status}
            </Badge>
          </div>
        ))}
      </div>
    </WorkspacePanel>
  );
}

function ProjectField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="w-full space-y-1">
      <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function shouldLogProjectUpdate(updates: Partial<Project>) {
  return Boolean(
    updates.status ||
      updates.priority ||
      updates.leadMemberId ||
      updates.targetDate,
  );
}

function isProjectDueSoon(project: Project, today: string) {
  if (
    project.status === "done" ||
    project.status === "archived" ||
    !project.targetDate
  ) {
    return false;
  }

  const due = new Date(`${project.targetDate}T00:00:00`);
  const start = new Date(`${today}T00:00:00`);
  const threshold = new Date(start);
  threshold.setDate(threshold.getDate() + 14);

  return due >= start && due <= threshold;
}
