import { BookOpen, Pin, Plus } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  type DocCategory,
  type DocItem,
  type FamilyMember,
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
import { getDocCategories, getDocVisibilityOptions, mergeLists, selectOptionsWithCurrent } from "../lib/customization";
import { formatShortDate, getMemberFullName } from "../lib/utils";
import type { PageProps } from "./pageTypes";

const knowledgeSections: { title: string; category: DocCategory }[] = [
  { title: "Household rhythm", category: "routine" },
  { title: "School", category: "school" },
  { title: "Medical", category: "medical" },
  { title: "House", category: "house" },
  { title: "Emergency", category: "emergency" },
  { title: "Other", category: "other" },
];

const docTabs = [
  { id: "overview", label: "Overview" },
  { id: "pinned", label: "Pinned" },
  { id: "category", label: "By Category" },
  { id: "members", label: "Related Members" },
  { id: "projects", label: "Related workspace" },
  { id: "table", label: "Table" },
] as const;

type DocTab = (typeof docTabs)[number]["id"];

export function DocsPage({ data, setData }: PageProps) {
  const [activeTab, setActiveTab] = useState<DocTab>("overview");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [pinnedFilter, setPinnedFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const activeMembers = data.familyMembers.filter(
    (member) => member.status === "active",
  );
  const admin = data.adminSettings;
  const docCategoryOptions = useMemo(
    () => mergeLists(getDocCategories(admin), data.docs.map((d) => d.category)),
    [admin, data.docs],
  );
  const docVisibilityOptions = useMemo(
    () =>
      mergeLists(
        getDocVisibilityOptions(admin),
        data.docs.map((d) => d.visibility),
      ),
    [admin, data.docs],
  );

  const filteredDocs = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();
    return [...data.docs]
      .filter((doc) => {
        if (categoryFilter !== "all" && doc.category !== categoryFilter) {
          return false;
        }
        if (pinnedFilter === "pinned" && !doc.pinned) return false;
        if (pinnedFilter === "unpinned" && doc.pinned) return false;
        if (
          memberFilter !== "all" &&
          !doc.relatedMemberIds.includes(memberFilter)
        ) {
          return false;
        }
        if (!normalizedSearch) return true;
        return [
          doc.title,
          doc.content,
          doc.category,
          ...doc.tags,
        ].some((value) => value.toLowerCase().includes(normalizedSearch));
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [categoryFilter, data.docs, memberFilter, pinnedFilter, searchText]);

  const pinnedDocs = filteredDocs.filter((doc) => doc.pinned);
  const recentDocs = [...data.docs]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);
  const sectionDocs = knowledgeSections.map((section) => ({
    ...section,
    docs: filteredDocs.filter(
      (doc) => doc.category === section.category && !doc.pinned,
    ),
  }));

  function addDoc() {
    const now = new Date().toISOString();
    const docId = crypto.randomUUID();
    setData((current) => ({
      ...createActivity(current, {
        type: "created",
        entityType: "doc",
        entityId: docId,
        entityTitle: "New family note",
        message: "Created note: New family note.",
      }),
      docs: [
        ...current.docs,
        {
          id: docId,
          title: "New family note",
          content: "Add the key details here.",
          category: "other",
          tags: [],
          pinned: false,
          relatedMemberIds: [],
          relatedProjectId: "",
          visibility: "household",
          createdAt: now,
          updatedAt: now,
          source: "manual",
          body: "Add the key details here.",
        },
      ],
    }));
  }

  function updateDoc(id: string, updates: Partial<DocItem>) {
    setData((current) => {
      const doc = current.docs.find((item) => item.id === id);
      const nextData = {
        ...current,
        docs: current.docs.map((item) =>
          item.id === id
            ? { ...item, ...updates, updatedAt: new Date().toISOString() }
            : item,
        ),
      };

      if (!doc || !shouldLogDocUpdate(updates)) {
        return nextData;
      }

      return createActivity(nextData, {
        type: "updated",
        entityType: "doc",
        entityId: doc.id,
        entityTitle: doc.title,
        message: `Updated note: ${doc.title}.`,
      });
    });
  }

  return (
    <div className="motion-page space-y-5 sm:space-y-6">
      <ModuleWorkspaceHeader
        description="Keep household rhythm, school notes, medical references, emergency info, recipes, and shared references in one searchable workspace."
        eyebrow="Household reference"
        metrics={[
          { label: "Notes", value: data.docs.length },
          { label: "Pinned", value: data.docs.filter((doc) => doc.pinned).length },
          { label: "Emergency", value: data.docs.filter((doc) => doc.category === "emergency").length },
          { label: "Recent", value: recentDocs.length },
        ]}
        title="Notes / Knowledge hub"
      />

      <ModuleActionBar>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <Button onClick={addDoc} variant="primary">
            <Plus className="h-4 w-4" />
            Add note
          </Button>
          <div className="grid gap-3 lg:grid-cols-4">
            <HubField label="Search">
              <Input
                placeholder="Search title, details, or tags"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
            </HubField>
            <HubField label="Category">
              <Select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">All categories</option>
                {docCategoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </HubField>
            <HubField label="Pinned">
              <Select
                value={pinnedFilter}
                onChange={(event) => setPinnedFilter(event.target.value)}
              >
                <option value="all">All notes</option>
                <option value="pinned">Pinned only</option>
                <option value="unpinned">Unpinned only</option>
              </Select>
            </HubField>
            <HubField label="Related member">
              <Select
                value={memberFilter}
                onChange={(event) => setMemberFilter(event.target.value)}
              >
                <option value="all">All members</option>
                {activeMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {getMemberFullName(member)}
                  </option>
                ))}
              </Select>
            </HubField>
          </div>
        </div>
      </ModuleActionBar>

      <ModuleSubnav activeTab={activeTab} onChange={setActiveTab} tabs={[...docTabs]} />

      {activeTab === "overview" ? (
        <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
          <WorkspacePanel title="Overview" eyebrow="Knowledge summary">
            <div className="grid gap-3 md:grid-cols-4">
              <SummaryTile label="All notes" value={data.docs.length} />
              <SummaryTile label="Pinned" value={pinnedDocs.length} />
              <SummaryTile label="Categories" value={docCategoryOptions.length} />
              <SummaryTile label="Recent" value={recentDocs.length} />
            </div>
          </WorkspacePanel>
          <DocList
            activeMembers={activeMembers}
            docCategoryOptions={docCategoryOptions}
            docVisibilityOptions={docVisibilityOptions}
            docs={recentDocs}
            emptyText="Recently updated notes will show here."
            projects={data.projects}
            title="Recent notes"
            updateDoc={updateDoc}
          />
        </section>
      ) : activeTab === "pinned" ? (
        <DocList
          activeMembers={activeMembers}
          docCategoryOptions={docCategoryOptions}
          docVisibilityOptions={docVisibilityOptions}
          docs={pinnedDocs}
          emptyText="Pin important household references so they stay easy to find."
          projects={data.projects}
          title="Pinned"
          updateDoc={updateDoc}
        />
      ) : activeTab === "category" ? (
        <WorkspacePanel title="By Category" eyebrow="Grouped notes">
          <div className="space-y-5">
            {sectionDocs.map((section) => (
              <KnowledgeSection
                docs={section.docs}
                emptyText={`No ${section.title.toLowerCase()} notes yet.`}
                key={section.category}
                title={section.title}
              >
                {section.docs.map((doc) => (
                  <DocCard
                    activeMembers={activeMembers}
                    doc={doc}
                    docCategoryOptions={docCategoryOptions}
                    docVisibilityOptions={docVisibilityOptions}
                    key={doc.id}
                    projects={data.projects}
                    updateDoc={updateDoc}
                  />
                ))}
              </KnowledgeSection>
            ))}
          </div>
        </WorkspacePanel>
      ) : activeTab === "members" ? (
        <WorkspacePanel title="Related Members" eyebrow="Grouped notes">
          <div className="space-y-5">
            {activeMembers.map((member) => (
              <KnowledgeSection
                docs={filteredDocs.filter((doc) =>
                  doc.relatedMemberIds.includes(member.id),
                )}
                emptyText={`No notes are related to ${getMemberFullName(member)} yet.`}
                key={member.id}
                title={getMemberFullName(member)}
              >
                {filteredDocs
                  .filter((doc) => doc.relatedMemberIds.includes(member.id))
                  .map((doc) => (
                    <DocCard
                      activeMembers={activeMembers}
                      doc={doc}
                      docCategoryOptions={docCategoryOptions}
                      docVisibilityOptions={docVisibilityOptions}
                      key={doc.id}
                      projects={data.projects}
                      updateDoc={updateDoc}
                    />
                  ))}
              </KnowledgeSection>
            ))}
          </div>
        </WorkspacePanel>
      ) : activeTab === "projects" ? (
        <WorkspacePanel title="Related workspace" eyebrow="Grouped notes">
          <div className="space-y-5">
            {data.projects.map((project) => (
              <KnowledgeSection
                docs={filteredDocs.filter((doc) => doc.relatedProjectId === project.id)}
                emptyText={`No notes are related to ${project.title} yet.`}
                key={project.id}
                title={project.title}
              >
                {filteredDocs
                  .filter((doc) => doc.relatedProjectId === project.id)
                  .map((doc) => (
                    <DocCard
                      activeMembers={activeMembers}
                      doc={doc}
                      docCategoryOptions={docCategoryOptions}
                      docVisibilityOptions={docVisibilityOptions}
                      key={doc.id}
                      projects={data.projects}
                      updateDoc={updateDoc}
                    />
                  ))}
              </KnowledgeSection>
            ))}
          </div>
        </WorkspacePanel>
      ) : (
        <DocList
          activeMembers={activeMembers}
          docCategoryOptions={docCategoryOptions}
          docVisibilityOptions={docVisibilityOptions}
          docs={filteredDocs}
          emptyText="No knowledge notes match these filters."
          projects={data.projects}
          tableMode
          title="Table"
          updateDoc={updateDoc}
        />
      )}
    </div>
  );
}

