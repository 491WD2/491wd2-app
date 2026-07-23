import { RotateCcw } from "lucide-react";
import { useUiCustomization } from "../../context/UiCustomizationContext";
import { Button } from "../ui/Button";
import { Card, CardHeader } from "../ui/Card";
import { Input, Select } from "../ui/Field";
import { cn } from "../../lib/utils";
import {
  PAGE_SECTIONS_BY_ROUTE,
  type PageSectionDef,
} from "../../lib/pageLayoutSectionCatalog";
import type { PageLayoutRouteKey } from "../../lib/pageLayoutPreferences";
import { SMARTHR_DEFAULT_APPEARANCE } from "../../lib/appearancePreferences";
import type { TextColorPreset } from "../../lib/appearancePreferences";
import {
  ADMINUX_ACCENT_HEX,
  ADMINUX_ACCENT_LABELS,
  ADMINUX_ACCENT_PRESETS,
  ADMINUX_PAGE_BG_LABELS,
  ADMINUX_PAGE_BG_PRESETS,
  ADMINUX_PAGE_BG_SWATCH,
} from "../../lib/adminuxTheme";

const PAGE_LABEL: Record<PageLayoutRouteKey, string> = {
  home: "Home",
  calendar: "Calendar",
  shopping: "Shopping",
  pantry: "Pantry",
  tasks: "Cleaning",
  pets: "Pets",
  settings: "Settings",
};

const PAGE_ORDER: PageLayoutRouteKey[] = [
  "home",
  "calendar",
  "shopping",
  "pantry",
  "tasks",
  "pets",
  "settings",
];

const TEXT_PRESET_LABEL: Record<TextColorPreset, string> = {
  default: "Default",
  highContrast: "High contrast",
  soft: "Soft",
};

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="grid gap-1.5 sm:grid-cols-[8rem_1fr] sm:items-center sm:gap-3">
      <span className="text-sm font-medium text-[#1f1f1f]">{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="color"
          aria-label={label}
          className="h-10 w-14 cursor-pointer rounded-md border border-[#ededed] bg-white"
          value={normalizeHexColor(value)}
          onChange={(e) => onChange(e.target.value)}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="min-w-[8rem] flex-1 font-mono text-sm" />
      </div>
    </label>
  );
}

function normalizeHexColor(raw: string): string {
  const s = raw.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) {
    return s;
  }
  return "#3b6ef5";
}

