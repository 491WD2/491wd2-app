import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BUILD_PAGE_EDIT_INTENT_OPTIONS,
  BUILD_PAGE_PROGRESS_ROADMAP,
  BUILD_PAGE_SHAPE_OPTIONS,
  BUILD_PAGE_SIMPLE_PATH,
  BUILD_PAGE_TOOL_CARDS,
  BUILD_PAGE_TYPE_OPTIONS,
  BUILD_PAGE_WIZARD_BACKEND_VIEWS,
  BUILD_PAGE_WIZARD_STEPS,
  findBuildPageEditProfile,
  findBuildPageEditFileMap,
  formatBuildPlanPrompt,
  formatEditFileLocations,
  formatEditPagePrompt,
  formatTargetedEditPrompt,
  resolveBuildPageRecommendation,
} from "../lib/buildPageWizardContent";
import type { BuildPageEditIntentId, BuildPageShapeId, BuildPageTypeId, BuildPageWizardMode } from "../types/buildPageWizard";

export type BuildPageWizardPageProps = {
  onSelectBackendView?: (viewId: string) => void;
};

const COPY_BUILD_OK = "Build plan copied";
const COPY_EDIT_OK = "Edit prompt copied";
const COPY_FILE_LOCATIONS_OK = "File locations copied";
const COPY_TARGETED_EDIT_OK = "Targeted edit prompt copied";

function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
  return Promise.resolve();
}