function DocList({
  title,
  docs,
  activeMembers,
  projects,
  updateDoc,
  emptyText,
  docCategoryOptions,
  docVisibilityOptions,
  tableMode = false,
}: {
  title: string;
  docs: DocItem[];
  activeMembers: FamilyMember[];
  projects: { id: string; title: string }[];
  updateDoc: (id: string, updates: Partial<DocItem>) => void;
  emptyText: string;
  docCategoryOptions: string[];
  docVisibilityOptions: string[];
  tableMode?: boolean;
}) {
  return (
    <WorkspacePanel title={title} eyebrow={tableMode ? "Dense knowledge view" : "Knowledge cards"}>
      {docs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-slate-500">
          {emptyText}
        </div>
      ) : null}
      <div className={tableMode ? "grid gap-3" : "grid gap-4 xl:grid-cols-2"}>
        {docs.map((doc) => (
          <DocCard
            activeMembers={activeMembers}
            doc={doc}
            docCategoryOptions={docCategoryOptions}
            docVisibilityOptions={docVisibilityOptions}
            key={doc.id}
            projects={projects}
            updateDoc={updateDoc}
          />
        ))}
      </div>
    </WorkspacePanel>
  );
}

function DocCard({
  doc,
  activeMembers,
  projects,
  updateDoc,
  docCategoryOptions,
  docVisibilityOptions,
}: {
  doc: DocItem;
  activeMembers: FamilyMember[];
  projects: { id: string; title: string }[];
  updateDoc: (id: string, updates: Partial<DocItem>) => void;
  docCategoryOptions: string[];
  docVisibilityOptions: string[];
}) {
  const relatedMembers = activeMembers.filter((member) =>
    doc.relatedMemberIds.includes(member.id),
  );

  return (
    <div className="motion-card space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {doc.pinned ? <Pin className="h-4 w-4 text-blue-700" /> : null}
            <Badge tone="purple">{doc.category}</Badge>
            <Badge tone={doc.visibility === "private-note" ? "amber" : "neutral"}>
              {doc.visibility}
            </Badge>
          </div>
          <h3 className="mt-2 text-lg font-semibold text-slate-950">{doc.title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            Updated {formatShortDate(doc.updatedAt)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-100 p-2 text-blue-700">
          <BookOpen className="h-4 w-4" />
        </div>
      </div>

      {relatedMembers.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {relatedMembers.map((member) => (
            <Badge key={member.id} tone="blue">
              {getMemberFullName(member)}
            </Badge>
          ))}
        </div>
      ) : null}

      {doc.tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {doc.tags.map((tag) => (
            <Badge key={tag} tone="neutral">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <HubField label="Title">
          <Input
            value={doc.title}
            onChange={(event) => updateDoc(doc.id, { title: event.target.value })}
          />
        </HubField>
        <HubField label="Category">
          <Select
            value={doc.category}
            onChange={(event) =>
              updateDoc(doc.id, { category: event.target.value as DocCategory })
            }
          >
            {selectOptionsWithCurrent(docCategoryOptions, doc.category).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </HubField>
        <HubField label="Visibility">
          <Select
            value={doc.visibility}
            onChange={(event) =>
              updateDoc(doc.id, {
                visibility: event.target.value as DocItem["visibility"],
              })
            }
          >
            {selectOptionsWithCurrent(docVisibilityOptions, doc.visibility).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </Select>
        </HubField>
        <HubField label="Related project">
          <Select
            value={doc.relatedProjectId}
            onChange={(event) =>
              updateDoc(doc.id, { relatedProjectId: event.target.value })
            }
          >
            <option value="">No project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </Select>
        </HubField>
      </div>

      <HubField label="Details">
        <Textarea
          value={doc.content}
          onChange={(event) =>
            updateDoc(doc.id, {
              content: event.target.value,
              body: event.target.value,
            })
          }
        />
      </HubField>

      <HubField label="Tags">
        <Input
          value={doc.tags.join(", ")}
          onChange={(event) =>
            updateDoc(doc.id, {
              tags: event.target.value
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
            })
          }
        />
      </HubField>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex min-h-10 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
          <input
            checked={doc.pinned}
            className="h-4 w-4 accent-blue-500"
            onChange={(event) => updateDoc(doc.id, { pinned: event.target.checked })}
            type="checkbox"
          />
          Pin this doc
        </label>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Related members
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {activeMembers.map((member) => (
              <label
                className="motion-row flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                key={member.id}
              >
                <input
                  checked={doc.relatedMemberIds.includes(member.id)}
                  className="h-4 w-4 accent-blue-500"
                  onChange={(event) => {
                    const relatedMemberIds = event.target.checked
                      ? [...doc.relatedMemberIds, member.id]
                      : doc.relatedMemberIds.filter((id) => id !== member.id);
                    updateDoc(doc.id, { relatedMemberIds });
                  }}
                  type="checkbox"
                />
                {getMemberFullName(member)}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KnowledgeSection({
  title,
  docs,
  emptyText,
  children,
}: {
  title: string;
  docs: DocItem[];
  emptyText: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          {title}
        </p>
        <Badge tone="neutral">{docs.length}</Badge>
      </div>
      {docs.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">{children}</div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          {emptyText}
        </div>
      )}
    </section>
  );
}

function HubField({
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

function shouldLogDocUpdate(updates: Partial<DocItem>) {
  return Boolean(
    updates.category ||
      typeof updates.pinned === "boolean" ||
      updates.relatedMemberIds ||
      updates.relatedProjectId ||
      updates.visibility,
  );
}
