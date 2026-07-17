import { useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { FamilyData, ModuleKey } from "../../data/familyData";
import { getAppDisplayName } from "../../lib/customization";

type DayKey =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

type DayHours = {
  open: boolean;
  start: string;
  end: string;
};

type WizardDraft = {
  householdName: string;
  tagline: string;
  phone: string;
  email: string;
  description: string;
  avatarUrl: string;
  branchName: string;
  doorNumber: string;
  street: string;
  locality: string;
  town: string;
  city: string;
  postcode: string;
  country: string;
  hours: Record<DayKey, DayHours>;
  sameForOnline: boolean;
  modules: Partial<Record<ModuleKey, boolean>>;
};

const STEPS = [
  { id: "details", title: "Details", subtitle: "Name and Details" },
  { id: "location", title: "Location", subtitle: "Guide to reach you" },
  { id: "hours", title: "Working Hours", subtitle: "Availability and Opening hours" },
  { id: "services", title: "Services", subtitle: "Enable household modules" },
] as const;

const DAYS: { key: DayKey; label: string }[] = [
  { key: "sunday", label: "Sunday" },
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
];

const MODULE_OPTIONS: { key: ModuleKey; label: string; hint: string }[] = [
  { key: "pantry", label: "Household Inventory", hint: "Pantry, fridge & freezer" },
  { key: "shopping", label: "Shopping", hint: "Lists and purchased tracking" },
  { key: "tasks", label: "Cleaning / Chores", hint: "Zones and due dates" },
  { key: "calendar", label: "Calendar", hint: "Events and reminders" },
  { key: "planner", label: "Planner", hint: "Weekly planning board" },
  { key: "docs", label: "Docs", hint: "Household files and uploads" },
];

function defaultHours(): Record<DayKey, DayHours> {
  const week: DayHours = { open: true, start: "08:00", end: "20:00" };
  return {
    sunday: { open: false, start: "10:00", end: "16:00" },
    monday: { ...week },
    tuesday: { ...week },
    wednesday: { ...week },
    thursday: { ...week },
    friday: { ...week },
    saturday: { open: true, start: "09:00", end: "18:00" },
  };
}

function draftFromData(data: FamilyData): WizardDraft {
  const name = getAppDisplayName(data.adminSettings) || data.adminSettings.householdName || "";
  const notes = data.adminSettings.instacart?.notes ?? "";
  const phoneMatch = notes.match(/phone:\s*(.+)/i);
  const emailMatch = notes.match(/email:\s*(.+)/i);
  const addressMatch = notes.match(/address:\s*(.+)/i);
  const addressParts = (addressMatch?.[1] ?? "").split("|").map((s) => s.trim());

  return {
    householdName: name,
    tagline: data.adminSettings.appModeLabel || "",
    phone: phoneMatch?.[1]?.trim() ?? "",
    email: emailMatch?.[1]?.trim() ?? "",
    description: data.adminSettings.dashboardWelcomeMessage || "",
    avatarUrl: "",
    branchName: data.adminSettings.instacart?.preferredStoreName || "Home",
    doorNumber: addressParts[0] || "",
    street: addressParts[1] || "",
    locality: addressParts[2] || "",
    town: addressParts[3] || "",
    city: addressParts[4] || "",
    postcode: data.adminSettings.instacart?.preferredZipCode || addressParts[5] || "",
    country: addressParts[6] || "",
    hours: defaultHours(),
    sameForOnline: true,
    modules: { ...data.adminSettings.moduleVisibility },
  };
}

function buildNotes(draft: WizardDraft): string {
  const address = [
    draft.doorNumber,
    draft.street,
    draft.locality,
    draft.town,
    draft.city,
    draft.postcode,
    draft.country,
  ]
    .map((s) => s.trim())
    .join(" | ");
  const hoursSummary = DAYS.map(({ key, label }) => {
    const h = draft.hours[key];
    return h.open ? `${label} ${h.start}-${h.end}` : `${label} closed`;
  }).join("; ");
  return [
    draft.phone ? `phone: ${draft.phone}` : "",
    draft.email ? `email: ${draft.email}` : "",
    address ? `address: ${address}` : "",
    `hours: ${hoursSummary}`,
    draft.sameForOnline ? "hours-apply-online: yes" : "hours-apply-online: no",
  ]
    .filter(Boolean)
    .join("\n");
}

type Props = {
  data: FamilyData;
  setData: Dispatch<SetStateAction<FamilyData>>;
  className?: string;
};

export function HouseholdSmartWizard({ data, setData, className }: Props) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<WizardDraft>(() => draftFromData(data));
  const [savedFlash, setSavedFlash] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const progressPct = useMemo(
    () => Math.round(((step + 1) / STEPS.length) * 100),
    [step],
  );
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  const initials = (draft.householdName || "HH")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  function update<K extends keyof WizardDraft>(key: K, value: WizardDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function updateHours(day: DayKey, patch: Partial<DayHours>) {
    setDraft((prev) => ({
      ...prev,
      hours: { ...prev.hours, [day]: { ...prev.hours[day], ...patch } },
    }));
  }

  function onAvatar(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") update("avatarUrl", reader.result);
    };
    reader.readAsDataURL(file);
  }

  function persist(finish: boolean) {
    setData((prev) => {
      const name = draft.householdName.trim() || prev.adminSettings.householdName;
      const nextModules = { ...prev.adminSettings.moduleVisibility };
      for (const opt of MODULE_OPTIONS) {
        nextModules[opt.key] = draft.modules[opt.key] !== false;
      }
      return {
        ...prev,
        adminSettings: {
          ...prev.adminSettings,
          householdName: name,
          appModeLabel: draft.tagline.trim() || prev.adminSettings.appModeLabel,
          dashboardWelcomeMessage:
            draft.description.trim() || prev.adminSettings.dashboardWelcomeMessage,
          moduleVisibility: nextModules,
          setupChecklistDismissed: finish
            ? true
            : prev.adminSettings.setupChecklistDismissed,
          instacart: {
            ...prev.adminSettings.instacart,
            preferredStoreName: draft.branchName.trim(),
            preferredZipCode: draft.postcode.trim(),
            notes: buildNotes(draft),
          },
          customization: {
            ...prev.adminSettings.customization,
            labels: {
              ...prev.adminSettings.customization?.labels,
              appDisplayName: name,
            },
          },
        },
      };
    });
    if (finish) {
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2200);
    }
  }

  function goNext() {
    if (isLast) {
      persist(true);
      return;
    }
    persist(false);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  function goPrev() {
    setStep((s) => Math.max(0, s - 1));
  }

  function goStep(index: number) {
    if (index <= step || index === step + 1) setStep(index);
  }

  return (
    <div className={`aux-smartwizard card border overflow-hidden mb-4 ${className ?? ""}`}>
      <ul className="nav aux-sw-nav" role="tablist">
        {STEPS.map((s, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <li key={s.id} className="nav-item">
              <button
                type="button"
                className={`nav-link${active ? " active" : ""}${done ? " done" : ""}`}
                onClick={() => goStep(i)}
                aria-current={active ? "step" : undefined}
              >
                <div className="num">{i + 1}</div>
                <div>
                  <p className="h5 mb-0">{s.title}</p>
                  <p className="opacity-75 small">{s.subtitle}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="card-body">
        <div className="tab-content">
          {step === 0 ? (
            <div className="tab-pane active px-0" role="tabpanel">
              <div className="row align-items-center">
                <div className="col-12 col-lg-3 text-center mb-3">
                  <figure className="avatar avatar-140 coverimg rounded-circle mt-3 mb-3">
                    {draft.avatarUrl ? (
                      <img src={draft.avatarUrl} alt="" />
                    ) : (
                      <span className="aux-sw-avatar-fallback" aria-hidden>
                        {initials || "HH"}
                      </span>
                    )}
                    <button
                      type="button"
                      className="btn btn-square btn-accent rounded-circle"
                      onClick={() => fileRef.current?.click()}
                      aria-label="Upload household photo"
                    >
                      <i className="bi bi-upload" />
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="d-none"
                      onChange={(e) => onAvatar(e.target.files?.[0])}
                    />
                  </figure>
                  <p className="h5">{draft.householdName || "Household"}</p>
                </div>
                <div className="col">
                  <p className="h6 py-2 mb-2">Household Details</p>
                  <div className="row">
                    <div className="col-12 col-md-6 col-xl-4">
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          id="sw-household-name"
                          placeholder="Household name"
                          value={draft.householdName}
                          onChange={(e) => update("householdName", e.target.value)}
                        />
                        <label htmlFor="sw-household-name">Household Name</label>
                      </div>
                    </div>
                    <div className="col-12 col-md-6 col-xl-4">
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          id="sw-tagline"
                          placeholder="Tagline"
                          value={draft.tagline}
                          onChange={(e) => update("tagline", e.target.value)}
                        />
                        <label htmlFor="sw-tagline">Tagline (Optional)</label>
                      </div>
                    </div>
                    <div className="col-12 col-md-6 col-xl-4">
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          id="sw-phone"
                          placeholder="Phone"
                          value={draft.phone}
                          onChange={(e) => update("phone", e.target.value)}
                        />
                        <label htmlFor="sw-phone">Enter Phone</label>
                      </div>
                    </div>
                    <div className="col-12 col-md-6 col-xl-4">
                      <div className="form-floating mb-3">
                        <input
                          type="email"
                          className="form-control"
                          id="sw-email"
                          placeholder="Email"
                          value={draft.email}
                          onChange={(e) => update("email", e.target.value)}
                        />
                        <label htmlFor="sw-email">Email Address</label>
                      </div>
                    </div>
                  </div>
                  <p className="h6 py-2 mb-2">Describe Household Focus</p>
                  <div className="form-floating mb-3">
                    <textarea
                      className="form-control height-150"
                      id="sw-describe"
                      placeholder="Short description"
                      value={draft.description}
                      onChange={(e) => update("description", e.target.value)}
                    />
                    <label htmlFor="sw-describe">Welcome message / short description</label>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="tab-pane active px-0 pb-0" role="tabpanel">
              <div className="row">
                <div className="col-12 col-lg-3 text-center">
                  <p className="h6 py-2 mb-2">Locate on Map</p>
                  <iframe
                    title="Household map"
                    src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d788.4385190507815!2d-122.4278138198206!3d37.772364180178094!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1712990839970!5m2!1sen!2sin"
                    width="100%"
                    height="280"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="rounded mb-3"
                  />
                </div>
                <div className="col">
                  <div className="row align-items-center mb-2">
                    <div className="col">
                      <p className="h6 py-2">Household Address</p>
                    </div>
                  </div>
                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control"
                      id="sw-branch"
                      placeholder="Home / branch"
                      value={draft.branchName}
                      onChange={(e) => update("branchName", e.target.value)}
                    />
                    <label htmlFor="sw-branch">Home / Branch Name</label>
                  </div>
                  <div className="row mb-2">
                    {(
                      [
                        ["doorNumber", "Shop/Door Number", "sw-door"],
                        ["street", "Street", "sw-street"],
                        ["locality", "Locality", "sw-locality"],
                        ["town", "Town", "sw-town"],
                        ["city", "City", "sw-city"],
                        ["postcode", "Postcode", "sw-post"],
                        ["country", "Country", "sw-country"],
                      ] as const
                    ).map(([key, label, id]) => (
                      <div key={key} className="col-12 col-md-6 col-xl-4">
                        <div className="form-floating mb-3">
                          <input
                            type="text"
                            className="form-control"
                            id={id}
                            placeholder={label}
                            value={draft[key]}
                            onChange={(e) => update(key, e.target.value)}
                          />
                          <label htmlFor={id}>{label}</label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="tab-pane active px-0 pb-0" role="tabpanel">
              <p className="h6 py-2 mb-2">Working Hours</p>
              <div className="row">
                <div className="col-12 col-lg-6">
                  {DAYS.slice(0, 4).map(({ key, label }) => (
                    <DayRow
                      key={key}
                      dayKey={key}
                      label={label}
                      value={draft.hours[key]}
                      onChange={(patch) => updateHours(key, patch)}
                    />
                  ))}
                </div>
                <div className="col-12 col-lg-6">
                  {DAYS.slice(4).map(({ key, label }) => (
                    <DayRow
                      key={key}
                      dayKey={key}
                      label={label}
                      value={draft.hours[key]}
                      onChange={(patch) => updateHours(key, patch)}
                    />
                  ))}
                </div>
              </div>
              <div className="form-check mt-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="sw-same-online"
                  checked={draft.sameForOnline}
                  onChange={(e) => update("sameForOnline", e.target.checked)}
                />
                <label className="form-check-label" htmlFor="sw-same-online">
                  Working hours same for online bookings
                </label>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="tab-pane active px-0 pb-0" role="tabpanel">
              <div className="row align-items-center mb-2">
                <div className="col">
                  <p className="h6 py-2">Services</p>
                </div>
              </div>
              <div className="row">
                {MODULE_OPTIONS.map((opt) => {
                  const on = draft.modules[opt.key] !== false;
                  return (
                    <div key={opt.key} className="col-12 col-md-6 col-xl-4">
                      <label className={`aux-sw-service${on ? " is-on" : ""}`}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={on}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              modules: { ...prev.modules, [opt.key]: e.target.checked },
                            }))
                          }
                        />
                        <span>
                          <strong>{opt.label}</strong>
                          <small>{opt.hint}</small>
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
              {savedFlash ? (
                <p className="aux-sw-saved mt-3 mb-0">Household setup saved.</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="aux-sw-toolbar">
        <a className="btn btn-outline-accent float-start" href="#smartwizard-skip" onClick={(e) => {
          e.preventDefault();
          persist(true);
        }}>
          Skip
        </a>
        <div className="aux-sw-toolbar-end">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={isFirst}
            onClick={goPrev}
          >
            Previous
          </button>
          <button type="button" className="btn btn-theme" onClick={goNext}>
            {isLast ? "Finish" : "Next"}
          </button>
        </div>
      </div>

      <div className="progress bg-theme-1-subtle rounded-0">
        <div
          className="progress-bar bg-theme-accent-l-gradient h-100 rounded-0"
          role="progressbar"
          style={{ width: `${progressPct}%` }}
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

function DayRow({
  dayKey,
  label,
  value,
  onChange,
}: {
  dayKey: DayKey;
  label: string;
  value: DayHours;
  onChange: (patch: Partial<DayHours>) => void;
}) {
  return (
    <div className="row align-items-center">
      <div className="col-auto py-2 mb-3">
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            id={`sw-${dayKey}`}
            checked={value.open}
            onChange={(e) => onChange({ open: e.target.checked })}
          />
          <label className="form-check-label" htmlFor={`sw-${dayKey}`}>
            Open
          </label>
        </div>
      </div>
      <div className="col mb-3">
        <p className="mb-0">{label}</p>
      </div>
      <div className="col mb-3">
        <div className="form-floating">
          <input
            type="time"
            className="form-control"
            id={`sw-start-${dayKey}`}
            value={value.start}
            disabled={!value.open}
            onChange={(e) => onChange({ start: e.target.value })}
          />
          <label htmlFor={`sw-start-${dayKey}`}>Start Time</label>
        </div>
      </div>
      <div className="col mb-3">
        <div className="form-floating">
          <input
            type="time"
            className="form-control"
            id={`sw-end-${dayKey}`}
            value={value.end}
            disabled={!value.open}
            onChange={(e) => onChange({ end: e.target.value })}
          />
          <label htmlFor={`sw-end-${dayKey}`}>End Time</label>
        </div>
      </div>
    </div>
  );
}
