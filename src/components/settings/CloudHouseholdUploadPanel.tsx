import { useEffect, useMemo, useState } from "react";
import type React from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { Download, Plus } from "lucide-react";
import { useAuth } from "../../auth";
import type { FamilyData } from "../../data/familyData";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "../../lib/supabaseClient";
import { Button } from "../ui/Button";
import { Card, CardHeader } from "../ui/Card";
import { Input } from "../ui/Field";

type HouseholdMembership = {
  householdId: string;
  householdName: string;
  role: string;
};

type UploadRow = {
  key:
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
  label: string;
  localCount: number;
  uploadedCount: number;
  skippedCount: number;
  errorCount: number;
  status: "ready" | "uploading" | "completed" | "failed" | "skipped";
  error?: string;
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

function formatTimestamp(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

export function CloudHouseholdUploadPanel({
  data,
  setData,
  onExportBackup,
}: {
  data: FamilyData;
  setData: React.Dispatch<React.SetStateAction<FamilyData>>;
  onExportBackup: () => void;
}) {
  const { user, supabaseConfigured, loading } = useAuth();
  const configured = supabaseConfigured && isSupabaseConfigured();
  const client = getSupabaseBrowserClient();

  const [memberships, setMemberships] = useState<HouseholdMembership[]>([]);
  const [loadingMemberships, setLoadingMemberships] = useState(false);
  const [membershipError, setMembershipError] = useState<string>("");

  const [newHouseholdName, setNewHouseholdName] = useState("");
  const [newHouseholdLabel, setNewHouseholdLabel] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [createMessage, setCreateMessage] = useState("");

  const [previewRan, setPreviewRan] = useState(false);
  const [previewIssues, setPreviewIssues] = useState<string[]>([]);

  const [confirmUpload, setConfirmUpload] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<string>("");
  const [rows, setRows] = useState<UploadRow[]>([]);

  const connectedHouseholdId = (data.adminSettings.cloudHouseholdId ?? "").trim();
  const connectedMembership = memberships.find((m) => m.householdId === connectedHouseholdId);
  const cloudStatus = !configured
    ? "Not configured"
    : !user
      ? "Not signed in"
      : connectedMembership
        ? "Connected"
        : memberships.length > 0
          ? "Needs setup"
          : "Not connected";

  const baseRows: UploadRow[] = useMemo(() => {
    const mk = (key: UploadRow["key"], label: string, localCount: number): UploadRow => ({
      key,
      label,
      localCount,
      uploadedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      status: "ready",
    });
    return [
      mk("admin_settings", "Settings", 1),
      mk("family_members", "Family members", data.familyMembers.length),
      mk("tasks", "Tasks & chores", data.tasks.length),
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
        "Task completion proof (metadata)",
        data.tasks.reduce((sum, t) => sum + (t.completionProof?.length ?? 0), 0),
      ),
      mk("planner_events", "Calendar events", data.planner.length),
      mk(
        "planner_event_members",
        "Calendar event assignments",
        data.planner.reduce((sum, e) => sum + (e.assignedMemberIds?.length ?? 0), 0),
      ),
      mk("calendar_links", "Calendar links", data.calendarLinks.length),
      mk("projects", "Workspace records", data.projects.length),
      mk("docs", "Notes", data.docs.length),
      mk("grocery_items", "Grocery library", data.groceryItems.length),
      mk("shopping_items", "Shopping list", data.shopping.length),
      mk("inventory_items", "Inventory items", data.pantry.length),
      mk("activity_log", "Activity log", data.activityLog.length),
    ];
  }, [data]);

  useEffect(() => {
    if (!configured || !user || !client) {
      setMemberships([]);
      setMembershipError("");
      return;
    }

    const c = client;
    const u = user;

    let cancelled = false;
    setLoadingMemberships(true);
    setMembershipError("");

    async function load() {
      const { data: rows, error } = await c
        .from("household_members")
        .select("household_id, role, households:households(id, name)")
        .eq("user_id", u.id);

      if (cancelled) return;

      if (error) {
        setMembershipError(friendlySupabaseError(error));
        setMemberships([]);
        setLoadingMemberships(false);
        return;
      }

      const next: HouseholdMembership[] = (rows ?? [])
        .map((row: any) => ({
          householdId: row.household_id as string,
          householdName: row.households?.name ? String(row.households.name) : "Household",
          role: row.role ? String(row.role) : "member",
        }))
        .filter((m) => Boolean(m.householdId));
      setMemberships(next);
      setLoadingMemberships(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [client, configured, user]);

  function setConnectedHousehold(m: HouseholdMembership) {
    setData((current) => ({
      ...current,
      adminSettings: {
        ...current.adminSettings,
        cloudHouseholdId: m.householdId,
        cloudHouseholdName: m.householdName,
        cloudHouseholdRole: m.role,
      },
    }));
    setPreviewRan(false);
    setPreviewIssues([]);
    setRows([]);
    setUploadSummary("");
    setConfirmUpload(false);
  }

  async function createHousehold() {
    setCreateMessage("");
    if (!configured || !user || !client) {
      setCreateMessage("Sign in first to create a cloud household.");
      return;
    }
    const name = newHouseholdName.trim();
    if (!name) {
      setCreateMessage("Household name is required.");
      return;
    }
    setCreateBusy(true);
    try {
      const { data: household, error: householdError } = await client
        .from("households")
        .insert({
          name,
          metadata: newHouseholdLabel.trim()
            ? { displayLabel: newHouseholdLabel.trim() }
            : {},
        })
        .select("id, name")
        .single();

      if (householdError || !household) {
        throw householdError ?? new Error("Household create failed.");
      }

      const { error: memberError } = await client.from("household_members").insert({
        household_id: household.id,
        user_id: user.id,
        role: "owner",
      });

      if (memberError) {
        throw memberError;
      }

      const { error: profileError } = await client.from("profiles").upsert(
        {
          id: user.id,
          display_name: user.email ?? "",
          default_household_id: household.id,
        },
        { onConflict: "id" },
      );
      if (profileError) {
        // Non-blocking; profile row is optional in this pass.
        void profileError;
      }

      setCreateMessage("Cloud household created.");
      setNewHouseholdName("");
      setNewHouseholdLabel("");
      setMemberships((current) => [
        ...current,
        { householdId: household.id, householdName: household.name, role: "owner" },
      ]);
      setConnectedHousehold({
        householdId: household.id,
        householdName: household.name,
        role: "owner",
      });
    } catch (error) {
      setCreateMessage(friendlySupabaseError(error));
    } finally {
      setCreateBusy(false);
    }
  }

  function runPreview() {
    const issues: string[] = [];
    if (!configured) {
      issues.push("Cloud is not configured for this install.");
    }
    if (!user) {
      issues.push("You are not signed in.");
    }
    if (!connectedMembership) {
      issues.push("No cloud household is connected.");
    }
    if (data.familyMembers.some((m) => !m.name.trim())) {
      issues.push("One or more family members are missing a name.");
    }
    if (data.tasks.some((t) => !t.title.trim())) {
      issues.push("One or more tasks or chores are missing a title.");
    }
    if (data.shopping.some((i) => !i.name.trim())) {
      issues.push("One or more shopping items are missing a name.");
    }
    if (data.pantry.some((i) => !i.name.trim())) {
      issues.push("One or more inventory items are missing a name.");
    }
    if (data.projects.some((p) => !p.title.trim())) {
      issues.push("One or more projects are missing a title.");
    }
    if (data.docs.some((d) => !d.title.trim())) {
      issues.push("One or more docs are missing a title.");
    }

    setPreviewIssues(issues);
    setPreviewRan(true);
    setRows(baseRows);
    setUploadSummary(issues.length === 0 ? "Ready to upload." : "Fix blocked items before upload.");
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Household Access" eyebrow="Cloud household" />
        <div className="space-y-3 text-sm text-slate-600">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Signed-in email</p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {user?.email ?? "—"}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Cloud sign-in</p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {!configured ? "Not configured" : user ? "Signed in" : loading ? "Checking…" : "Signed out"}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Cloud household</p>
              <p className="mt-2 text-base font-semibold text-slate-950">{cloudStatus}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Active data source</p>
              <p className="mt-2 text-base font-semibold text-slate-950">Saved on this device</p>
            </div>
          </div>

          <p className="text-slate-600">
            Cloud household access is being prepared. Your current app data is still saved on this
            device.
          </p>

          {membershipError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-900">
              {membershipError}
            </div>
          ) : null}

          {loadingMemberships ? (
            <p className="text-slate-500">Loading cloud households…</p>
          ) : memberships.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Connected households
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {memberships.map((m) => (
                  <button
                    key={m.householdId}
                    type="button"
                    className={[
                      "rounded-lg border px-3 py-3 text-left transition min-h-11",
                      m.householdId === connectedHouseholdId
                        ? "border-blue-300 bg-blue-50 text-blue-900"
                        : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
                    ].join(" ")}
                    onClick={() => setConnectedHousehold(m)}
                  >
                    <p className="font-semibold">{m.householdName}</p>
                    <p className="mt-1 text-xs text-slate-600">Role: {m.role}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-slate-600">
              No cloud household is connected to this account yet.
            </div>
          )}
        </div>
      </Card>

      {configured && user ? (
        <Card>
          <CardHeader title="Create Cloud Household" eyebrow="Bootstrap" />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Household name
              </span>
              <Input
                className="min-h-11"
                value={newHouseholdName}
                onChange={(e) => setNewHouseholdName(e.target.value)}
                placeholder="Example: The Johnson household"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Optional display label
              </span>
              <Input
                className="min-h-11"
                value={newHouseholdLabel}
                onChange={(e) => setNewHouseholdLabel(e.target.value)}
                placeholder="Example: Home operations"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button disabled={createBusy} onClick={() => void createHousehold()} variant="primary">
              <Plus className="h-4 w-4" />
              Create Cloud Household
            </Button>
            {createMessage ? <p className="text-sm text-slate-600">{createMessage}</p> : null}
          </div>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Cloud upload" eyebrow="Not enabled in this version" />
        <div className="space-y-4 text-sm text-slate-600">
          <p>
            Upload is intentionally disabled while the migration preview is being validated. Your app
            still saves on this device only.
          </p>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="font-medium text-amber-950">Export a backup before uploading.</p>
            <p className="mt-1 text-amber-950/90">
              Preview does not change anything. Upload will be enabled after the preview is validated.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={onExportBackup} type="button" variant="secondary">
                <Download className="h-4 w-4" />
                Export backup
              </Button>
              <Button
                disabled={!configured || !user || !connectedMembership}
                onClick={runPreview}
                type="button"
                variant="secondary"
              >
                Run upload preview
              </Button>
            </div>
          </div>

          {previewRan ? (
            previewIssues.length > 0 ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-900">
                <p className="font-medium">Upload blocked</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  {previewIssues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
                Preview looks good. This upload will upsert by local ID and will not delete cloud rows.
              </div>
            )
          ) : null}

          <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3">
            <input
              checked={confirmUpload}
              className="mt-1 h-5 w-5 shrink-0 accent-blue-500"
              onChange={(e) => setConfirmUpload(e.target.checked)}
              type="checkbox"
            />
            <span className="leading-relaxed text-slate-700">
              I understand this will copy my current device data into the connected cloud household.
              My device remains the active data source after upload.
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              disabled
              variant="secondary"
              type="button"
            >
              Upload to cloud (after preview validation)
            </Button>
            <p className="text-xs text-slate-500">
              Last cloud upload: {formatTimestamp(data.adminSettings.lastCloudUploadAt)}
            </p>
          </div>

          {uploadSummary ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-700">
              {uploadSummary}
            </div>
          ) : null}

          {rows.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm text-slate-800">
                <thead className="border-b border-slate-200 bg-slate-50 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-600">
                  <tr>
                    <th className="px-3 py-2.5">Data type</th>
                    <th className="px-3 py-2.5">Local</th>
                    <th className="px-3 py-2.5">Uploaded</th>
                    <th className="px-3 py-2.5">Skipped</th>
                    <th className="px-3 py-2.5">Errors</th>
                    <th className="px-3 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.key} className="border-t border-slate-100">
                      <td className="px-3 py-2.5 font-medium text-slate-900">{r.label}</td>
                      <td className="px-3 py-2.5 text-slate-600">{r.localCount}</td>
                      <td className="px-3 py-2.5 text-slate-600">{r.uploadedCount}</td>
                      <td className="px-3 py-2.5 text-slate-600">{r.skippedCount}</td>
                      <td className="px-3 py-2.5 text-slate-600">{r.errorCount}</td>
                      <td className="px-3 py-2.5 text-slate-700">
                        {r.status}
                        {r.error ? <span className="block text-xs text-rose-800">{r.error}</span> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

