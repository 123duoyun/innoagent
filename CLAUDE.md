# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Inno Agent is a sandbox manager UI for creating, booting, and running autonomous agent environments. It uses **Zitadel** for authentication via a lightweight Express backend (BFF pattern). The sandbox boot sequence is still client-side mocked.

This is a two-app monorepo: a React/Vite frontend at the root and a separate Express 5 backend in `server/`, each with their own `package.json` and `node_modules`.

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Frontend dev server on port 3000 |
| `pnpm dev:server` | Auth backend dev server on port 3001 (with hot-reload) |
| `pnpm dev:all` | Run both frontend and backend concurrently |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build locally |
| `pnpm lint` | TypeScript type-check (`tsc --noEmit`) |
| `pnpm clean` | Remove `dist/` and `server.js` |

Backend has its own `package.json` in `server/`. Install backend deps with `cd server && npm install`.

## Architecture

### Auth Flow (Zitadel BFF Pattern)

```
Browser → POST /auth/password → Auth Backend (:3001) → Zitadel Session API + OIDC flow → tokens returned
```

The frontend keeps its Login/Register UI (email + password forms). The auth backend in `server/` performs the full OIDC authorization code + PKCE flow against Zitadel server-side using a Service Account PAT, then returns `{ access_token, refresh_token, id_token }` as JSON. Tokens are stored in `localStorage`.

The backend uses **Express 5** (not Express 4) — note that Express 5 has native async/await error handling and different routing APIs.

**Key files:**
- `server/src/routes/auth.ts` — `POST /auth/password` (login/register), `POST /auth/logout`, `GET /auth/me`
- `server/src/services/zitadel-user.ts` — Zitadel user search, creation, role assignment
- `server/src/middleware/auth.ts` — Bearer token validation via Zitadel userinfo
- `src/api/auth.ts` — Frontend API client with token storage helpers

### Sandbox API (`/api`)

The sandbox management API uses an action-based protocol over `POST /api`. All requests include `Action`, `RequestUUID` (crypto.randomUUID), and `UserID`. Responses are validated for `RetCode === 0`.

Actions: `StartInnoAgent` (returns `InnoAgentID`), `StopInnoAgent`, `ExtendSandboxTTL`.

`startInnoAgentApi` in `src/api/innoAgent.ts` has built-in request deduplication — a `Map<string, Promise>` prevents duplicate start requests for the same user.

The `ServiceMock` component embeds the sandbox in an iframe and sends `ExtendSandboxTTL` heartbeats every 60 seconds. `UserPanelButton` listens for `postMessage` events with data `'iframe-logout'` from the iframe to support logout initiated from within the sandbox.

### Screen State Machine (`src/App.tsx`)

Four screens driven by `useState<Screen>`:
- **LOGIN** → calls `loginApi()` from `src/api/auth.ts`
- **REGISTER** → calls `registerApi()` from `src/api/auth.ts`
- **LOADING** → animated boot sequence, polls `querySandboxStatusApi()` (still mock)
- **SERVICE** → workspace dashboard

On mount, `checkAuth()` validates stored tokens via `GET /auth/me` — if valid, skips login. Logout calls `logoutApi()` which revokes tokens at Zitadel.

No router library — navigation is entirely via the screen state machine. No state management library — all state lives in `App.tsx` and is passed down as props. The `sandboxId` is stored in the URL query string via `window.history.replaceState`.

### Vite Dev Proxy

In dev mode, `/auth`, `/api`, and `/healthz` are proxied to `http://localhost:3001` (the auth backend). The `/api` proxy target is configurable via `VITE_INNO_AGENT_API_PROXY_TARGET`.

### Styling

Tailwind CSS v4 via `@tailwindcss/vite` plugin. Custom theme tokens in `src/index.css` `@theme` block. Fonts: Hanken Grotesk (sans), Geist (mono). Custom utility classes: `.canvas-grid`, `.level-2-card`, `.logo-pulse`.

**TypeScript path alias:** `@/*` maps to the project root (configured in `tsconfig.json`). Use `@/components/...` or `@/api/...` for imports.

**Animations:** Page transitions use `motion/react` (formerly Framer Motion) with `AnimatePresence` in `App.tsx`.

## Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_API_BASE` | Frontend API base URL (empty = same-origin via proxy) |
| `VITE_INNO_AGENT_API_PROXY_TARGET` | Dev proxy target for `/api` route (default: `http://localhost:3001`) |
| `VITE_INNO_AGENT_WORKSPACE_URL_TEMPLATE` | URL template for sandbox workspace (`{sandboxId}` placeholder) |
| `GEMINI_API_KEY` | Google Gemini API key (used by `@google/genai` SDK) |
| `APP_URL` | URL where the app is hosted |
| `ZITADEL_ISSUER` | Zitadel URL (default: `http://auth.localhost`) |
| `ZITADEL_INTERNAL_ISSUER` | Internal Zitadel URL if different from public (falls back to `ZITADEL_ISSUER`) |
| `ZITADEL_CLIENT_ID` | OIDC client ID |
| `ZITADEL_LOGIN_REDIRECT_URI` | Backend redirect URI for OIDC callback |
| `ZITADEL_SERVICE_PAT` | Service account Personal Access Token |
| `AUTH_BACKEND_PORT` | Auth backend port (default: 3001) |
| `DISABLE_HMR` | Set to `true` to disable Vite HMR/file watching (prevents flickering during AI agent editing) |

The server loads `.env` from both the repo root and `server/` (root takes precedence). See `.env.example` for the full template.

## Kong Gateway

Zitadel runs behind Kong at `auth.localhost`. The Kong config is at `/Users/almonster/Documents/zitadel_kong/`. CORS is configured to allow `http://localhost:3000` and `http://inno.localhost`.
