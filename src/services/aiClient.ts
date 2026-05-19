/**
 * Browser-safe AI client: calls Netlify serverless functions only.
 * Never import OpenAI keys or call api.openai.com from here.
 */

export type HouseholdAiTask = "summarize_home" | "suggest_chores" | "shopping_helper";

export type HouseholdAiHelpSuccess = {
  ok: true;
  mode: "live";
  task: HouseholdAiTask;
  message: string;
  model?: string;
};

export type HouseholdAiHelpFailure = {
  ok: false;
  mode: "placeholder" | "error";
  code?: string;
  task?: HouseholdAiTask;
  message: string;
  detail?: string;
  hint?: string;
};

export type HouseholdAiHelpResult = HouseholdAiHelpSuccess | HouseholdAiHelpFailure;

function aiHouseholdHelperUrl(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "") || "";
  return `${base}/.netlify/functions/ai-household-helper`;
}

function parseJsonSafe(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function normalizeHelpResult(raw: unknown, fallbackTask: HouseholdAiTask): HouseholdAiHelpResult {
  if (!raw || typeof raw !== "object") {
    return {
      ok: false,
      mode: "error",
      message: "Unexpected response from AI helper.",
      detail: "Invalid JSON payload.",
    };
  }
  const r = raw as Record<string, unknown>;
  const ok = r.ok === true;
  const mode = r.mode === "live" ? "live" : r.mode === "placeholder" ? "placeholder" : "error";
  const message = typeof r.message === "string" ? r.message : "AI helper returned no message.";
  const task =
    r.task === "summarize_home" || r.task === "suggest_chores" || r.task === "shopping_helper"
      ? r.task
      : fallbackTask;

  if (ok && mode === "live") {
    return {
      ok: true,
      mode: "live",
      task,
      message,
      model: typeof r.model === "string" ? r.model : undefined,
    };
  }

  return {
    ok: false,
    mode: mode === "placeholder" ? "placeholder" : "error",
    code: typeof r.code === "string" ? r.code : undefined,
    task,
    message,
    detail: typeof r.detail === "string" ? r.detail : undefined,
    hint: typeof r.hint === "string" ? r.hint : undefined,
  };
}

/**
 * POSTs to the Netlify function with explicit task + optional non-sensitive input.
 * Does not attach localStorage or family data unless callers pass minimal fields in `input` later.
 */
export async function requestHouseholdAiHelp(
  task: HouseholdAiTask,
  input: Record<string, unknown> = {},
): Promise<HouseholdAiHelpResult> {
  const url = aiHouseholdHelperUrl();
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task, input }),
    });
  } catch {
    return {
      ok: false,
      mode: "error",
      code: "network_error",
      task,
      message: "Could not reach the AI helper.",
      detail:
        "Check your network. If you develop locally, run `netlify dev` so /.netlify/functions is served, or test on the deployed site.",
    };
  }

  const text = await res.text();
  const parsed = parseJsonSafe(text);

  if (res.status === 404) {
    return {
      ok: false,
      mode: "error",
      code: "function_not_found",
      task,
      message: "AI server function was not found.",
      detail:
        "Deploy with Netlify (functions in netlify/functions) or use `netlify dev` for local testing.",
    };
  }

  if (!res.ok && parsed === null) {
    return {
      ok: false,
      mode: "error",
      code: `http_${res.status}`,
      task,
      message: "AI helper returned an error.",
      detail: text.slice(0, 280),
    };
  }

  return normalizeHelpResult(parsed, task);
}

/**
 * Lightweight ping using summarize_home with empty input (no household payload).
 */
export async function testAiConnection(): Promise<{ ready: boolean; message: string }> {
  const result = await requestHouseholdAiHelp("summarize_home", {});
  if (result.ok && result.mode === "live") {
    return { ready: true, message: result.message };
  }
  const parts = [result.message, result.detail].filter(Boolean).join(" ");
  return { ready: false, message: parts || "AI helper is not available." };
}
