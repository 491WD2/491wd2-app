import { useState } from "react";
import AppliedUiSection from "./components/AppliedUiSection";
import CurrentBuild from "./CurrentBuild";
import UiBuilderPage from "./UiBuilderPage";
import UiLayoutRenderer from "./components/UiLayoutRenderer";
import "./styles.css";
import "./ui-builder.css";

type AppView = "build" | "ui-builder" | "saved-preview";

function App() {
  const [activeView, setActiveView] = useState<AppView>("build");

  return (
    <div className="wd-integrated-app">
      <div className="wd-integrated-switcher">
        <div>
          <strong>491WD Build</strong>
          <span>Current build, UI Builder, and saved layout preview</span>
        </div>

        <div className="wd-integrated-actions">
          <button
            className={activeView === "build" ? "wd-integrated-active" : ""}
            onClick={() => setActiveView("build")}
          >
            My Build
          </button>

          <button
            className={activeView === "ui-builder" ? "wd-integrated-active" : ""}
            onClick={() => setActiveView("ui-builder")}
          >
            UI Builder
          </button>

          <button
            className={activeView === "saved-preview" ? "wd-integrated-active" : ""}
            onClick={() => setActiveView("saved-preview")}
          >
            Saved UI Preview
          </button>
        </div>
      </div>

      {activeView === "build" ? (
        <>
          <CurrentBuild />
          <AppliedUiSection />
        </>
      ) : activeView === "ui-builder" ? (
        <UiBuilderPage />
      ) : (
        <UiLayoutRenderer />
      )}
    </div>
  );
}

export default App;