export function AppearanceLayoutEditor() {
  const {
    appearance,
    updateAppearance,
    resetAppearance,
    setTextPreset,
    setPageBgPreset,
    setThemeAccent,
    pageLayout,
    updateGlobalLayout,
    resetPageLayouts,
  } = useUiCustomization();

  const g = pageLayout.global;

  return (
    <div className="space-y-5">
      <Card tone="light">
        <CardHeader tone="light" title="Background Color" eyebrow="AdminUX theme" />
        <p className="mb-2 text-sm font-medium text-[#475569]">
          Choose your desired theme color
        </p>
        <p className="mb-4 text-sm text-[#64748b]">
          Soft pastel page backgrounds inspired by AdminUX (None, White, Theme, Grad-1…10). Keep
          enough contrast between background and text. Saved on this device in{" "}
          <span className="font-mono text-xs">familysite-491:appearance</span> — household data is
          not modified.
        </p>
        <div className="fs-bg-swatch-grid" role="group" aria-label="Page background presets">
          {ADMINUX_PAGE_BG_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className="fs-bg-swatch"
              aria-pressed={appearance.pageBgPreset === preset}
              aria-label={ADMINUX_PAGE_BG_LABELS[preset]}
              onClick={() => setPageBgPreset(preset)}
            >
              <span
                className="fs-bg-swatch__circle"
                style={{
                  background: ADMINUX_PAGE_BG_SWATCH[preset],
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {preset === "none" ? (
                  <RotateCcw className="h-4 w-4 text-slate-500" aria-hidden />
                ) : null}
              </span>
              <span>{ADMINUX_PAGE_BG_LABELS[preset]}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card tone="light">
        <CardHeader tone="light" title="Theme accent colors" eyebrow="Buttons &amp; highlights" />
        <p className="mb-4 text-sm text-[#64748b]">
          AdminUX-style accent presets (Theme, Accent, Success, Warning, Orange, Purple, Teal…).
          Updates primary buttons, gradients, and sidebar active color.
        </p>
        <div className="fs-accent-swatch-grid" role="group" aria-label="Theme accent presets">
          {ADMINUX_ACCENT_PRESETS.map((accent) => (
            <button
              key={accent}
              type="button"
              className="fs-accent-swatch"
              style={{ background: ADMINUX_ACCENT_HEX[accent] }}
              aria-pressed={appearance.themeAccent === accent}
              onClick={() => setThemeAccent(accent)}
            >
              {ADMINUX_ACCENT_LABELS[accent]}
            </button>
          ))}
        </div>
      </Card>

      <Card tone="light">
        <CardHeader tone="light" title="Color &amp; type" eyebrow="Appearance" />
        <p className="mb-4 text-sm text-[#575757]">
          Fine-tune individual colors. Presets above set these automatically. Saved in{" "}
          <span className="font-mono text-xs">familysite-491:appearance</span>.
        </p>
        <div className="space-y-4">
          <ColorField
            label="Primary"
            value={appearance.primary}
            onChange={(v) => updateAppearance({ primary: v })}
          />
          <ColorField
            label="Gradient start"
            value={appearance.gradientStart}
            onChange={(v) => updateAppearance({ gradientStart: v })}
          />
          <ColorField
            label="Gradient end"
            value={appearance.gradientEnd}
            onChange={(v) => updateAppearance({ gradientEnd: v })}
          />
          <ColorField
            label="Page background"
            value={appearance.pageBackground}
            onChange={(v) => updateAppearance({ pageBackground: v })}
          />
          <ColorField
            label="Card background"
            value={appearance.cardBackground}
            onChange={(v) => updateAppearance({ cardBackground: v })}
          />
          <ColorField
            label="Sidebar active background"
            value={appearance.sidebarActiveBg}
            onChange={(v) => updateAppearance({ sidebarActiveBg: v })}
          />
          <ColorField
            label="Sidebar active text"
            value={appearance.sidebarActiveText}
            onChange={(v) => updateAppearance({ sidebarActiveText: v })}
          />

          <div className="grid gap-1.5 sm:grid-cols-[8rem_1fr] sm:items-center sm:gap-3">
            <span className="text-sm font-medium text-[#1f1f1f]">Text preset</span>
            <Select
              value={appearance.textPreset}
              onChange={(e) => setTextPreset(e.target.value as TextColorPreset)}
            >
              {(Object.keys(TEXT_PRESET_LABEL) as TextColorPreset[]).map((k) => (
                <option key={k} value={k}>
                  {TEXT_PRESET_LABEL[k]}
                </option>
              ))}
            </Select>
          </div>

          <ColorField
            label="Body text (primary)"
            value={appearance.textPrimary}
            onChange={(v) => updateAppearance({ textPrimary: v })}
          />
          <ColorField
            label="Muted text"
            value={appearance.textMuted}
            onChange={(v) => updateAppearance({ textMuted: v })}
          />

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="font-semibold"
              onClick={() => resetAppearance()}
            >
              Reset to AdminUX default
            </Button>
          </div>
          <p className="text-xs text-[#637381]">
            Defaults use AdminUX theme blue ({SMARTHR_DEFAULT_APPEARANCE.primary}) with Grad-1 page
            background.
          </p>
        </div>
      </Card>

      <Card tone="light">
        <CardHeader tone="light" title="Page layout" eyebrow="Workspace" />
        <p className="mb-4 text-sm text-[#575757]">
          Stored in <span className="font-mono text-xs">familysite-491:page-layouts</span>. Sidebar
          state stays synced with the legacy key for older builds.
        </p>

        <div className="mb-6 space-y-3 rounded-lg border border-[#ededed] bg-[#fafafa] p-4">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#637381]">
            Global defaults
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-[#1f1f1f]">Card density</span>
              <Select
                value={g.cardDensity}
                onChange={(e) =>
                  updateGlobalLayout({
                    cardDensity: e.target.value as "compact" | "comfortable",
                  })
                }
              >
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </Select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-[#1f1f1f]">Page width</span>
              <Select
                value={g.pageWidth}
                onChange={(e) =>
                  updateGlobalLayout({
                    pageWidth: e.target.value as "standard" | "wide",
                  })
                }
              >
                <option value="standard">Standard</option>
                <option value="wide">Wide</option>
              </Select>
            </label>
          </div>
          <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#ededed] bg-white px-3 py-2.5 shadow-[0_1px_1px_rgba(0,0,0,0.06)]">
            <span className="text-sm font-medium text-[#1f1f1f]">Sidebar collapsed (desktop)</span>
            <input
              type="checkbox"
              className="h-5 w-5 accent-[#F26522]"
              checked={g.sidebarCollapsed}
              onChange={(e) => updateGlobalLayout({ sidebarCollapsed: e.target.checked })}
            />
          </label>
        </div>

        <div className="space-y-4">
          {PAGE_ORDER.map((route) => (
            <RouteLayoutBlock
              key={route}
              route={route}
              label={PAGE_LABEL[route]}
              sections={PAGE_SECTIONS_BY_ROUTE[route]}
            />
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-[#ededed] pt-4">
          <Button type="button" variant="secondary" className="font-semibold" onClick={resetPageLayouts}>
            Reset page layout preferences
          </Button>
          <p className="w-full text-xs text-[#637381]">
            Keeps the current sidebar expanded/collapsed state; clears per-page overrides and section
            visibility (Home sections return to default).
          </p>
        </div>
      </Card>
    </div>
  );
}

function RouteLayoutBlock({
  route,
  label,
  sections,
}: {
  route: PageLayoutRouteKey;
  label: string;
  sections: PageSectionDef[] | null;
}) {
  const { pageLayout, updatePageLayoutEntry } = useUiCustomization();
  const entry = pageLayout.pages[route] ?? {};
  const inherit = (field: "cardDensity" | "pageWidth") =>
    entry[field] === undefined ? "inherit" : entry[field]!;

  return (
    <div
      className={cn(
        "rounded-lg border border-[#ededed] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.06)]",
      )}
    >
      <p className="text-[15px] font-semibold text-[#1f1f1f]">{label}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-[#575757]">Card density</span>
          <Select
            value={inherit("cardDensity")}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "inherit") {
                updatePageLayoutEntry(route, { cardDensity: undefined });
              } else {
                updatePageLayoutEntry(route, {
                  cardDensity: v as "compact" | "comfortable",
                });
              }
            }}
          >
            <option value="inherit">Use global default</option>
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-[#575757]">Page width</span>
          <Select
            value={inherit("pageWidth")}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "inherit") {
                updatePageLayoutEntry(route, { pageWidth: undefined });
              } else {
                updatePageLayoutEntry(route, { pageWidth: v as "standard" | "wide" });
              }
            }}
          >
            <option value="inherit">Use global default</option>
            <option value="standard">Standard</option>
            <option value="wide">Wide</option>
          </Select>
        </label>
      </div>

      {sections && sections.length > 0 ? (
        <div className="mt-4 space-y-2 border-t border-[#f0f0f0] pt-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#637381]">
            Sections (optional)
          </p>
          <ul className="space-y-2">
            {sections.map((s) => {
              const raw = pageLayout.pages[route]?.sections?.[s.id];
              const checked = raw !== false;
              return (
                <li key={s.id}>
                  <label className="flex cursor-pointer items-start justify-between gap-3 rounded-md border border-transparent px-1 py-1 hover:bg-[#fafafa]">
                    <span>
                      <span className="text-sm font-medium text-[#1f1f1f]">{s.label}</span>
                      {s.description ? (
                        <span className="mt-0.5 block text-xs text-[#637381]">{s.description}</span>
                      ) : null}
                    </span>
                    <input
                      type="checkbox"
                      className="mt-0.5 h-5 w-5 shrink-0 accent-[#F26522]"
                      checked={checked}
                      onChange={(e) =>
                        updatePageLayoutEntry(route, {
                          sections: { [s.id]: e.target.checked },
                        })
                      }
                    />
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="mt-3 text-xs text-[#637381]">No optional section toggles for this page.</p>
      )}
    </div>
  );
}
