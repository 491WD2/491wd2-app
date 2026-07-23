import { Home, MapPin, Phone, Shield, Stethoscope } from "lucide-react";
import { useMemo } from "react";
import { Button } from "../components/ui/Button";
import {
  ModuleWorkspaceHeader,
  WorkspacePageShell,
} from "../components/workspace/ModuleWorkspace";
import { DS_MAIN_COLUMN } from "../lib/designSystem";
import { cn, getMemberFullName } from "../lib/utils";
import type { PageProps } from "./pageTypes";

const PAGE_BG =
  "min-h-full bg-[#f7f7f7] text-[#0f172a] [-webkit-font-smoothing:antialiased]";
const CARD =
  "rounded-[12px] border border-[#cbd5e1] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.08)] sm:p-5";
const SECTION_TITLE = "text-[1.05rem] font-bold tracking-[-0.02em] text-[#0f172a]";
const MUTED = "text-sm font-medium text-[#475569]";
const LABEL =
  "text-[11px] font-semibold uppercase tracking-[0.12em] text-[#64748b]";

const SUPPLY_CHECKLIST = [
  "Water",
  "Food",
  "Flashlights",
  "Batteries",
  "Pet supplies",
  "Medications",
  "Documents",
  "Chargers",
  "Cash",
  "First aid",
] as const;

const MEETING_PLACE_STARTERS = [
  {
    title: "Home meeting spot",
    detail: "Agree on a clear outdoor spot near home (for example: front tree, driveway corner).",
  },
  {
    title: "Neighborhood meeting spot",
    detail: "Choose a nearby landmark if you cannot return home (park entrance, school, library).",
  },
  {
    title: "Out-of-area contact / location",
    detail: "Pick a relative or friend outside the area who everyone can check in with.",
  },
] as const;

const EVACUATION_STARTERS = [
  {
    title: "Where to go",
    detail: "List primary and backup destinations (relative’s home, hotel corridor, shelter).",
  },
  {
    title: "What to grab",
    detail: "Go-bag basics: IDs, meds, chargers, pet carriers, spare keys, cash, comfort items.",
  },
  {
    title: "Who handles what",
    detail: "Assign roles: kids/pets, documents, vehicle, locking up, calling the out-of-area contact.",
  },
  {
    title: "Notes",
    detail: "Routes, gate codes, neighbor help, and anything the household should remember under stress.",
  },
] as const;

/**
 * Emergency Planning — calm household preparedness overview.
 * Uses existing member fields when present; starter sections are static until a later save pass.
 */
