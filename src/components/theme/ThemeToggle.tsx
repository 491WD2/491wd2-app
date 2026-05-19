import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { toggleThemeMode } from "../../lib/appTheme";
import { cn } from "../../lib/utils";

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}

function isDarkSnapshot() {
  return document.documentElement.classList.contains("dark");
}

export function ThemeToggle({
  collapsed,
  className,
  variant = "default",
}: {
  collapsed?: boolean;
  className?: string;
  /** Charcoal sidebar (SmartHR-style nav) — light text on translucent chip */
  variant?: "default" | "sidebar";
}) {
  const dark = useSyncExternalStore(subscribe, isDarkSnapshot, () => false);

  return (
    <button
      type="button"
      onClick={() => toggleThemeMode()}
      className={cn(
        "inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-[8px] border px-3 py-2 text-[14px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/40 focus-visible:ring-offset-2 dark:focus-visible:ring-[#FE9F43]/50 dark:focus-visible:ring-offset-[#0A1C2B]",
        variant === "sidebar"
          ? "border-[#ededed] bg-[#f8f9fa] text-[#4B5563] shadow-none hover:bg-[#f3f4f6] hover:text-[#1f1f1f] focus-visible:ring-offset-white"
          : cn(
              "focus-visible:ring-[#FE9F43]/50 focus-visible:ring-offset-white",
              "border-slate-200/90 bg-white text-slate-800 shadow-sm hover:bg-slate-50",
              "dark:border-white/[0.12] dark:bg-white/[0.06] dark:text-slate-100 dark:hover:bg-white/10",
            ),
        collapsed && "px-2",
        className,
      )}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
    >
      {dark ? <Sun className="h-5 w-5 shrink-0" aria-hidden /> : <Moon className="h-5 w-5 shrink-0" aria-hidden />}
      {!collapsed ? <span>{dark ? "Light mode" : "Dark mode"}</span> : null}
    </button>
  );
}
