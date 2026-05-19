# 491WD AI Help Assistant — backend

Small Express proxy that holds your **OpenAI API key server-side only**. The React app calls this service; the key is never sent to the browser.

## Prerequisites

- Node.js 18+
- An [OpenAI API key](https://platform.openai.com/api-keys)

## Setup

From the repository root:

```bash
cd /Users/stellaroskens/491WD2/server
npm install
cp .env.example .env
```

Edit `.env` and set:

- `OPENAI_API_KEY` — your secret key (never commit `.env`)
- `PORT` — optional; default **8787**

## Run the server

```bash
cd /Users/stellaroskens/491WD2/server
npm run dev
```

Or without watch:

```bash
npm start
```

## Run the frontend (separate terminal)

```bash
cd /Users/stellaroskens/491WD2
npm run dev
```

Open **http://localhost:5173/** — the AI Help Assistant (Help Center) calls **http://localhost:8787/api/chat**.

## API

`POST /api/chat`

**Headers:** `Content-Type: application/json`

**Body:**

```json
{
  "messages": [
    { "role": "user", "content": "How do I apply a layout?" }
  ]
}
```

Only `user` and `assistant` roles are accepted from clients; a system prompt is applied on the server.

**Success:** `{ "message": { "role": "assistant", "content": "..." } }`

**Errors:** `{ "error": "safe message" }` with appropriate HTTP status.

## Security notes

- CORS is limited to `http://localhost:5173` for local development.
- Rate limiting is enabled (per IP).
- Message count and length are capped; empty content is rejected.
- The API key is read from `.env` only and is never included in responses.
