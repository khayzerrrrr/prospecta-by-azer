# Prospecta by Azer — CRM Manajemen Kunjungan Lapangan

End-to-end CRM: prospecting → scheduling → GPS check-in → pipeline → follow-ups → analytics.

## Stack
- **Runtime**: Bun 1.3.14
- **Backend**: ElysiaJS
- **Database**: SQLite (via bun:sqlite + Drizzle ORM)
- **Frontend**: React 19 + Vite + Tailwind CSS v4 + Recharts
- **Real-time**: Bun WebSocket
- **Auth**: JWT + RBAC (super_admin, admin, manager, agent)

## Quick Start

```bash
bun install
bun run db:push
bun run db:seed

# Terminal 1
bun run dev:api   # http://localhost:3000

# Terminal 2
bun run dev:web   # http://localhost:5173
```

## Demo Accounts
| Email | Password | Role |
|-------|----------|------|
| admin@visitflow.dev | password123 | admin |
| manager@visitflow.dev | password123 | manager |
| agent@visitflow.dev | password123 | agent |

## API Docs
http://localhost:3000/docs (Swagger)

## Key Features
- Lead prospecting with import
- Visit scheduling with calendar
- GPS check-in/out with distance validation
- Digital signature capture
- Kanban pipeline
- Route planning with nearest-neighbor optimization
- Real-time agent location tracking (WebSocket)
- Analytics dashboard with trends + team performance
- PWA offline mode with IndexedDB sync queue
- Dark/light mode
- Responsive (desktop/tablet/mobile)
- Bahasa Indonesia UI
