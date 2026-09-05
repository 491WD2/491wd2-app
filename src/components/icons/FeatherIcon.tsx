import { cn } from "../../lib/utils";

const featherRaw = import.meta.glob("../../assets/feather/*.svg", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

export type FeatherIconName =
  | "activity"
  | "alert-triangle"
  | "bell"
  | "box"
  | "calendar"
  | "check-circle"
  | "credit-card"
  | "grid"
  | "heart"
  | "home"
  | "layout"
  | "package"
  | "settings"
  | "shopping-cart"
  | "star"
  | "users"
  | "zap"
  | (string & {});

type Props = {
  name: FeatherIconName;
  size?: number;
  className?: string;
  title?: string;
};

function resolveSvg(name: FeatherIconName): string | null {
  const key = `../../assets/feather/${name}.svg`;
  return featherRaw[key] ?? null;
}

/** Feather icons from Desktop/feather.zip — stroke uses currentColor. */
export function FeatherIcon({ name, size = 20, className, title }: Props) {
  const raw = resolveSvg(name);
  if (!raw) {
    return <span className={cn("inline-block", className)} style={{ width: size, height: size }} />;
  }

  const html = raw
    .replace(/\swidth="24"/, ` width="${size}"`)
    .replace(/\sheight="24"/, ` height="${size}"`)
    .replace(/class="feather[^"]*"/, 'class="feather"');

  return (
    <span
      className={cn("aux-feather inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Soft pastel tile behind a Feather icon (Streamline-style accent). */
export function FeatherIconTile({
  name,
  tone = "cyan",
  size = 18,
  className,
}: {
  name: FeatherIconName;
  tone?: "cyan" | "mint" | "peach" | "pink" | "yellow" | "lavender";
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("aux-ico", `aux-ico--${tone}`, className)}>
      <FeatherIcon name={name} size={size} />
    </span>
  );
}

export const ROUTE_FEATHER_ICONS: Record<string, FeatherIconName> = {
  dashboard: "home",
  adminux: "layout",
  messages: "message-circle",
  pantry: "package",
  shopping: "shopping-cart",
  calendar: "calendar",
  notifications: "bell",
  subscriptions: "credit-card",
  tasks: "zap",
  emergency: "life-buoy",
  pets: "heart",
  planner: "calendar",
  settings: "settings",
  family: "users",
  kiosk: "monitor",
};

export const ROUTE_FEATHER_TONES: Record<
  string,
  "cyan" | "mint" | "peach" | "pink" | "yellow" | "lavender"
> = {
  dashboard: "cyan",
  adminux: "lavender",
  messages: "peach",
  pantry: "mint",
  shopping: "peach",
  calendar: "cyan",
  notifications: "yellow",
  subscriptions: "pink",
  tasks: "yellow",
  emergency: "mint",
  pets: "pink",
  planner: "cyan",
  settings: "lavender",
  family: "mint",
  kiosk: "cyan",
};
