# Chore kiosk — final QA & deployment checklist

Use this after `npm run test` and `npm run build` pass.

## Automated gates

```bash
cd /Users/stellaroskens/491WD2
npm ci
npm run typecheck
npm run test
npm run build
npm run start   # http://localhost:4173/chores
```

| Gate | Command | Expected |
| --- | --- | --- |
| Types | `npm run typecheck` | Exit 0 |
| Unit / integration | `npm run test` | Jest + Testing Library |
| Production bundle | `npm run build` | `dist/` with PWA `sw.js` |
| Lint (optional) | `npm run lint` | No new errors |

## Accessibility (WCAG 2.2 AA target)

Full audit: **[ACCESSIBILITY.md](ACCESSIBILITY.md)**.

| Check | How to verify |
| --- | --- |
| ARIA labels | VoiceOver/TalkBack on Analytics, modals, tabs, task cards |
| Keyboard | Tab through shell; Arrow keys on main tabs; Escape closes modals/tour |
| Contrast | Muted text `#574f66` on white ≥ 7:1; badges on tinted backgrounds ≥ 4.5:1 |
| Touch targets | Primary controls use `--hh-touch: 76px` (~20 mm @ 96 dpi) |
| Motion | OS “Reduce motion” disables chore animations |

## Chore shell — functional QA

### All tabs

| Tab | Real-time | AI | Analytics |
| --- | --- | --- | --- |
| **Home** | Complete task → counts update on Dashboard | Suggestions + highlight cards | Page views logged |
| **Dashboard** | Member stats refresh after completion | Greeting smart tip | — |
| **Schedule** | Week picker + assign board sync | — | Drag/swipe events |
| **Users** | Message board + per-member tasks | — | Member filter in agent |

### Analytics agent

1. Open **Analytics** (admin nav or `?analytics=1`).
2. Confirm KPIs, bar/pie/timeline charts, and event log populate.
3. Toggle **AI insights** — briefing appears.
4. **Export JSON** downloads events.
5. Filters (page, member, action, date) narrow the log.

### Offline / PWA

1. Use app online; complete a chore.
2. DevTools → Application → confirm `491wd-chore-offline-snapshot`.
3. Offline mode → reload → offline banner + last saved data.

### Performance

- Initial `/chores` avoids loading analytics/modals until opened (Network tab).
- Swipe and drag feel smooth (60 FPS target; rAF-batched swipe).

## Multi-language

- UI copy: **English** (`choreLocale.ts` — extend `CHORE_UI_STRINGS` for more locales).
- Dates/times in analytics and schedules use **browser `Intl`** via `formatChoreDateTime`.

## Device matrix (manual)

| Device | Orientation | Focus |
| --- | --- | --- |
| Phone | Portrait | Swipe complete, tab bar |
| Tablet | Landscape | Dashboard grid, assign board scroll |
| Kiosk display | Landscape | Arm-length touch, skip link |

## Deploy

See **[DEPLOYMENT.md](DEPLOYMENT.md)** — upload `dist/`, configure SPA fallback, optional `npm run handoff` for client package.
