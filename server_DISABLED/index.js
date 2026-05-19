import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";

const PORT = Number(process.env.PORT) || 8787;
const MAX_MESSAGES = 40;
const MAX_CONTENT_LENGTH = 12000;
const ALLOWED_ROLES = new Set(["user", "assistant"]);

const SYSTEM_INSTRUCTION = `You are the 491WD app help assistant. You answer questions about My Build, UI Builder, Saved UI Preview, Help Center, Apply to My Build, Export React Code, component settings, layout import/export, checkpoints, and troubleshooting. Keep answers practical and step-by-step.`;

const app = express();

app.disable("x-powered-by");

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
);

app.use(express.json({ limit: "256kb" }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

app.post("/api/chat", limiter, async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || !String(apiKey).trim()) {
      return res.status(503).json({ error: "AI assistant is not configured on the server." });
    }

    const body = req.body;
    if (!body || typeof body !== "object") {
      return res.status(400).json({ error: "Invalid JSON body." });
    }

    const rawMessages = body.messages;
    if (!Array.isArray(rawMessages)) {
      return res.status(400).json({ error: "Field messages must be a non-empty array." });
    }

    if (rawMessages.length === 0) {
      return res.status(400).json({ error: "messages cannot be empty." });
    }

    if (rawMessages.length > MAX_MESSAGES) {
      return res.status(400).json({ error: `At most ${MAX_MESSAGES} messages are allowed.` });
    }

    const sanitized = [];
    for (const m of rawMessages) {
      if (!m || typeof m !== "object") {
        return res.status(400).json({ error: "Each message must be an object." });
      }
      const role = m.role;
      const content = m.content;
      if (typeof role !== "string" || !ALLOWED_ROLES.has(role)) {
        return res.status(400).json({ error: "Each message must have role user or assistant." });
      }
      if (typeof content !== "string") {
        return res.status(400).json({ error: "Each message content must be a string." });
      }
      const trimmed = content.trim();
      if (trimmed.length === 0) {
        return res.status(400).json({ error: "Message content cannot be empty." });
      }
      if (trimmed.length > MAX_CONTENT_LENGTH) {
        return res.status(400).json({ error: `Each message may be at most ${MAX_CONTENT_LENGTH} characters.` });
      }
      sanitized.push({ role, content: trimmed });
    }

    const last = sanitized[sanitized.length - 1];
    if (!last || last.role !== "user") {
      return res.status(400).json({ error: "The last message must be from the user." });
    }

    const openai = new OpenAI({ apiKey });

    const messagesForModel = [{ role: "system", content: SYSTEM_INSTRUCTION }, ...sanitized];

    let replyText = "";
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messagesForModel,
        temperature: 0.4,
        max_tokens: 2048,
      });
      replyText = completion.choices[0]?.message?.content?.trim() ?? "";
    } catch (apiErr) {
      console.error("OpenAI request failed:", apiErr?.message || apiErr);
      return res.status(502).json({ error: "The AI service returned an error. Please try again shortly." });
    }

    if (!replyText) {
      return res.status(502).json({ error: "Empty response from AI. Please try again." });
    }

    return res.json({ message: { role: "assistant", content: replyText } });
  } catch (err) {
    console.error("Unexpected /api/chat error:", err?.message || err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found." });
});

app.listen(PORT, () => {
  console.log(`491WD AI help server listening on http://localhost:${PORT}`);
});
