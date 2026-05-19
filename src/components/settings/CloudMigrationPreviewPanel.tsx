import { useMemo, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { Download, RefreshCw } from "lucide-react";
import { useAuth } from "../../auth";
import type { FamilyData } from "../../data/familyData";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "../../lib/supabaseClient";
import { Button } from "../ui/Button";
import { Card, CardHeader } from "../ui/Card";
import { createActivity } from "../../lib/activity";

type MigrationRowKey =
  | "admin_settings"
  | "family_members"
  | "tasks"
  | "task_checklist_items"
  | "task_reference_media"
  | "task_completion_proof"
  | "planner_events"
  | "planner_event_members"
  | "calendar_links"
  | "projects"
  | "docs"
  | "grocery_items"
  | "shopping_items"
  | "inventory_items"
  | "activity_log";

type PreviewRow = {
  key: MigrationRowKey;
  label: string;
  localCount: number;
  cloudCount?: number;
  status: "ready" | "needs_review" | "blocked";
  notes: string[];
};

function friendlySupabaseError(error: unknown): string {
  const pg = error as PostgrestError | null;
  const msg = (pg && typeof pg.message === "string" && pg.message.trim()) ? pg.message : "";
  if (!msg) {
    return "Cloud request failed. Check your connection and try again.";
  }
  if (msg.toLowerCase().includes("permission")) {
    return "Cloud permission denied. Your account may not have access to this household.";
  }
  if (msg.toLowerCase().includes("rls")) {
    return "Cloud access is blocked by household security rules. Ask an owner to verify access policies.";
  }
  return msg;
}

function isIsoDate(value?: string) {
  if (!value) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function looksLikeBase64(value?: string) {
  if (!value) return false;
  const v = value.trim();
  return v.startsWith("data:") || v.length > 200_000;
}

export function CloudMigrationPreviewPanel({
  data,
  setData,
  onExportBackup,
}: {
  data: FamilyData;
  setData: React.Dispatch<React.SetStateAction<FamilyData>>;
  onExportBackup: () => void;
}) {
  const { user, supabaseConfigured } = useAuth();
  const configured = supabaseConfigured && isSupabaseConfigured();
  const client = getSupabaseBrowserClient();

  const [, setRanAt] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [cloudCompareError, setCloudCompareError] = useState<string>("");
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [busy, setBusy] = useState(false);

  const connectedHouseholdId = (data.adminSettings.cloudHouseholdId ?? "").trim();

  const baseRows: PreviewRow[] = useMemo(() => {
    const mk = (key: MigrationRowKey, label: string, localCount: number): PreviewRow => ({
      key,
      label,
      localCount,
      status: "ready",
      notes: [],
    });
    return [
      mk("admin_settings", "Admin settings", 1),
      mk("family_members", "Family members", data.familyMembers.length),
      mk("tasks", "Cleaning & chores", data.tasks.length),
      mk(
        "task_checklist_items",
        "Task checklist items",
        data.tasks.reduce((sum, t) => sum + (t.checklist?.length ?? 0), 0),
      ),
      mk(
        "task_reference_media",
        "Task reference media (metadata)",
        data.tasks.reduce((sum, t) => sum + (t.referenceMedia?.length ?? 0), 0),
      ),
      mk(
        "task_completion_proof",
        "Completion proof (metadata)",
        data.tasks.reduce((sum, t) => sum + (t.completionProof?.length ?? 0), 0),
      ),
      mk("planner_events", "Planner events", data.planner.length),
      mk(
        "planner_event_members",
        "Planner event assignments",
        data.planner.reduce((sum, e) => sum + (e.assignedMemberIds?.length ?? 0), 0),
      ),
      mk("calendar_links", "Calendar links", data.calendarLinks.length),
      mk("projects", "Workspace records", data.projects.length),
      mk("docs", "Notes", data.docs.length),
      mk("grocery_items", "Grocery library", data.groceryItems.length),
      mk("shopping_items", "Shopping items", data.shopping.length),
      mk("inventory_items", "Inventory items", data.pantry.length),
      mk("activity_log", "Activity log", data.activityLog.length),
    ];
  }, [data]);

  function setRow(key: MigrationRowKey, updates: Partial<PreviewRow>) {
    setRows((current) => current.map((r) => (r.key === key ? { ...r, ...updates } : r)));
  }

  async function getCloudCount(table: string): Promise<number> {
    if (!client) {
      throw new Error("Client not available.");
    }
    const { count, error } = await client
      .from(table as any)
      .select("*", { head: true, count: "exact" })
      .eq("household_id", connectedHouseholdId);
    if (error) {
      throw error;
    }
    return count ?? 0;
  }

  async function runPreview() {
    setBusy(true);
    setMessage("");
    setCloudCompareError("");

    const now = new Date().toISOString();
    setRanAt(now);

    // Start with local scan
    const next: PreviewRow[] = baseRows.map((r) => ({
      ...r,
      notes: [],
      status: "ready",
    }));

    // Ready / needs review / blocked rules (dry-run only)
    // Block: suspiciously large/base64 text fields (future storage bucket only)
    const base64Refs = data.tasks.flatMap((t) =>
      (t.referenceMedia ?? []).filter((m) => looksLikeBase64(m.url)).map((m) => m.id),
    );
    if (base64Refs.length > 0) {
      const row = next.find((r) => r.key === "task_reference_media")!;
      row.status = "blocked";
      row.notes.push("One or more reference media URLs look like embedded base64. Upload media via storage in a later phase.");
    }

    const base64Proof = data.tasks.flatMap((t) =>
      (t.completionProof ?? []).filter((p) => looksLikeBase64(p.url)).map((p) => p.id),
    );
    if (base64Proof.length > 0) {
      const row = next.find((r) => r.key === "task_completion_proof")!;
      row.status = "blocked";
      row.notes.push("One or more proof URLs look like embedded base64. Upload media via storage in a later phase.");
    }

    // Needs review: invalid dates
    if (data.tasks.some((t) => !isIsoDate(t.dueDate) || !isIsoDate(t.nextDueDate))) {
      const row = next.find((r) => r.key === "tasks")!;
      row.status = row.status === "blocked" ? "blocked" : "needs_review";
      row.notes.push("Some tasks have non-YYYY-MM-DD due dates. Review date formatting before upload.");
    }
    if (data.planner.some((e) => !isIsoDate(e.date))) {
      const row = next.find((r) => r.key === "planner_events")!;
      row.status = row.status === "blocked" ? "blocked" : "needs_review";
      row.notes.push("Some planner events have non-YYYY-MM-DD dates. Review date formatting before upload.");
    }

    // Needs review: non-numeric inventory quantities
    if (data.pantry.some((i) => !/^(\d+(\.\d+)?)$/.test((i.quantity ?? "").trim()))) {
      const row = next.find((r) => r.key === "inventory_items")!;
      row.status = row.status === "blocked" ? "blocked" : "needs_review";
      row.notes.push("Some inventory quantities are not numeric (e.g. “½”, “a lot”). Cloud upload can keep text, but alerts and minimums may behave differently.");
    }

    // Needs review: tasks assigned member missing locally
    const memberIds = new Set(data.familyMembers.map((m) => m.id));
    if (data.tasks.some((t) => t.assignedMemberId && !memberIds.has(t.assignedMemberId))) {
      const row = next.find((r) => r.key === "tasks")!;
      row.status = row.status === "blocked" ? "blocked" : "needs_review";
      row.notes.push("Some tasks reference a missing assigned member ID. Upload will fall back to unassigned.");
    }

    // Block cloud compare if not connected
    const canCompare = configured && Boolean(user) && Boolean(connectedHouseholdId);
    setRows(next);

    if (canCompare) {
      try {
        // Lightweight cloud counts (no mutation)
        const tableMap: Record<MigrationRowKey, string> = {
          admin_settings: "admin_settings",
          family_members: "family_members",
          tasks: "tasks",
          task_checklist_items: "task_checklist_items",
          task_reference_media: "task_reference_media",
          task_completion_proof: "task_completion_proof",
          planner_events: "planner_events",
          planner_event_members: "planner_event_members",
          calendar_links: "calendar_links",
          projects: "projects",
          docs: "docs",
          grocery_items: "grocery_items",
          shopping_items: "shopping_items",
          inventory_items: "inventory_items",
          activity_log: "activity_log",
        };

        for (const r of next) {
          if (r.key === "admin_settings") {
            // admin_settings uses household_id PK; count is 0 or 1.
            const { count, error } = await client!
              .from("admin_settings")
              .select("*", { head: true, count: "exact" })
              .eq("household_id", connectedHouseholdId);
            if (error) throw error;
            setRow(r.key, { cloudCount: count ?? 0 });
            continue;
          }
          const cloudCount = await getCloudCount(tableMap[r.key]);
          setRow(r.key, { cloudCount });
        }
      } catch (error) {
        setCloudCompareError(friendlySupabaseError(error));
      }
    }

    setData((current) =>
      createActivity(
        {
          ...current,
          adminSettings: {
            ...current.adminSettings,
            lastCloudPreviewAt: now,
          },
        },
        {
          type: "updated",
          entityType: "data",
          entityId: "cloud-migration-preview",
          entityTitle: "Cloud migration preview",
          message: "Reviewed cloud migration preview.",
        },
      ),
    );

    setMessage(
      canCompare
        ? "Preview complete. This is a dry run only; no cloud records were changed."
        : "Preview complete. Connect a cloud household to compare cloud records.",
    );
    setBusy(false);
  }

  const readyCount = rows.filter((r) => r.status === "ready").length;
  const needsReviewCount = rows.filter((r) => r.status === "needs_review").length;
  const blockedCount = rows.filter((r) => r.status === "blocked").length;

  return (
    <Card>
      <CardHeader title="Cloud migration preview" eyebrow="Preview only" />
      <div className="space-y-4 text-sm text-slate-600">
        <p>
          This tool scans your current device data and shows what would be uploaded later. It does
          not upload, delete, or modify any cloud records.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Current data source</p>
            <p className="mt-2 text-base font-semibold text-slate-950">Saved on this device</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Cloud household</p>
            <p className="mt-2 text-base font-semibold text-slate-950">
              {connectedHouseholdId ? "Connected" : "Not connected"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Cloud sync</p>
            <p className="mt-2 text-base font-semibold text-slate-950">Preview only</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Last preview</p>
            <p className="mt-2 text-base font-semibold text-slate-950">
              {data.adminSettings.lastCloudPreviewAt
                ? new Date(data.adminSettings.lastCloudPreviewAt).toLocaleString()
                : "—"}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="font-medium text-amber-950">Export a backup before moving data to cloud.</p>
          <p className="mt-1 text-amber-950/90">
            Preview does not change anything, but upload will be enabled only after validation.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={onExportBackup} type="button" variant="secondary">
              <Download className="h-4 w-4" />
              Export backup
            </Button>
            <Button
              disabled={busy}
              onClick={() => void runPreview()}
              type="button"
              variant="primary"
            >
              <RefreshCw className="h-4 w-4" />
              Preview cloud migration
            </Button>
          </div>
        </div>

        {message ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">{message}</div>
        ) : null}

        {cloudCompareError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-900">
            {cloudCompareError}
          </div>
        ) : null}

        {rows.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-900">
                Ready: {readyCount}
              </span>
              <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-950">
                Needs review: {needsReviewCount}
              </span>
              <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-900">
                Blocked: {blockedCount}
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full min-w-[820px] border-collapse text-left text-sm text-slate-800">
                <thead className="border-b border-slate-200 bg-slate-50 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-600">
                  <tr>
                    <th className="px-3 py-2.5">Data type</th>
                    <th className="px-3 py-2.5">Local count</th>
                    <th className="px-3 py-2.5">Cloud count</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.key} className="border-t border-slate-100">
                      <td className="px-3 py-2.5 font-medium text-slate-900">{r.label}</td>
                      <td className="px-3 py-2.5 text-slate-600">{r.localCount}</td>
                      <td className="px-3 py-2.5 text-slate-600">
                        {configured && connectedHouseholdId ? (r.cloudCount ?? "—") : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">{r.status}</td>
                      <td className="px-3 py-2.5 text-slate-600">
                        {r.notes.length > 0 ? (
                          <ul className="list-inside list-disc space-y-1">
                            {r.notes.map((n) => (
                              <li key={n}>{n}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                Mapping plan (read-only)
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
                <li>familyMembers → family_members</li>
                <li>tasks → tasks</li>
                <li>task.checklist → task_checklist_items</li>
                <li>task.referenceMedia → task_reference_media</li>
                <li>task.completionProof → task_completion_proof</li>
                <li>planner → planner_events + planner_event_members</li>
                <li>calendarLinks → calendar_links</li>
                <li>projects → projects</li>
                <li>docs → docs</li>
                <li>groceryItems → grocery_items</li>
                <li>shopping → shopping_items</li>
                <li>pantry → inventory_items</li>
                <li>activityLog → activity_log</li>
                <li>adminSettings → admin_settings</li>
              </ul>
              <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <p className="font-medium">Upload to cloud (future)</p>
                <p className="mt-1 text-slate-600">
                  Cloud upload will be enabled after this preview is validated.
                </p>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </Card>
  );
}

