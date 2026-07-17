import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { AuthProvider } from "./auth";
import App from "./App";
import "./styles.css";
import { initAppThemeFromStorage } from "./lib/appTheme";
import { UiCustomizationProvider } from "./context/UiCustomizationContext";

initAppThemeFromStorage();

if (import.meta.env.PROD) {
  registerSW({
    immediate: true,
    onRegisterError(error) {
      console.warn("[pwa] Service worker registration failed — app still runs:", error);
    },
  });
} else if ("serviceWorker" in navigator) {
  void navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    .catch((error) => {
      console.warn("[pwa] Dev service worker cleanup failed:", error);
    });

  if (window.caches) {
    void window.caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => window.caches.delete(key))))
      .catch((error) => {
        console.warn("[pwa] Dev cache cleanup failed:", error);
      });
  }
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Missing root element");
}

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <UiCustomizationProvider>
        <App />
      </UiCustomizationProvider>
    </AuthProvider>
  </StrictMode>,
);
