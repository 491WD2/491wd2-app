import { cn } from "../../lib/utils";

export type TabItem<T extends string> = {
  id: T;
  label: string;
};

type Props<T extends string> = {
  tabs: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
  /** `dark` = cyan underline (legacy). `smarthr` = orange accent underline on light. */
  variant?: "dark" | "smarthr";
};

/** Bottom-border tabs — dark cyan underline or SmartHR orange underline */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  className,
  variant = "dark",
}: Props<T>) {
  const smarthr = variant === "smarthr";

  return (
    <div
      role="tablist"
      className={cn(
        "flex flex-wrap gap-1 pb-px",
        smarthr ? "border-b border-[#ededed]" : "border-b border-white/[0.08]",
        className,
      )}
    >
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            id={`tab-${t.id}`}
            className={cn(
              "relative min-h-11 shrink-0 rounded-t-lg px-4 py-2.5 text-[16px] font-semibold transition",
              smarthr
                ? isActive
                  ? "text-[#F26522]"
                  : "text-[#637381] hover:bg-[#f8f9fa] hover:text-[#1f1f1f]"
                : isActive
                  ? "text-[#00D5E8]"
                  : "text-[#94A3B8] hover:bg-white/[0.05] hover:text-[#CBD5E1]",
              smarthr
                ? "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE9F43]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f7f7]"
                : "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B7C7]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070A]",
            )}
            onClick={() => onChange(t.id)}
          >
            {t.label}
            {isActive ? (
              <span
                className={cn(
                  "absolute inset-x-2 -bottom-px h-0.5 rounded-full",
                  smarthr ? "bg-[#F26522]" : "bg-[#00B7C7]",
                )}
                aria-hidden
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
