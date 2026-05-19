import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { AuthProvider } from "./auth";
import App from "./App";
import "./styles.css";
import { initAppThemeFromStorage } from "./lib/appTheme";
import { UiCustomizationProvider } from "./context/UiCustomizationContext";

initAppThemeFromStorage();

registerSW({
  immediate: true,
  onRegisterError(error) {
    console.warn("[pwa] Service worker registration failed — app still runs:", error);
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <UiCustomizationProvider>
        <App />
      </UiCustomizationProvider>
    </AuthProvider>
  </StrictMode>,
);
