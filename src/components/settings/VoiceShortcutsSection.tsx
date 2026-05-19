import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "../ui/Button";
import { Card, CardHeader } from "../ui/Card";
import {
  buildAbsoluteAppUrl,
  buildQuickActionUrl,
  type QuickAction,
} from "../../services/quickActions";

type ShortcutRowProps = {
  label: string;
  url: string;
};

function ShortcutRow({ label, url }: ShortcutRowProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="mt-1 break-all font-mono text-[0.7rem] leading-relaxed text-slate-600">
          {url}
        </p>
      </div>
      <Button
        className="shrink-0 sm:min-w-[7rem]"
        onClick={() => void copy()}
        type="button"
        variant="secondary"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy link
          </>
        )}
      </Button>
    </div>
  );
}

export function VoiceShortcutsSection() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const examples = useMemo(() => {
    if (!origin) {
      return [];
    }
    const q = (a: QuickAction) => buildQuickActionUrl(origin, a);
    return [
      { label: "Quick add — grocery (example: Milk)", url: q({ type: "grocery", name: "Milk" }) },
      {
        label: "Quick add — task (example)",
        url: q({ type: "task", title: "Clean bathroom" }),
      },
      {
        label: "Quick add — event (example)",
        url: q({
          type: "event",
          title: "Dentist",
          date: "2026-05-10",
          time: "09:00",
        }),
      },
      {
        label: "Quick add — note (example)",
        url: q({ type: "note", title: "School note" }),
      },
      { label: "Open Kiosk", url: buildAbsoluteAppUrl(origin, "/kiosk") },
      { label: "Open Shopping", url: buildAbsoluteAppUrl(origin, "/shopping") },
      {
        label: "Open Tasks (filter chores today in the app)",
        url: buildAbsoluteAppUrl(origin, "/tasks"),
      },
      { label: "Open Pantry / inventory", url: buildAbsoluteAppUrl(origin, "/pantry") },
    ] as const;
  }, [origin]);

  return (
    <Card>
      <CardHeader title="Voice Shortcuts" eyebrow="Siri & assistants · URLs only" />
      <div className="space-y-4 text-sm text-slate-600">
        <p className="leading-relaxed">
          Siri Shortcuts can open <span className="font-semibold text-slate-800">Safari</span> to
          a FamilySite URL. This is <span className="font-semibold text-slate-800">not</span> native
          Siri App Intents—you are simply opening a web link you copy from here.
        </p>
        <p className="leading-relaxed">
          On iPhone or iPad, create a Shortcut that uses <strong>Open URLs</strong> with one of the
          links below, then assign a spoken phrase to that Shortcut in the Shortcuts app.
        </p>
        <p className="leading-relaxed">
          <span className="font-semibold text-slate-800">Speakers and routines:</span> Assistants can
          only open these pages in the browser for now. Deeper integrations need a future cloud
          connection and tightly secured webhooks—never put vendor API credentials or tokens in a
          shortcut URL.
        </p>
        <p className="rounded-lg border border-slate-200 bg-amber-50/60 px-3 py-2 text-xs font-medium text-amber-950">
          Privacy: only put non-sensitive titles in quick links (grocery names, generic chores). Do
          not encode medical details, emergency contacts, private doc body text, member PII, auth
          tokens, or API keys in URLs.
        </p>
      </div>
      <div className="mt-5 space-y-3">
        {examples.length === 0 ? (
          <p className="text-sm text-slate-500">Open Settings in the browser to generate links.</p>
        ) : (
          examples.map((row) => <ShortcutRow key={row.label} label={row.label} url={row.url} />)
        )}
      </div>
    </Card>
  );
}
