import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  BUILDER_DEMO_CHECKLIST,
  BUILDER_DEMO_COPY_PAGE_COMPOSER_PROMPT,
  BUILDER_DEMO_COPY_PANTRY_PROMPT,
  BUILDER_DEMO_COPY_UI_SECTION_PROMPT,
  BUILDER_DEMO_FLOW_STEPS,
  BUILDER_DEMO_INTERACTIVE_TABS,
  type BuilderDemoInteractiveTabId,
  BUILDER_DEMO_PANTRY_PLAN,
  BUILDER_DEMO_TOOL_CARDS,
} from "../lib/builderDemoContent";

const COPY_OK = "Prompt copied";

function useCopyWithStatus() {
  const [status, setStatus] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const copyText = useCallback((text: string) => {
    const done = () => {
      setStatus(COPY_OK);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => setStatus(null), 2600);
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => {
        try {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          done();
        } catch {
          setStatus("Copy failed — select text manually");
          if (timerRef.current) {
            clearTimeout(timerRef.current);
          }
          timerRef.current = setTimeout(() => setStatus(null), 3200);
        }
      });
    } else {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        done();
      } catch {
        setStatus("Copy failed — select text manually");
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => setStatus(null), 3200);
      }
    }
  }, []);

  return { status, copyText };
}

