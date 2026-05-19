/**
 * Netlify serverless function — runs only on the server.
 * Reads OPENAI_API_KEY from the deployment environment (never VITE_*).
 *
 * TODO: Add streaming (SSE) only when product UX needs it; keep validation strict.
 */

type NetlifyHandlerEvent = {
  httpMethod?: string;
  body?: string | null;
};

const TASKS = ["summarize_home", "suggest_chores", "shopping_helper"] as const;
type HouseholdTask = (typeof TASKS)[number];

type RequestBody = {
  task?: unknown;
  input?: unknown;
};

function corsHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function json(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify(body),
  };
}

function isHouseholdTask(value: unknown): value is HouseholdTask {
  return typeof value === "string" && (TASKS as readonly string[]).includes(value);
}

function buildPrompt(task: HouseholdTask, input: unknown): string {
  void input;
  switch (task) {
    case "summarize_home":
      return (
        "Household assistant task: summarize_home. No personal household data was sent in this request. " +
        "Reply with one short sentence confirming you can help once the user intentionally shares only what they choose."
      );
    case "suggest_chores":
      return (
        "Household assistant task: suggest_chores. No chore list was sent. " +
        "Reply with one sentence naming two or three generic chore categories families often rotate (no names, no addresses)."
      );
    case "shopping_helper":
      return (
        "Household assistant task: shopping_helper. No shopping list was sent. " +
        "Reply with one sentence of generic grocery-list planning advice without asking for personal data."
      );
    default:
      return "Ping.";
  }
}

async function callOpenAi(task: HouseholdTask, input: unknown): Promise<{ text: string; model: string }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("MISSING_KEY");
  }

  const model = (process.env.OPENAI_MODEL ?? "gpt-4.1-mini").trim();
  const content = buildPrompt(task, input);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content }],
      max_tokens: 220,
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI HTTP ${res.status}: ${errText.slice(0, 240)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("Empty completion from OpenAI.");
  }

  return { text, model };
}

export const handler = async (event: NetlifyHandlerEvent) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, {
      ok: false,
      mode: "error",
      code: "method_not_allowed",
      message: "Use POST with JSON body.",
    });
  }

  let parsed: RequestBody;
  try {
    parsed = JSON.parse(event.body ?? "{}") as RequestBody;
  } catch {
    return json(400, {
      ok: false,
      mode: "error",
      code: "invalid_json",
      message: "Request body must be JSON.",
    });
  }

  if (!isHouseholdTask(parsed.task)) {
    return json(400, {
      ok: false,
      mode: "error",
      code: "invalid_task",
      message: `task must be one of: ${TASKS.join(", ")}.`,
    });
  }

  const task = parsed.task;
  const input =
    parsed.input !== undefined && parsed.input !== null && typeof parsed.input === "object"
      ? (parsed.input as Record<string, unknown>)
      : {};

  const apiKeyConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());

  if (!apiKeyConfigured) {
    return json(200, {
      ok: false,
      mode: "placeholder",
      code: "missing_api_key",
      task,
      message:
        "AI helper is not configured on this server yet. Add OPENAI_API_KEY to Netlify environment variables (server-side only).",
      hint: "Never use VITE_ for secrets. ChatGPT passwords are not stored in this app.",
    });
  }

  try {
    const { text, model } = await callOpenAi(task, input);
    return json(200, {
      ok: true,
      mode: "live",
      task,
      message: text,
      model,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "MISSING_KEY") {
      return json(200, {
        ok: false,
        mode: "placeholder",
        code: "missing_api_key",
        task,
        message:
          "OpenAI API key is missing at runtime. Configure OPENAI_API_KEY for this deployment.",
      });
    }
    return json(502, {
      ok: false,
      mode: "error",
      code: "openai_error",
      task,
      message: "The AI request failed on the server.",
      detail: msg.slice(0, 280),
    });
  }
};