export function EmergencyPlanningPage({
  data,
  onOpenDashboard,
}: Pick<PageProps, "data" | "onOpenDashboard">) {
  const activeMembers = useMemo(
    () =>
      (data.familyMembers ?? []).filter(
        (m) => m && m.status !== "archived",
      ),
    [data.familyMembers],
  );

  const contactRows = useMemo(() => {
    return activeMembers
      .map((member) => {
        const contact = (member.emergencyContact ?? "").trim();
        if (!contact) return null;
        return {
          id: member.id,
          name: getMemberFullName(member),
          relationship: (member.roleLabel || member.role || member.ageGroup || "Household").trim(),
          phone: contact,
          notes: (member.notes ?? "").trim(),
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      name: string;
      relationship: string;
      phone: string;
      notes: string;
    }>;
  }, [activeMembers]);

  const medicalRows = useMemo(() => {
    return activeMembers
      .map((member) => {
        const allergies = (member.allergies ?? "").trim();
        const notes = (member.notes ?? "").trim();
        if (!allergies && !notes) return null;
        return {
          id: member.id,
          name: getMemberFullName(member),
          allergies,
          notes,
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      name: string;
      allergies: string;
      notes: string;
    }>;
  }, [activeMembers]);

  const emergencyDocs = useMemo(
    () =>
      (data.docs ?? []).filter(
        (doc) => doc && (doc.category === "emergency" || doc.category === "medical"),
      ),
    [data.docs],
  );

  return (
    <div className={PAGE_BG}>
      <WorkspacePageShell className={cn(DS_MAIN_COLUMN, "pb-10 pt-2")}>
        <ModuleWorkspaceHeader
          eyebrow="Household safety"
          title="Emergency Planning"
          description="Calm, practical readiness for contacts, meeting places, medical notes, supplies, and evacuation."
          action={
            onOpenDashboard ? (
              <Button type="button" variant="secondary" onClick={onOpenDashboard}>
                <Home className="h-4 w-4" />
                Home
              </Button>
            ) : null
          }
        />

        <p className={cn(MUTED, "mb-4 rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5")}>
          Starter plan for this household. Member emergency contacts and health notes below come from
          existing profiles. Full editable storage for every section is planned for a later update —
          nothing new is written to FamilyData in this pass.
        </p>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* 1. Emergency Contacts */}
          <section className={CARD} aria-labelledby="emergency-contacts-title">
            <div className="mb-3 flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#e0f2fe] text-[#0369a1]">
                <Phone className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 id="emergency-contacts-title" className={SECTION_TITLE}>
                  Emergency Contacts
                </h2>
                <p className={MUTED}>Name, relationship, phone, and notes</p>
              </div>
            </div>
            {contactRows.length === 0 ? (
              <p className={MUTED}>
                No member emergency contacts saved yet. Add them under Settings → Members (Emergency
                contact field).
              </p>
            ) : (
              <ul className="space-y-3">
                {contactRows.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-3"
                  >
                    <p className="font-semibold text-[#0f172a]">{row.name}</p>
                    <p className={LABEL}>{row.relationship}</p>
                    <p className="mt-1 text-[15px] font-semibold text-[#0f172a]">{row.phone}</p>
                    {row.notes ? <p className={cn(MUTED, "mt-1")}>{row.notes}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 2. Meeting Places */}
          <section className={CARD} aria-labelledby="meeting-places-title">
            <div className="mb-3 flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#ecfdf5] text-[#047857]">
                <MapPin className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 id="meeting-places-title" className={SECTION_TITLE}>
                  Meeting Places
                </h2>
                <p className={MUTED}>Home, neighborhood, and out-of-area</p>
              </div>
            </div>
            <ul className="space-y-3">
              {MEETING_PLACE_STARTERS.map((item) => (
                <li
                  key={item.title}
                  className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-3"
                >
                  <p className="font-semibold text-[#0f172a]">{item.title}</p>
                  <p className={cn(MUTED, "mt-1")}>{item.detail}</p>
                  <p className={cn(LABEL, "mt-2")}>To fill in later</p>
                </li>
              ))}
            </ul>
          </section>

          {/* 3. Medical Notes */}
          <section className={CARD} aria-labelledby="medical-notes-title">
            <div className="mb-3 flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#fef3c7] text-[#b45309]">
                <Stethoscope className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 id="medical-notes-title" className={SECTION_TITLE}>
                  Medical Notes
                </h2>
                <p className={MUTED}>Allergies, medications, health, doctor / pharmacy</p>
              </div>
            </div>
            {medicalRows.length === 0 && emergencyDocs.length === 0 ? (
              <div className="space-y-2">
                <p className={MUTED}>
                  No allergies or health notes on member profiles yet. Add allergies or notes in
                  Settings → Members.
                </p>
                <ul className={cn(MUTED, "list-disc space-y-1 pl-5")}>
                  <li>Allergies</li>
                  <li>Medications</li>
                  <li>Important health notes</li>
                  <li>Doctor / pharmacy notes</li>
                </ul>
              </div>
            ) : (
              <ul className="space-y-3">
                {medicalRows.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-3"
                  >
                    <p className="font-semibold text-[#0f172a]">{row.name}</p>
                    {row.allergies ? (
                      <p className="mt-1 text-sm text-[#0f172a]">
                        <span className={LABEL}>Allergies · </span>
                        {row.allergies}
                      </p>
                    ) : null}
                    {row.notes ? (
                      <p className={cn(MUTED, "mt-1")}>
                        <span className={LABEL}>Notes · </span>
                        {row.notes}
                      </p>
                    ) : null}
                  </li>
                ))}
                {emergencyDocs.map((doc) => (
                  <li
                    key={doc.id}
                    className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-3"
                  >
                    <p className="font-semibold text-[#0f172a]">{doc.title}</p>
                    <p className={cn(MUTED, "mt-1")}>
                      {(doc.body || doc.content || "").trim() || "Household document"}
                    </p>
                    <p className={cn(LABEL, "mt-2")}>{doc.category}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 4. Emergency Checklist */}
          <section className={CARD} aria-labelledby="emergency-checklist-title">
            <div className="mb-3 flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#eef2ff] text-[#4338ca]">
                <Shield className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 id="emergency-checklist-title" className={SECTION_TITLE}>
                  Emergency Checklist
                </h2>
                <p className={MUTED}>Supplies to keep ready</p>
              </div>
            </div>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SUPPLY_CHECKLIST.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-sm font-semibold text-[#0f172a]"
                >
                  <span
                    className="inline-flex h-5 w-5 shrink-0 rounded-md border border-[#cbd5e1] bg-white"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
            <p className={cn(MUTED, "mt-3")}>Check-off saving comes in a later update.</p>
          </section>

          {/* 5. Evacuation Plan */}
          <section className={cn(CARD, "lg:col-span-2")} aria-labelledby="evacuation-plan-title">
            <div className="mb-3 flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#f1f5f9] text-[#334155]">
                <MapPin className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 id="evacuation-plan-title" className={SECTION_TITLE}>
                  Evacuation Plan
                </h2>
                <p className={MUTED}>Where to go, what to grab, who handles what</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {EVACUATION_STARTERS.map((item) => (
                <article
                  key={item.title}
                  className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-3"
                >
                  <h3 className="font-semibold text-[#0f172a]">{item.title}</h3>
                  <p className={cn(MUTED, "mt-1")}>{item.detail}</p>
                  <p className={cn(LABEL, "mt-2")}>To fill in later</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </WorkspacePageShell>
    </div>
  );
}

export default EmergencyPlanningPage;
