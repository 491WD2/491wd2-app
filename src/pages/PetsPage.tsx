import { Bell, History, PawPrint, Pencil, Plus, StickyNote, Trash2 } from "lucide-react";
import { useId, useMemo, useState } from "react";
import type { PetMedicationEntry } from "../data/familyData";
import { Button } from "../components/ui/Button";
import { Input, Select, Textarea } from "../components/ui/Field";
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerHeader,
  DrawerPanel,
} from "../components/workspace/DrawerShell";
import {
  ModuleWorkspaceHeader,
  WorkspacePageShell,
} from "../components/workspace/ModuleWorkspace";
import { DS_MAIN_COLUMN } from "../lib/designSystem";
import {
  membersForAssignmentSelect,
  UNKNOWN_ASSIGNED_MEMBER_LABEL,
} from "../lib/memberAssignment";
import {
  accentRingClassForPet,
  computeFleaMedicationUiStatus,
  daysSinceLastDose,
  latestFleaEntryForPet,
  msDaysAfter,
  resolvePet,
  sortMedicationEntriesDesc,
  syncPetFleaDueNotifications,
} from "../lib/petFleaMedication";
import { cn, getMemberFullName } from "../lib/utils";
import type { PageProps } from "./pageTypes";

const PAGE_BG =
  "min-h-full bg-[#f7f7f7] text-[#1f1f1f] [-webkit-font-smoothing:antialiased]";
const CARD_SHELL =
  "rounded-[8px] border border-[#ededed] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.12)]";
const SM_INPUT =
  "min-h-10 w-full rounded-[8px] border border-[#ededed] bg-white px-3 py-2 text-[14px] text-[#1f1f1f] shadow-[0_1px_1px_rgba(0,0,0,0.06)] placeholder:text-[#8e8e8e] focus:border-[#FE9F43]/55 focus:outline-none focus:ring-2 focus:ring-[#FE9F43]/25";
const SM_LABEL = "text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]";

function chipClasses(status: ReturnType<typeof computeFleaMedicationUiStatus>): string {
  switch (status) {
    case "upToDate":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "dueSoon":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "dueToday":
      return "border-amber-300 bg-amber-100 text-amber-950";
    case "overdue":
      return "border-rose-200 bg-rose-50 text-rose-900";
    default:
      return "border-[#ededed] bg-[#f8f9fa] text-[#575757]";
  }
}

function chipLabel(status: ReturnType<typeof computeFleaMedicationUiStatus>): string {
  switch (status) {
    case "upToDate":
      return "Up to date";
    case "dueSoon":
      return "Due soon";
    case "dueToday":
      return "Due today";
    case "overdue":
      return "Overdue";
    default:
      return "No dose logged";
  }
}

function formatLocalDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatLocalTimeInput(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function localDateTimeToIso(dateStr: string, timeStr: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const local = new Date(y, (mo ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0);
  return local.toISOString();
}

export function PetsPage({
  data,
  setData,
  onOpenDashboard,
}: Pick<PageProps, "data" | "setData" | "onOpenDashboard">) {
  const titleId = useId();
  const pets = data.pets ?? [];
  const entries = data.petMedicationEntries ?? [];

  const rosterForGivenBy = useMemo(
    () =>
      membersForAssignmentSelect(
        data.familyMembers,
        ...entries.map((e) => e.givenByMemberId),
      ),
    [data.familyMembers, entries],
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formPetId, setFormPetId] = useState("");
  const [formDate, setFormDate] = useState(() => formatLocalDateInput(new Date()));
  const [formTime, setFormTime] = useState(() => formatLocalTimeInput(new Date()));
  const [formGivenBy, setFormGivenBy] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const fleaAlerts = useMemo(
    () =>
      data.notifications.filter(
        (n) => n.type === "pet_flea_med_due" && !n.dismissedAt,
      ),
    [data.notifications],
  );

  const sortedEntries = useMemo(() => sortMedicationEntriesDesc(entries), [entries]);

  const summary = useMemo(() => {
    let soon = 0;
    let today = 0;
    let overdue = 0;
    let ok = 0;
    for (const pet of pets.filter((p) => p.active)) {
      const latest = latestFleaEntryForPet(pet.id, entries);
      const st = computeFleaMedicationUiStatus(latest?.givenAt);
      if (st === "dueSoon") soon += 1;
      else if (st === "dueToday") today += 1;
      else if (st === "overdue") overdue += 1;
      else if (st === "upToDate") ok += 1;
    }
    return { soon, today, overdue, ok };
  }, [pets, entries]);

  function openAdd(petId?: string) {
    const now = new Date();
    setEditingId(null);
    setFormPetId(petId ?? pets.find((p) => p.active)?.id ?? "");
    setFormDate(formatLocalDateInput(now));
    setFormTime(formatLocalTimeInput(now));
    setFormGivenBy(data.adminSettings.activeMemberId ?? "");
    setFormNotes("");
    setDrawerOpen(true);
  }

  function openEdit(entry: PetMedicationEntry) {
    setEditingId(entry.id);
    const d = new Date(entry.givenAt);
    setFormPetId(entry.petId);
    setFormDate(formatLocalDateInput(d));
    setFormTime(formatLocalTimeInput(d));
    setFormGivenBy(entry.givenByMemberId ?? "");
    setFormNotes(entry.notes ?? "");
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingId(null);
  }

  function saveEntry() {
    const petId = formPetId.trim();
    if (!petId) return;
    const givenAt = localDateTimeToIso(formDate, formTime);
    const nowIso = new Date().toISOString();

    setData((d) => {
      const baseEntries = d.petMedicationEntries ?? [];
      let nextEntries: PetMedicationEntry[];
      if (editingId) {
        nextEntries = baseEntries.map((e) =>
          e.id === editingId
            ? {
                ...e,
                petId,
                givenAt,
                givenByMemberId: formGivenBy.trim() || undefined,
                notes: formNotes.trim() || undefined,
                updatedAt: nowIso,
              }
            : e,
        );
      } else {
        nextEntries = [
          ...baseEntries,
          {
            id: crypto.randomUUID(),
            petId,
            medicationType: "flea",
            givenAt,
            givenByMemberId: formGivenBy.trim() || undefined,
            notes: formNotes.trim() || undefined,
            createdAt: nowIso,
            updatedAt: nowIso,
          },
        ];
      }
      let next: typeof d = { ...d, petMedicationEntries: nextEntries };
      next = syncPetFleaDueNotifications(next);
      return next;
    });

    window.alert("Flea medication entry saved.");
    closeDrawer();
  }

  function deleteEntry(entry: PetMedicationEntry) {
    if (
      !window.confirm(
        "Delete this flea medication entry? This updates reminders based on the latest remaining dose.",
      )
    ) {
      return;
    }
    setData((d) => {
      const nextEntries = (d.petMedicationEntries ?? []).filter((e) => e.id !== entry.id);
      return syncPetFleaDueNotifications({ ...d, petMedicationEntries: nextEntries });
    });
  }

  function dismissAlert(id: string) {
    const nowIso = new Date().toISOString();
    setData((d) => ({
      ...d,
      notifications: d.notifications.map((n) =>
        n.id === id ? { ...n, dismissedAt: n.dismissedAt ?? nowIso } : n,
      ),
    }));
  }

  const activePetsOptions = pets.filter((p) => p.active);

  return (
    <div className={PAGE_BG}>
      <WorkspacePageShell
        tone="light"
        className={cn(
          "flex flex-col gap-5 px-[15px] pb-10 pt-0 sm:gap-6 sm:px-[30px]",
          DS_MAIN_COLUMN,
        )}
      >
      <div className="flex flex-wrap items-center gap-3">
        {onOpenDashboard ? (
          <Button type="button" variant="secondary" onClick={onOpenDashboard}>
            Home
          </Button>
        ) : null}
      </div>

      <ModuleWorkspaceHeader
        tone="light"
        eyebrow="Household"
        title="Pets"
        description="Track flea medication and care notes."
        action={
          <Button type="button" variant="primary" onClick={() => openAdd()}>
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            Add Flea Medication
          </Button>
        }
      />

      {fleaAlerts.length > 0 ? (
        <section
          className={cn(CARD_SHELL, "space-y-3 border-amber-200 bg-amber-50/80 p-4")}
          aria-label="Flea medication reminders"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-950">
            <Bell className="h-4 w-4 shrink-0" aria-hidden />
            Due reminders
          </div>
          <ul className="space-y-2">
            {fleaAlerts.map((n) => (
              <li
                key={n.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-amber-200/80 bg-white px-3 py-2 text-sm text-[#1f1f1f]"
              >
                <span>{n.title}</span>
                <Button
                  type="button"
                  variant="ghost"
                  className="shrink-0 text-xs text-[#575757] hover:bg-[#f8f9fa]"
                  onClick={() => dismissAlert(n.id)}
                >
                  Dismiss
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={cn(CARD_SHELL, "p-4 sm:p-5")}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#637381]">
          Flea Medication Status
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-[8px] border border-emerald-200 bg-emerald-50 px-3 py-2">
            <p className="text-xs text-emerald-800">Up to date</p>
            <p className="text-lg font-semibold tabular-nums text-emerald-950">{summary.ok}</p>
          </div>
          <div className="rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-xs text-amber-900">Due soon</p>
            <p className="text-lg font-semibold tabular-nums text-amber-950">{summary.soon}</p>
          </div>
          <div className="rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-xs text-amber-900">Due today</p>
            <p className="text-lg font-semibold tabular-nums text-amber-950">{summary.today}</p>
          </div>
          <div className="rounded-[8px] border border-rose-200 bg-rose-50 px-3 py-2">
            <p className="text-xs text-rose-800">Overdue</p>
            <p className="text-lg font-semibold tabular-nums text-rose-950">{summary.overdue}</p>
          </div>
        </div>
      </section>

      {sortedEntries.length === 0 ? (
        <section className={cn(CARD_SHELL, "p-6 text-center")}>
          <PawPrint className="mx-auto h-10 w-10 text-[#637381]" aria-hidden />
          <h2 className="mt-3 text-lg font-semibold text-[#1f1f1f]">No flea medication recorded yet.</h2>
          <p className="mt-2 text-sm text-[#575757]">
            Add the first entry so FamilySite can remind you when the next dose is due.
          </p>
          <div className="mt-4 flex justify-center">
            <Button type="button" variant="primary" onClick={() => openAdd()}>
              Add Flea Medication
            </Button>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2">
        {pets
          .filter((p) => p.active)
          .map((pet) => {
            const latest = latestFleaEntryForPet(pet.id, entries);
            const status = computeFleaMedicationUiStatus(latest?.givenAt);
            const days = latest ? daysSinceLastDose(latest.givenAt) : undefined;
            const nextDue = latest ? new Date(msDaysAfter(latest.givenAt, 29)).toISOString() : undefined;
            const giver = latest?.givenByMemberId
              ? rosterForGivenBy.find((m) => m.id === latest.givenByMemberId)
              : undefined;
            const giverLabel = latest?.givenByMemberId
              ? giver
                ? getMemberFullName(giver)
                : UNKNOWN_ASSIGNED_MEMBER_LABEL
              : "—";

            return (
              <article
                key={pet.id}
                className={cn(
                  CARD_SHELL,
                  "flex flex-col gap-3 p-4",
                  accentRingClassForPet(pet),
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-[#1f1f1f]">{pet.name}</h3>
                    <p className="text-xs text-[#637381]">Cat · flea medication</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-semibold",
                      chipClasses(status),
                    )}
                  >
                    {chipLabel(status)}
                  </span>
                </div>

                {latest ? (
                  <dl className="space-y-1 text-sm text-[#575757]">
                    <div className="flex justify-between gap-2">
                      <dt className="text-[#637381]">Last dose</dt>
                      <dd className="text-right font-medium text-[#1f1f1f]">
                        {new Date(latest.givenAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-[#637381]">Given by</dt>
                      <dd className="text-right">{giverLabel}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-[#637381]">Days since last dose</dt>
                      <dd className="text-right">{days ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-[#637381]">Next due</dt>
                      <dd className="text-right text-[#1f1f1f]">
                        {nextDue
                          ? new Date(nextDue).toLocaleString(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "—"}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-sm text-[#575757]">No flea medication recorded yet.</p>
                )}

                <div className="mt-auto flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-9 px-3 text-xs"
                    onClick={() => openAdd(pet.id)}
                  >
                    Add Entry
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 px-3 text-xs text-[#575757] hover:bg-[#f8f9fa]"
                    onClick={() => {
                      document.getElementById("pet-flea-history")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                  >
                    <History className="mr-1 h-4 w-4" aria-hidden />
                    View History
                  </Button>
                </div>
              </article>
            );
          })}
      </section>

      <section id="pet-flea-history" className={cn(CARD_SHELL, "overflow-hidden p-0")}>
        <div className="border-b border-[#ededed] px-4 py-3">
          <h2 className={SM_LABEL}>
            Recent Flea Medication History
          </h2>
        </div>
        {sortedEntries.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-[#637381]">No entries yet.</p>
        ) : (
          <ul className="divide-y divide-[#ededed]">
            {sortedEntries.slice(0, 40).map((entry) => {
              const pet = resolvePet(pets, entry.petId);
              const petName = pet?.name ?? "Unknown pet";
              const giver = entry.givenByMemberId
                ? rosterForGivenBy.find((m) => m.id === entry.givenByMemberId)
                : undefined;
              const giverLabel = entry.givenByMemberId
                ? giver
                  ? getMemberFullName(giver)
                  : UNKNOWN_ASSIGNED_MEMBER_LABEL
                : "—";

              return (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#1f1f1f]">{petName}</p>
                    <p className="text-xs text-[#575757]">
                      {new Date(entry.givenAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}{" "}
                      · {giverLabel}
                      {entry.notes?.trim() ? (
                        <span className="ml-1 inline-flex items-center gap-1 text-[#F26522]">
                          <StickyNote className="h-3.5 w-3.5" aria-hidden />
                          Notes
                        </span>
                      ) : (
                        <span className="ml-1 text-[#637381]">· No notes.</span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 min-w-9 px-2 text-[#575757] hover:bg-[#f8f9fa]"
                      aria-label="Edit entry"
                      onClick={() => openEdit(entry)}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 min-w-9 px-2 text-rose-300 hover:bg-rose-500/15"
                      aria-label="Delete entry"
                      onClick={() => deleteEntry(entry)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {drawerOpen ? (
        <>
          <DrawerBackdrop ariaLabel="Close form" onClick={closeDrawer} />
          <DrawerPanel
            aria-labelledby={`${titleId}-flea`}
            className="z-50 !border-[#ededed] !bg-white !shadow-[0_12px_48px_rgba(0,0,0,0.12)] lg:max-w-md"
          >
            <DrawerHeader
              eyebrow="Flea medication"
              title={editingId ? "Edit entry" : "Add Flea Medication"}
              titleId={`${titleId}-flea`}
              trailing={
                <Button
                  type="button"
                  variant="ghost"
                  className="text-[#575757] hover:bg-[#f8f9fa]"
                  onClick={closeDrawer}
                >
                  Cancel
                </Button>
              }
            />
            <DrawerBody>
              <div className="space-y-4">
                <label className="block text-xs font-medium text-[#637381]">
                  Cat
                  <Select
                    className={cn("mt-1", SM_INPUT)}
                    value={formPetId}
                    onChange={(e) => setFormPetId(e.target.value)}
                  >
                    <option value="">Select…</option>
                    {activePetsOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs font-medium text-[#637381]">
                    Date
                    <Input
                      type="date"
                      className={cn("mt-1", SM_INPUT)}
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                    />
                  </label>
                  <label className="block text-xs font-medium text-[#637381]">
                    Time
                    <Input
                      type="time"
                      className={cn("mt-1", SM_INPUT)}
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                    />
                  </label>
                </div>
                <label className="block text-xs font-medium text-[#637381]">
                  Given by
                  <Select
                    className={cn("mt-1", SM_INPUT)}
                    value={formGivenBy}
                    onChange={(e) => setFormGivenBy(e.target.value)}
                  >
                    <option value="">—</option>
                    {rosterForGivenBy.map((m) => (
                      <option key={m.id} value={m.id}>
                        {getMemberFullName(m)}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="block text-xs font-medium text-[#637381]">
                  Notes
                  <Textarea
                    className={cn("mt-1 min-h-[88px]", SM_INPUT)}
                    placeholder="Optional"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                  />
                </label>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button type="button" variant="primary" onClick={saveEntry}>
                    Save Entry
                  </Button>
                  <Button type="button" variant="secondary" onClick={closeDrawer}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DrawerBody>
          </DrawerPanel>
        </>
      ) : null}
      </WorkspacePageShell>
    </div>
  );
}
