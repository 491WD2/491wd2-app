export type BuildPageWizardMode = "create" | "edit";

export type BuildPageEditIntentId =
  | "change-layout"
  | "edit-cards-sections"
  | "edit-text"
  | "edit-table-list"
  | "edit-colors-style"
  | "add-section"
  | "remove-section";

export type BuildPageEditIntentOption = {
  id: BuildPageEditIntentId;
  label: string;
  promptLabel: string;
};

export type BuildPageEditRelatedTool = {
  label: string;
  backendViewId?: string;
};

export type BuildPageEditProfile = {
  pageId: BuildPageTypeId;
  pagePurpose: string;
  currentLayoutType: string;
  editableAreas: string[];
  suggestedEditActions: string[];
  relatedTools: BuildPageEditRelatedTool[];
};

export type BuildPageTypeId =
  | "home"
  | "pantry"
  | "shopping"
  | "tasks"
  | "calendar"
  | "messages"
  | "notes"
  | "custom";

export type BuildPageShapeId =
  | "list-table"
  | "card-page"
  | "form-page"
  | "dashboard"
  | "task-board"
  | "notes-page";

export type BuildPageWizardStep = {
  number: 1 | 2 | 3 | 4;
  title: string;
  summary: string;
};

export type BuildPageTypeOption = {
  id: BuildPageTypeId;
  title: string;
  description: string;
  recommendedLayout: string;
  bestSourceStyle: string;
  recommendedSourceExamples: string[];
  suggestedSections: string[];
};

export type BuildPageShapeOption = {
  id: BuildPageShapeId;
  label: string;
  recommendedLayout: string;
  bestSourceStyle: string;
  matchPageId: BuildPageTypeId;
};

export type BuildPageToolCard = {
  id: string;
  title: string;
  summary: string;
  startHere?: boolean;
  backendViewId?: string;
};

export type BuildPageProgressItem = {
  label: string;
  pageId?: BuildPageTypeId;
};

export type BuildPageProgressRoadmap = {
  currentLabel: string;
  upcoming: BuildPageProgressItem[];
};