export default function BuildPageWizardPage({ onSelectBackendView }: BuildPageWizardPageProps) {
  const [mode, setMode] = useState<BuildPageWizardMode>("create");
  const [selectedId, setSelectedId] = useState<BuildPageTypeId>("pantry");
  const [selectedShapeId, setSelectedShapeId] = useState<BuildPageShapeId | null>(null);
  const [selectedEditIntentId, setSelectedEditIntentId] = useState<BuildPageEditIntentId | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = useMemo(
    () => BUILD_PAGE_TYPE_OPTIONS.find((page) => page.id === selectedId) ?? BUILD_PAGE_TYPE_OPTIONS[0],
    [selectedId],
  );

  const selectedShape = useMemo(
    () => BUILD_PAGE_SHAPE_OPTIONS.find((shape) => shape.id === selectedShapeId) ?? null,
    [selectedShapeId],
  );

  const selectedEditIntent = useMemo(
    () => BUILD_PAGE_EDIT_INTENT_OPTIONS.find((intent) => intent.id === selectedEditIntentId) ?? null,
    [selectedEditIntentId],
  );

  const editProfile = useMemo(() => findBuildPageEditProfile(selected.id), [selected.id]);
  const editFileMap = useMemo(() => findBuildPageEditFileMap(selected.id), [selected.id]);

  const recommendation = useMemo(
    () => resolveBuildPageRecommendation(selected, selectedShape),
    [selected, selectedShape],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const showCopyStatus = useCallback((message: string, duration = 2600) => {
    setCopyStatus(message);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => setCopyStatus(null), duration);
  }, []);

  const copyPrompt = useCallback(
    (text: string, successMessage: string) => {
      copyTextToClipboard(text)
        .then(() => showCopyStatus(successMessage))
        .catch(() => {
          try {
            copyTextToClipboard(text);
            showCopyStatus(successMessage);
          } catch {
            showCopyStatus("Copy failed — select text manually", 3200);
          }
        });
    },
    [showCopyStatus],
  );

  const copyBuildPlan = useCallback(() => {
    copyPrompt(formatBuildPlanPrompt(selected, selectedShape), COPY_BUILD_OK);
  }, [copyPrompt, selected, selectedShape]);

  const copyEditPrompt = useCallback(() => {
    if (!selectedEditIntent) {
      return;
    }
    copyPrompt(formatEditPagePrompt(selected, editProfile, selectedEditIntent), COPY_EDIT_OK);
  }, [copyPrompt, editProfile, selected, selectedEditIntent]);

  const copyFileLocations = useCallback(() => {
    copyPrompt(formatEditFileLocations(selected, editFileMap), COPY_FILE_LOCATIONS_OK);
  }, [copyPrompt, editFileMap, selected]);

  const copyTargetedEditPrompt = useCallback(() => {
    if (!selectedEditIntent) {
      return;
    }
    copyPrompt(formatTargetedEditPrompt(selected, editFileMap, selectedEditIntent), COPY_TARGETED_EDIT_OK);
  }, [copyPrompt, editFileMap, selected, selectedEditIntent]);

  const openTool = useCallback(
    (viewId: string) => {
      onSelectBackendView?.(viewId);
    },
    [onSelectBackendView],
  );

  const selectPageType = useCallback((pageId: BuildPageTypeId) => {
    setSelectedId(pageId);
    setSelectedShapeId(null);
    setSelectedEditIntentId(null);
  }, []);

  const selectShape = useCallback((shapeId: BuildPageShapeId, pageId: BuildPageTypeId) => {
    setSelectedShapeId(shapeId);
    setSelectedId(pageId);
  }, []);

  const switchMode = useCallback((nextMode: BuildPageWizardMode) => {
    setMode(nextMode);
    setCopyStatus(null);
    setSelectedEditIntentId(null);
    if (nextMode === "edit") {
      setSelectedShapeId(null);
    }
  }, []);

  return (
    <div className="wd-build-page-wizard">
      <header className="wd-build-page-wizard__hero">
        <p className="wd-build-page-wizard__eyebrow">491WD · Guided build</p>
        <h1 className="wd-build-page-wizard__title">Build a Page</h1>
        <p className="wd-build-page-wizard__subtitle">
          {mode === "create"
            ? "Start here to choose a page, understand each Backend Console tool, and copy a build plan without jumping between every advanced surface."
            : "Pick a live page, choose what to change, and copy a focused edit prompt without opening every builder tool."}
        </p>
      </header>

      <section className="wd-build-page-wizard__mode" aria-labelledby="wd-build-page-mode-title">
        <h2 id="wd-build-page-mode-title" className="wd-build-page-wizard__section-title">
          Workflow
        </h2>
        <div className="wd-build-page-wizard__mode-row" role="group" aria-label="Build a Page workflow mode">
          <button
            type="button"
            className={
              mode === "create"
                ? "wd-build-page-wizard__mode-btn wd-build-page-wizard__mode-btn--active"
                : "wd-build-page-wizard__mode-btn"
            }
            onClick={() => switchMode("create")}
            aria-pressed={mode === "create"}
          >
            Create New Page
          </button>
          <button
            type="button"
            className={
              mode === "edit"
                ? "wd-build-page-wizard__mode-btn wd-build-page-wizard__mode-btn--active"
                : "wd-build-page-wizard__mode-btn"
            }
            onClick={() => switchMode("edit")}
            aria-pressed={mode === "edit"}
          >
            Edit Existing Page
          </button>
        </div>
      </section>

      {mode === "create" ? (
        <section className="wd-build-page-wizard__simple-path" aria-labelledby="wd-build-page-simple-path-title">
          <h2 id="wd-build-page-simple-path-title" className="wd-build-page-wizard__section-title">
            {BUILD_PAGE_SIMPLE_PATH.title}
          </h2>
          <ol className="wd-build-page-wizard__simple-path-list">
            {BUILD_PAGE_SIMPLE_PATH.steps.map((step, index) => (
              <li key={step}>
                <span className="wd-build-page-wizard__simple-path-num">{index + 1}</span>
                <span className="wd-build-page-wizard__simple-path-copy">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="wd-build-page-wizard__tools" aria-labelledby="wd-build-page-tools-title">
        <h2 id="wd-build-page-tools-title" className="wd-build-page-wizard__section-title">
          What each tool is for
        </h2>
        <ul className="wd-build-page-wizard__tool-grid">
          {BUILD_PAGE_TOOL_CARDS.map((tool) => (
            <li key={tool.id}>
              <article
                className={
                  tool.startHere
                    ? "wd-build-page-wizard__tool-card wd-build-page-wizard__tool-card--start"
                    : "wd-build-page-wizard__tool-card"
                }
              >
                <h3 className="wd-build-page-wizard__tool-title">{tool.title}</h3>
                <p className="wd-build-page-wizard__tool-copy">{tool.summary}</p>
                {tool.startHere ? (
                  <p className="wd-build-page-wizard__tool-badge">Start here</p>
                ) : tool.backendViewId ? (
                  <button
                    type="button"
                    className="wd-build-page-wizard__btn wd-build-page-wizard__btn--secondary"
                    onClick={() => openTool(tool.backendViewId!)}
                  >
                    Open {tool.title}
                  </button>
                ) : (
                  <p className="wd-build-page-wizard__tool-note">Switch to the My Build tab in the app header.</p>
                )}
              </article>
            </li>
          ))}
        </ul>
      </section>

      {mode === "create" ? (
        <section className="wd-build-page-wizard__building" aria-labelledby="wd-build-page-building-title">
          <h2 id="wd-build-page-building-title" className="wd-build-page-wizard__section-title">
            I am building…
          </h2>
          <div className="wd-build-page-wizard__shape-row" role="group" aria-label="Quick page shape choices">
            {BUILD_PAGE_SHAPE_OPTIONS.map((shape) => (
              <button
                key={shape.id}
                type="button"
                className={
                  selectedShapeId === shape.id
                    ? "wd-build-page-wizard__shape-btn wd-build-page-wizard__shape-btn--active"
                    : "wd-build-page-wizard__shape-btn"
                }
                onClick={() => selectShape(shape.id, shape.matchPageId)}
                aria-pressed={selectedShapeId === shape.id}
              >
                {shape.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {mode === "create" ? (
        <ol className="wd-build-page-wizard__steps" aria-label="Build a Page planning steps">
          {BUILD_PAGE_WIZARD_STEPS.map((step) => (
            <li key={step.number} className="wd-build-page-wizard__step">
              <span className="wd-build-page-wizard__step-num">Step {step.number}</span>
              <h2 className="wd-build-page-wizard__step-title">{step.title}</h2>
              <p className="wd-build-page-wizard__step-copy">{step.summary}</p>
            </li>
          ))}
        </ol>
      ) : null}

      <div className="wd-build-page-wizard__layout">
        <section className="wd-build-page-wizard__types" aria-labelledby="wd-build-page-types-title">
          <h2 id="wd-build-page-types-title" className="wd-build-page-wizard__section-title">
            {mode === "create" ? "Page types" : "Pages to edit"}
          </h2>
          <ul className="wd-build-page-wizard__type-grid">
            {BUILD_PAGE_TYPE_OPTIONS.map((page) => (
              <li key={page.id}>
                <button
                  type="button"
                  className={
                    selectedId === page.id
                      ? "wd-build-page-wizard__type-card wd-build-page-wizard__type-card--selected"
                      : "wd-build-page-wizard__type-card"
                  }
                  onClick={() => selectPageType(page.id)}
                  aria-pressed={selectedId === page.id}
                >
                  <h3 className="wd-build-page-wizard__type-title">{page.title}</h3>
                  <p className="wd-build-page-wizard__type-desc">{page.description}</p>
                  {mode === "create" ? (
                    <dl className="wd-build-page-wizard__type-meta">
                      <div>
                        <dt>Recommended layout</dt>
                        <dd>{page.recommendedLayout}</dd>
                      </div>
                      <div>
                        <dt>Best source style</dt>
                        <dd>{page.bestSourceStyle}</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="wd-build-page-wizard__type-edit-hint">
                      Current layout: {findBuildPageEditProfile(page.id).currentLayoutType}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <aside className="wd-build-page-wizard__detail" aria-live="polite">
          {mode === "create" ? (
            <section className="wd-build-page-wizard__progress" aria-labelledby="wd-build-page-progress-title">
              <h2 id="wd-build-page-progress-title" className="wd-build-page-wizard__detail-eyebrow">
                Recommended next pages
              </h2>
              <p className="wd-build-page-wizard__progress-current">{BUILD_PAGE_PROGRESS_ROADMAP.currentLabel}</p>
              <ul className="wd-build-page-wizard__progress-list">
                {BUILD_PAGE_PROGRESS_ROADMAP.upcoming.map((item) => (
                  <li key={item.label}>
                    {item.pageId ? (
                      <button
                        type="button"
                        className="wd-build-page-wizard__progress-link"
                        onClick={() => selectPageType(item.pageId!)}
                      >
                        {item.label}
                      </button>
                    ) : (
                      item.label
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className="wd-build-page-wizard__detail-eyebrow">
            {mode === "create" ? "Selected page" : "Page to edit"}
          </p>
          <h2 className="wd-build-page-wizard__detail-title">{selected.title}</h2>

          {mode === "create" ? (
            <>
              <dl className="wd-build-page-wizard__detail-dl">
                {selectedShape ? (
                  <div>
                    <dt>Building shape</dt>
                    <dd>{selectedShape.label}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Page name</dt>
                  <dd>{selected.title}</dd>
                </div>
                <div>
                  <dt>Recommended layout</dt>
                  <dd>{recommendation.recommendedLayout}</dd>
                </div>
                <div>
                  <dt>Recommended source style</dt>
                  <dd>{recommendation.bestSourceStyle}</dd>
                </div>
                <div>
                  <dt>Recommended source examples</dt>
                  <dd>
                    <ul>
                      {selected.recommendedSourceExamples.map((example) => (
                        <li key={example}>{example}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div>
                  <dt>Suggested sections</dt>
                  <dd>
                    <ul>
                      {selected.suggestedSections.map((section) => (
                        <li key={section}>{section}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div>
                  <dt>Next action</dt>
                  <dd>Copy the build plan here first. Open Template Workbench only when you need visual examples.</dd>
                </div>
              </dl>

              <div className="wd-build-page-wizard__actions">
                <button
                  type="button"
                  className="wd-build-page-wizard__btn wd-build-page-wizard__btn--primary"
                  onClick={copyBuildPlan}
                >
                  Create Build Plan
                </button>
                {copyStatus ? (
                  <p className="wd-build-page-wizard__status" role="status">
                    {copyStatus}
                  </p>
                ) : null}
                <div className="wd-build-page-wizard__secondary">
                  <button
                    type="button"
                    className="wd-build-page-wizard__btn wd-build-page-wizard__btn--secondary"
                    onClick={() => openTool(BUILD_PAGE_WIZARD_BACKEND_VIEWS.templateWorkbench)}
                  >
                    Open Template Workbench
                  </button>
                  <button
                    type="button"
                    className="wd-build-page-wizard__btn wd-build-page-wizard__btn--secondary"
                    onClick={() => openTool(BUILD_PAGE_WIZARD_BACKEND_VIEWS.uiBuilder)}
                  >
                    Open UI Builder
                  </button>
                  <button
                    type="button"
                    className="wd-build-page-wizard__btn wd-build-page-wizard__btn--secondary"
                    onClick={() => openTool(BUILD_PAGE_WIZARD_BACKEND_VIEWS.pageComposer)}
                  >
                    Open Page Composer
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <dl className="wd-build-page-wizard__detail-dl">
                <div>
                  <dt>Current page purpose</dt>
                  <dd>{editProfile.pagePurpose}</dd>
                </div>
                <div>
                  <dt>Current layout type</dt>
                  <dd>{editProfile.currentLayoutType}</dd>
                </div>
                <div>
                  <dt>Editable areas</dt>
                  <dd>
                    <ul>
                      {editProfile.editableAreas.map((area) => (
                        <li key={area}>{area}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div>
                  <dt>Suggested edit actions</dt>
                  <dd>
                    <ul>
                      {editProfile.suggestedEditActions.map((action) => (
                        <li key={action}>{action}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div>
                  <dt>Related tools</dt>
                  <dd>
                    <ul className="wd-build-page-wizard__related-tools">
                      {editProfile.relatedTools.map((tool) => (
                        <li key={tool.label}>
                          {tool.backendViewId ? (
                            <button
                              type="button"
                              className="wd-build-page-wizard__progress-link"
                              onClick={() => openTool(tool.backendViewId!)}
                            >
                              {tool.label}
                            </button>
                          ) : (
                            tool.label
                          )}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>

              <section className="wd-build-page-wizard__where-to-edit" aria-labelledby="wd-build-page-where-to-edit-title">
                <h2 id="wd-build-page-where-to-edit-title" className="wd-build-page-wizard__detail-eyebrow">
                  Where to edit
                </h2>
                <p
                  className={
                    editFileMap.built
                      ? "wd-build-page-wizard__where-status"
                      : "wd-build-page-wizard__where-status wd-build-page-wizard__where-status--planned"
                  }
                >
                  {editFileMap.built
                    ? "Live files in the repo — start with the paths below."
                    : "Not built yet — planned paths only."}
                </p>
                {editFileMap.availabilityNote ? (
                  <p className="wd-build-page-wizard__where-note">{editFileMap.availabilityNote}</p>
                ) : null}
                <ul className="wd-build-page-wizard__where-list">
                  {editFileMap.entries.map((entry) => (
                    <li key={`${entry.label}-${entry.path}`}>
                      <span className="wd-build-page-wizard__where-label">{entry.label}</span>
                      <code className="wd-build-page-wizard__where-path">{entry.path}</code>
                      <span
                        className={
                          entry.status === "planned"
                            ? "wd-build-page-wizard__where-badge wd-build-page-wizard__where-badge--planned"
                            : "wd-build-page-wizard__where-badge"
                        }
                      >
                        {entry.status === "planned" ? "Planned" : "Existing"}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="wd-build-page-wizard__edit-intents" aria-labelledby="wd-build-page-edit-intents-title">
                <h2 id="wd-build-page-edit-intents-title" className="wd-build-page-wizard__detail-eyebrow">
                  Edit intent
                </h2>
                <div className="wd-build-page-wizard__intent-row" role="group" aria-label="Edit intent choices">
                  {BUILD_PAGE_EDIT_INTENT_OPTIONS.map((intent) => (
                    <button
                      key={intent.id}
                      type="button"
                      className={
                        selectedEditIntentId === intent.id
                          ? "wd-build-page-wizard__intent-btn wd-build-page-wizard__intent-btn--active"
                          : "wd-build-page-wizard__intent-btn"
                      }
                      onClick={() => setSelectedEditIntentId(intent.id)}
                      aria-pressed={selectedEditIntentId === intent.id}
                    >
                      {intent.label}
                    </button>
                  ))}
                </div>
              </section>

              <div className="wd-build-page-wizard__actions">
                <button
                  type="button"
                  className="wd-build-page-wizard__btn wd-build-page-wizard__btn--primary"
                  onClick={copyEditPrompt}
                  disabled={!selectedEditIntent}
                >
                  Copy Edit Prompt
                </button>
                <div className="wd-build-page-wizard__secondary">
                  <button
                    type="button"
                    className="wd-build-page-wizard__btn wd-build-page-wizard__btn--secondary"
                    onClick={copyFileLocations}
                  >
                    Copy file locations
                  </button>
                  <button
                    type="button"
                    className="wd-build-page-wizard__btn wd-build-page-wizard__btn--secondary"
                    onClick={copyTargetedEditPrompt}
                    disabled={!selectedEditIntent}
                  >
                    Copy targeted edit prompt
                  </button>
                </div>
                {copyStatus ? (
                  <p className="wd-build-page-wizard__status" role="status">
                    {copyStatus}
                  </p>
                ) : null}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