function DemoMockTemplateWorkbench({
  selectedSource,
  onSelectSource,
}: {
  selectedSource: string;
  onSelectSource: (source: string) => void;
}) {
  return (
    <div className="wd-demo-lab__mock wd-demo-lab__mock--workbench" aria-hidden>
      <div className="wd-demo-lab__mock-chrome">
        <span className="wd-demo-lab__mock-dot" />
        <span className="wd-demo-lab__mock-dot" />
        <span className="wd-demo-lab__mock-dot" />
        <span className="wd-demo-lab__mock-url">template-workbench · preview</span>
      </div>
      <div className="wd-demo-lab__mock-body wd-demo-lab__mock-body--cols">
        <div className="wd-demo-lab__mock-sidebar">
          <p className="wd-demo-lab__mock-label">My Picks</p>
          <ul className="wd-demo-lab__mock-pill-list">
            <li className="wd-demo-lab__mock-pill wd-demo-lab__mock-pill--hot">Sneat tables</li>
            <li className="wd-demo-lab__mock-pill">Cards pack</li>
            <li className="wd-demo-lab__mock-pill">Forms dense</li>
          </ul>
        </div>
        <div className="wd-demo-lab__mock-canvas">
          <p className="wd-demo-lab__mock-label">Live iframe (simulated)</p>
          <div className="wd-demo-lab__mock-iframe">
            <div className="wd-demo-lab__mock-iframe-bar" />
            <div className="wd-demo-lab__mock-iframe-grid" />
          </div>
        </div>
      </div>
      <div className="wd-demo-lab__mock-mapping">
        <p className="wd-demo-lab__mock-label">Pantry source map — click a row</p>
        <div className="wd-demo-lab__mock-map-rows">
          {BUILDER_DEMO_PANTRY_PLAN.map((row) => (
            <button
              key={row.source}
              type="button"
              className={
                selectedSource === row.source
                  ? "wd-demo-lab__mock-map-row wd-demo-lab__mock-map-row--active"
                  : "wd-demo-lab__mock-map-row"
              }
              onClick={() => onSelectSource(row.source)}
            >
              <span className="wd-demo-lab__mock-map-src">{row.source}</span>
              <span className="wd-demo-lab__mock-map-arrow">→</span>
              <span className="wd-demo-lab__mock-map-use">{row.use}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DemoMockSourcePreview({ source }: { source: string }) {
  return (
    <div className="wd-demo-lab__mock-preview" aria-hidden>
      <p className="wd-demo-lab__mock-label">Mini preview · {source}</p>
      {source === "Tables" ? (
        <div className="wd-demo-lab__fake-table">
          <div className="wd-demo-lab__fake-table-head">
            <span>Item</span>
            <span>Qty</span>
            <span>Expires</span>
          </div>
          <div className="wd-demo-lab__fake-table-row">
            <span>Oats</span>
            <span>2</span>
            <span className="wd-demo-lab__fake-muted">12 mo</span>
          </div>
          <div className="wd-demo-lab__fake-table-row">
            <span>Milk</span>
            <span>1</span>
            <span className="wd-demo-lab__fake-warn">3 d</span>
          </div>
        </div>
      ) : null}
      {source === "Cards" ? (
        <div className="wd-demo-lab__fake-cards">
          <div className="wd-demo-lab__fake-card">
            <p className="wd-demo-lab__fake-card-title">Cereal</p>
            <p className="wd-demo-lab__fake-card-meta">Pantry A · Low stock</p>
          </div>
          <div className="wd-demo-lab__fake-card">
            <p className="wd-demo-lab__fake-card-title">Beans</p>
            <p className="wd-demo-lab__fake-card-meta">Basement · OK</p>
          </div>
        </div>
      ) : null}
      {source === "Alerts" ? (
        <div className="wd-demo-lab__fake-alert">
          <span className="wd-demo-lab__fake-alert-icon">!</span>
          <div>
            <p className="wd-demo-lab__fake-alert-title">3 items expire this week</p>
            <p className="wd-demo-lab__fake-alert-body">Review Pantry filters and consume or freeze.</p>
          </div>
        </div>
      ) : null}
      {source === "Buttons" ? (
        <div className="wd-demo-lab__fake-actions">
          <span className="wd-demo-lab__fake-btn wd-demo-lab__fake-btn--primary">Consume</span>
          <span className="wd-demo-lab__fake-btn wd-demo-lab__fake-btn--ghost">Move</span>
          <span className="wd-demo-lab__fake-btn wd-demo-lab__fake-btn--danger">Discard</span>
        </div>
      ) : null}
      {source === "Forms" ? (
        <div className="wd-demo-lab__fake-form">
          <label className="wd-demo-lab__fake-field">
            <span className="wd-demo-lab__fake-field-label">Item name</span>
            <span className="wd-demo-lab__fake-input">Olive oil</span>
          </label>
          <label className="wd-demo-lab__fake-field">
            <span className="wd-demo-lab__fake-field-label">Location</span>
            <span className="wd-demo-lab__fake-input">Shelf 2</span>
          </label>
          <div className="wd-demo-lab__fake-form-actions">
            <span className="wd-demo-lab__fake-btn wd-demo-lab__fake-btn--primary">Save</span>
            <span className="wd-demo-lab__fake-btn wd-demo-lab__fake-btn--ghost">Cancel</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DemoMockUiSection() {
  return (
    <div className="wd-demo-lab__mock wd-demo-lab__mock--builder" aria-hidden>
      <div className="wd-demo-lab__mock-builder-top">
        <span className="wd-demo-lab__mock-badge">UI Builder</span>
        <span className="wd-demo-lab__mock-toolbar-fake">Import · Export · Apply</span>
      </div>
      <div className="wd-demo-lab__mock-builder-split">
        <div className="wd-demo-lab__mock-palette">
          <p className="wd-demo-lab__mock-label">Palette</p>
          <div className="wd-demo-lab__mock-tile">Card</div>
          <div className="wd-demo-lab__mock-tile wd-demo-lab__mock-tile--dim">Alerts</div>
          <div className="wd-demo-lab__mock-tile wd-demo-lab__mock-tile--dim">Buttons</div>
        </div>
        <div className="wd-demo-lab__mock-canvas-card">
          <div className="wd-demo-lab__mock-handle">⋮⋮</div>
          <p className="wd-demo-lab__mock-card-title">Summary strip</p>
          <p className="wd-demo-lab__mock-card-sub">Drag from palette · click to inspect</p>
        </div>
        <div className="wd-demo-lab__mock-inspector">
          <p className="wd-demo-lab__mock-label">Inspector</p>
          <div className="wd-demo-lab__mock-field">
            <span>Title</span>
            <span className="wd-demo-lab__mock-input-mini">Pantry snapshot</span>
          </div>
          <div className="wd-demo-lab__mock-field">
            <span>Variant</span>
            <span className="wd-demo-lab__mock-select-mini">Elevated ▾</span>
          </div>
          <div className="wd-demo-lab__mock-field">
            <span>Accent</span>
            <span className="wd-demo-lab__mock-swatch" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoMockPageComposer() {
  return (
    <div className="wd-demo-lab__mock wd-demo-lab__mock--composer" aria-hidden>
      <div className="wd-demo-lab__mock-composer-head">
        <span className="wd-demo-lab__mock-badge">Page Composer</span>
        <span className="wd-demo-lab__mock-page-id">Target: Pantry</span>
      </div>
      <div className="wd-demo-lab__mock-composer-body">
        <div className="wd-demo-lab__mock-drop">
          <p className="wd-demo-lab__mock-drop-label">Composed sections</p>
          <div className="wd-demo-lab__mock-slot wd-demo-lab__mock-slot--filled">
            <span className="wd-demo-lab__mock-slot-tag">UI Builder · Summary strip</span>
          </div>
          <div className="wd-demo-lab__mock-slot">Drop another section here</div>
        </div>
        <div className="wd-demo-lab__mock-storage">
          <p className="wd-demo-lab__mock-label">localStorage</p>
          <code className="wd-demo-lab__mock-code">491wd-page-composer-layouts</code>
        </div>
      </div>
    </div>
  );
}

function DemoMockPreviewApply() {
  return (
    <div className="wd-demo-lab__mock wd-demo-lab__mock--dual" aria-hidden>
      <div className="wd-demo-lab__mock-dual-col">
        <p className="wd-demo-lab__mock-label">Saved UI Preview</p>
        <div className="wd-demo-lab__mock-readonly">
          <p className="wd-demo-lab__mock-readonly-title">Layout JSON</p>
          <div className="wd-demo-lab__mock-code-block">{`{ "version": 1, "rows": […] }`}</div>
        </div>
      </div>
      <div className="wd-demo-lab__mock-dual-col">
        <p className="wd-demo-lab__mock-label">My Build → Pantry</p>
        <div className="wd-demo-lab__mock-phone">
          <div className="wd-demo-lab__mock-phone-notch" />
          <div className="wd-demo-lab__mock-phone-body">
            <p className="wd-demo-lab__mock-phone-title">Pantry</p>
            <div className="wd-demo-lab__mock-phone-chip">Composed section</div>
            <div className="wd-demo-lab__mock-phone-list" />
          </div>
        </div>
      </div>
    </div>
  );
}

const START_HERE_STEPS = [
  "Open **Template Workbench** (sidebar → Build Tools → Template Workbench).",
  "Choose a **card or list / table** source that fits how you want Pantry to look.",
  "Save it as your **Pantry source** (My Picks / chosen references in Workbench).",
  "Return to **Demo Lab** to read the tabs and prompts with that source in mind.",
  "Use **Copy Pantry Build Prompt** when you are ready to brief the next build step.",
] as const;

const COMMON_CONFUSION = [
  { term: "Template Workbench", detail: "For choosing visual sources and references — not where you assemble React." },
  { term: "UI Builder", detail: "For reusable components and sections you can export, apply, and preview." },
  { term: "Page Composer", detail: "For arranging which sections appear on which target pages (e.g. Pantry)." },
  { term: "My Build", detail: "The user-facing household app — what members see after you apply and compose." },
  { term: "Backend Console", detail: "This internal builder and admin shell — tools and docs, not the live member UI." },
] as const;

function StartHereStepLine({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <span>
      {parts.map((chunk, i) => (i % 2 === 1 ? <strong key={`b-${i}`}>{chunk}</strong> : <span key={`t-${i}`}>{chunk}</span>))}
    </span>
  );
}

export default function BuilderDemoPage() {
  const baseId = useId();
  const [activeTab, setActiveTab] = useState<BuilderDemoInteractiveTabId>("template-source");
  const [selectedSource, setSelectedSource] = useState<string>(BUILDER_DEMO_PANTRY_PLAN[0]!.source);
  const { status, copyText } = useCopyWithStatus();

  const scrollToCopyPrompts = useCallback(() => {
    document.getElementById("wd-demo-lab-copy-prompts")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="wd-demo-lab wd-demo-lab--onboarding">
      <header className="wd-demo-lab__hero">
        <p className="wd-demo-lab__eyebrow">Build Tools · Onboarding</p>
        <h2 className="wd-demo-lab__page-title">Demo Lab</h2>
        <p className="wd-demo-lab__intro">
          Learn how to choose a template source, build UI sections, compose a page, and preview or apply it — all with the
          tools already in this workspace. This page is static reference only: no backend, API, or database calls.
        </p>
      </header>

      <section className="wd-demo-lab__section wd-demo-lab__section--ruled" aria-labelledby="wd-demo-lab-start-heading">
        <div className="wd-demo-lab__section-head wd-demo-lab__section-head--row">
          <div>
            <h3 id="wd-demo-lab-start-heading" className="wd-demo-lab__section-title">
              Start here
            </h3>
            <p className="wd-demo-lab__section-lede">Recommended first practice before you wire a real Pantry page.</p>
          </div>
          <span className="wd-demo-lab__badge wd-demo-lab__badge--accent">Beginner path</span>
        </div>
        <div className="wd-demo-lab__callout">
          <ol className="wd-demo-lab__start-list">
            {START_HERE_STEPS.map((step, index) => (
              <li key={step} className="wd-demo-lab__start-item">
                <span className="wd-demo-lab__start-num" aria-hidden>
                  {index + 1}
                </span>
                <p className="wd-demo-lab__start-text">
                  <StartHereStepLine text={step} />
                </p>
              </li>
            ))}
          </ol>
          <div className="wd-demo-lab__callout-actions">
            <button type="button" className="wd-demo-lab__cta" onClick={() => copyText(BUILDER_DEMO_COPY_PANTRY_PROMPT)}>
              Copy Pantry Build Prompt
            </button>
            <button type="button" className="wd-demo-lab__cta wd-demo-lab__cta--secondary" onClick={scrollToCopyPrompts}>
              More copy prompts
            </button>
          </div>
        </div>
      </section>

      <section className="wd-demo-lab__section wd-demo-lab__section--ruled" aria-labelledby="wd-demo-lab-confusion-heading">
        <div className="wd-demo-lab__section-head">
          <h3 id="wd-demo-lab-confusion-heading" className="wd-demo-lab__section-title">
            Common confusion
          </h3>
          <p className="wd-demo-lab__section-lede">Quick definitions so you open the right tool the first time.</p>
        </div>
        <ul className="wd-demo-lab__confusion-list">
          {COMMON_CONFUSION.map((row) => (
            <li key={row.term} className="wd-demo-lab__confusion-item">
              <span className="wd-demo-lab__confusion-term">{row.term}</span>
              <span className="wd-demo-lab__confusion-detail">{row.detail}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="wd-demo-lab__section wd-demo-lab__section--ruled" aria-labelledby="wd-demo-lab-interactive-heading">
        <div className="wd-demo-lab__section-head wd-demo-lab__section-head--row">
          <div>
            <h3 id="wd-demo-lab-interactive-heading" className="wd-demo-lab__section-title">
              Interactive practice
            </h3>
            <p className="wd-demo-lab__section-lede">
              Tabs mirror the real build order. Example panels are CSS-only stand-ins — click Template Source rows to preview
              mapping styles.
            </p>
          </div>
          <span className="wd-demo-lab__badge">Hands-on</span>
        </div>

        <div className="wd-demo-lab__interactive">
          <div role="tablist" className="wd-demo-lab__tabs" aria-label="Demo practice steps">
            {BUILDER_DEMO_INTERACTIVE_TABS.map((tab) => {
              const tabId = `${baseId}-tab-${tab.id}`;
              const panelId = `${baseId}-panel-${tab.id}`;
              return (
                <button
                  key={tab.id}
                  id={tabId}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={panelId}
                  className={activeTab === tab.id ? "wd-demo-lab__tab wd-demo-lab__tab--active" : "wd-demo-lab__tab"}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {BUILDER_DEMO_INTERACTIVE_TABS.map((tab) => {
            const tabId = `${baseId}-tab-${tab.id}`;
            const panelId = `${baseId}-panel-${tab.id}`;
            return (
              <div
                key={tab.id}
                id={panelId}
                role="tabpanel"
                aria-labelledby={tabId}
                hidden={activeTab !== tab.id}
                className="wd-demo-lab__tabpanel"
              >
                <p className="wd-demo-lab__tab-intro">{tab.intro}</p>

                {tab.id === "template-source" ? (
                  <>
                    <DemoMockTemplateWorkbench selectedSource={selectedSource} onSelectSource={setSelectedSource} />
                    <DemoMockSourcePreview source={selectedSource} />
                  </>
                ) : null}
                {tab.id === "ui-section" ? <DemoMockUiSection /> : null}
                {tab.id === "page-composer" ? <DemoMockPageComposer /> : null}
                {tab.id === "preview-apply" ? <DemoMockPreviewApply /> : null}

                <div className="wd-demo-lab__next-wrap">
                  <p className="wd-demo-lab__next-title">What to do next</p>
                  <ul className="wd-demo-lab__next-list">
                    {tab.nextSteps.map((line) => (
                      <li key={line} className="wd-demo-lab__next-item">
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}

          <div id="wd-demo-lab-copy-prompts" className="wd-demo-lab__copy-bar">
            <p className="wd-demo-lab__copy-bar-label">Copy prompts</p>
            <div className="wd-demo-lab__copy-buttons">
              <button
                type="button"
                className="wd-demo-lab__copy-btn wd-demo-lab__copy-btn--primary"
                onClick={() => copyText(BUILDER_DEMO_COPY_PANTRY_PROMPT)}
              >
                Copy Pantry Build Prompt
              </button>
              <button
                type="button"
                className="wd-demo-lab__copy-btn"
                onClick={() => copyText(BUILDER_DEMO_COPY_UI_SECTION_PROMPT)}
              >
                Copy UI Section Prompt
              </button>
              <button
                type="button"
                className="wd-demo-lab__copy-btn"
                onClick={() => copyText(BUILDER_DEMO_COPY_PAGE_COMPOSER_PROMPT)}
              >
                Copy Page Composer Prompt
              </button>
            </div>
          </div>

          <p
            className={
              status && status !== COPY_OK ? "wd-demo-lab__status wd-demo-lab__status--warn" : "wd-demo-lab__status"
            }
            role="status"
            aria-live="polite"
          >
            {status ?? "\u00a0"}
          </p>
        </div>
      </section>

      <section className="wd-demo-lab__section wd-demo-lab__section--ruled" aria-labelledby="wd-demo-lab-flow-heading">
        <div className="wd-demo-lab__section-head wd-demo-lab__section-head--row">
          <div>
            <h3 id="wd-demo-lab-flow-heading" className="wd-demo-lab__section-title">
              Build flow
            </h3>
            <p className="wd-demo-lab__section-lede">Follow the numbered cards in order the first time you wire a page.</p>
          </div>
          <span className="wd-demo-lab__badge">5 steps</span>
        </div>
        <div className="wd-demo-lab__flow-grid">
          {BUILDER_DEMO_FLOW_STEPS.map((item) => (
            <article key={item.step} className="wd-demo-lab__flow-card">
              <div className="wd-demo-lab__step-badge" aria-hidden>
                {item.step}
              </div>
              <h4 className="wd-demo-lab__card-title">{item.title}</h4>
              <p className="wd-demo-lab__card-body">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="wd-demo-lab__section wd-demo-lab__section--ruled" aria-labelledby="wd-demo-lab-pantry-heading">
        <div className="wd-demo-lab__section-head">
          <h3 id="wd-demo-lab-pantry-heading" className="wd-demo-lab__section-title">
            Visual example: Pantry
          </h3>
          <p className="wd-demo-lab__section-lede">
            Static planning grid — map Template Workbench sources to Pantry-facing surfaces before touching real data.
          </p>
        </div>
        <div className="wd-demo-lab__panel">
          <table className="wd-demo-lab__table">
            <thead>
              <tr>
                <th scope="col">Template source</th>
                <th scope="col">Pantry surface</th>
                <th scope="col">Design intent</th>
              </tr>
            </thead>
            <tbody>
              {BUILDER_DEMO_PANTRY_PLAN.map((row) => (
                <tr key={row.source}>
                  <td>
                    <span className="wd-demo-lab__tag">{row.source}</span>
                  </td>
                  <td>{row.use}</td>
                  <td>{row.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="wd-demo-lab__section wd-demo-lab__section--ruled" aria-labelledby="wd-demo-lab-tools-heading">
        <div className="wd-demo-lab__section-head">
          <h3 id="wd-demo-lab-tools-heading" className="wd-demo-lab__section-title">
            What each tool is for
          </h3>
          <p className="wd-demo-lab__section-lede">Keep responsibilities separate so files stay predictable.</p>
        </div>
        <div className="wd-demo-lab__tools-grid">
          {BUILDER_DEMO_TOOL_CARDS.map((tool) => (
            <article key={tool.title} className="wd-demo-lab__tool-card">
              <h4 className="wd-demo-lab__tool-title">{tool.title}</h4>
              <p className="wd-demo-lab__card-body">{tool.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="wd-demo-lab__section wd-demo-lab__section--ruled" aria-labelledby="wd-demo-lab-check-heading">
        <div className="wd-demo-lab__section-head wd-demo-lab__section-head--row">
          <div>
            <h3 id="wd-demo-lab-check-heading" className="wd-demo-lab__section-title">
              Practice checklist
            </h3>
            <p className="wd-demo-lab__section-lede">Work top-to-bottom; check items off in your notes or task tracker.</p>
          </div>
          <span className="wd-demo-lab__badge">Deep dive</span>
        </div>
        <ol className="wd-demo-lab__checklist">
          {BUILDER_DEMO_CHECKLIST.map((line, index) => (
            <li key={line} className="wd-demo-lab__checklist-item">
              <span className="wd-demo-lab__check-index" aria-hidden>
                {index + 1}
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
