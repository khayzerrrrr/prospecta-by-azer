# Prospecta by Azer — Project Review

**Tanggal:** 16 Juli 2026
**GitHub:** https://github.com/khayzerrrrr/prospecta-by-azer
**Frontend:** https://prospecta-by-azer.vercel.app
**Backend:** https://prospecta-api.onrender.com
**Local Dev:** http://localhost:5190 (Web) | http://localhost:3000 (API)

---

## 1. Deskripsi Project

**VisitFlow / Prospecta by Azer** — CRM manajemen kunjungan lapangan dengan:

- GPS check-in/out dengan validasi Haversine
- Kanban pipeline 7-stage untuk deal tracking
- 9 industry packs (Education, Banking, Healthcare, Property, Automotive, Manufacturing, Retail, SaaS, Distributor)
- 5 AI packs (Sales Coach, Proposal, Meeting, Analytics, Forecast)
- Rute planning dengan nearest-neighbor optimization
- WebSocket live agent tracking
- PWA offline mode dengan IndexedDB sync queue
- Dark/light theme
- Mobile responsive (bottom nav + FAB)

---

## 2. Tech Stack

| Layer | Teknologi |
|---|---|
| Runtime | Bun 1.3.14 |
| Backend | ElysiaJS ^1.2.24 |
| Database | SQLite via `bun:sqlite` + Drizzle ORM ^0.38.3 |
| Frontend | React 19 + Vite 6 |
| Styling | Tailwind CSS v4 |
| State | Zustand ^5.0.3 |
| Server Data | TanStack React Query |
| Charts | Recharts |
| Maps | Leaflet + React-Leaflet |
| Auth | JWT via `jose` library, argon2id password hashing |
| Icons | Lucide React |
| Deployment | Vercel (frontend) + Render (backend) |

---

## 3. Arsitektur

```
apps/
  api/          — ElysiaJS backend (port 3000)
    src/
      index.ts       — Entry, auto-seed
      app.ts          — Elysia setup, CORS, Swagger, routes
      config/env.ts   — Environment variables
      middleware/
        auth.ts       — JWT verification
        rbac.ts       — Role-based access (defined but not enforced)
      routes/
        auth.route.ts      — Login, register, refresh, me
        leads.route.ts     — CRUD leads
        visits.route.ts    — CRUD visits, checkin, checkout
        pipeline.route.ts  — Pipeline stages + deals
        routes.route.ts    — Route planning + optimization
        analytics.route.ts — Dashboard analytics
        packs.route.ts     — Industry + AI packs management
      services/
        auth.service.ts    — Auth logic
        lead.service.ts    — Lead queries
        visit.service.ts   — Visit + GPS logic
        pack.service.ts    — Pack management
      utils/jwt.ts         — JWT sign/verify (HS256)
      ws/index.ts          — WebSocket server

  web/          — React 19 frontend (port 5173/5190)
    src/
      App.tsx              — Routes + auth guards
      main.tsx             — Entry
      pages/               — 16 pages
      components/          — layout, dashboard, leads, packs, shared
      stores/              — authStore, packStore, uiStore
      services/            — api.ts, offline.ts

packages/
  db/           — Drizzle ORM + SQLite schema (12 tables)
  shared/       — TypeScript types
  utils/        — Haversine, date, currency, string helpers
```

---

## 4. Database Schema (12 Tables)

| Table | Key Fields |
|---|---|
| `users` | id, email, password_hash, full_name, role (super_admin/admin/manager/agent), territory_id, is_active |
| `territories` | id, name, region, color, center_lat, center_lng |
| `leads` | id, company_name, contact_name, phone, industry, status, qualification, custom_fields (JSON), assigned_to |
| `visits` | id, lead_id, user_id, status, checkin_lat/lng, checkin_time, checkout_time, meeting_notes, next_steps |
| `pipeline_stages` | id, name, order, color, emoji, probability |
| `deals` | id, name, lead_id, stage_id, value, probability |
| `follow_ups` | id, lead_id, visit_id, due_date, status, priority, type |
| `routes` | id, user_id, name, status, total_distance_km |
| `route_stops` | id, route_id, lead_id, stop_order |
| `notifications` | id, user_id, title, type, is_read |
| `analytics_events` | id, user_id, event_type, payload |
| `pack_settings` | id, pack_type, pack_id, enabled, config_json |

---

## 5. Demo Accounts

| Email | Password | Role |
|---|---|---|
| admin@visitflow.dev | password123 | Admin |
| manager@visitflow.dev | password123 | Manager |
| agent@visitflow.dev | password123 | Agent |

---

## 6. API Endpoints (30+)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | No | Register |
| POST | /api/auth/login | No | Login |
| POST | /api/auth/refresh | No | Refresh token |
| GET | /api/auth/me | Yes | Current user |
| GET | /api/leads | Yes | List leads (paginated) |
| GET | /api/leads/:id | Yes | Lead detail |
| POST | /api/leads | Yes | Create lead |
| PATCH | /api/leads/:id | Yes | Update lead |
| DELETE | /api/leads/:id | Yes | Delete lead |
| GET | /api/visits | Yes | List visits |
| POST | /api/visits | Yes | Create visit |
| POST | /api/visits/:id/checkin | Yes | GPS check-in (500m validation) |
| POST | /api/visits/:id/checkout | Yes | GPS check-out |
| GET | /api/pipeline/stages | Yes | Pipeline stages |
| GET | /api/pipeline/deals | Yes | List deals |
| POST | /api/pipeline/deals | Yes | Create deal |
| PATCH | /api/pipeline/deals/:id | Yes | Update deal |
| GET | /api/routes | Yes | List routes |
| POST | /api/routes | Yes | Create route |
| POST | /api/routes/:id/optimize | Yes | Optimize route |
| GET | /api/analytics/summary | Yes | KPI summary |
| GET | /api/analytics/visit-trends | Yes | 30-day trends |
| GET | /api/analytics/team-performance | Yes | Agent performance |
| GET/POST | /api/packs/industry/* | Yes | Industry pack CRUD |
| GET/POST | /api/packs/ai/* | Yes | AI pack CRUD |
| POST | /api/packs/onboard/:type/:id | No | Quick install pack |
| WS | /ws?token=JWT | JWT | Live location tracking |

---

## 7. Bugs Ditemukan & Diperbaiki

### Backend (10 fix)

| # | File | Masalah | Perbaikan |
|---|---|---|---|
| B1 | `apps/api/.env` | Tidak ada → SQLite crash | Buat file dengan `DATABASE_URL=../../data/visitflow.db` |
| B2 | `config/env.ts` | Default DATABASE_URL ke PostgreSQL | Ubah ke path SQLite |
| B3 | `lead.service.ts` | `query.all().length` tidak efisien | Pakai `select({ count })` |
| B4 | `visit.service.ts` | Tidak ada pagination metadata | Tambah pagination |
| B5 | `lead.service.ts` | `{} is not iterable` | Panggil `.all()` setelah Drizzle query |
| B6 | `visit.service.ts` | Sama | Panggil `.all()` |
| B7 | `app.ts` | WebSocket server tidak di-mount | `.use(wsServer)` |
| B8 | `ws/index.ts` | Parsing token salah (Elysia API) | Pakai `query` schema |
| B9 | `auth.service.ts` | `refresh()` tidak ada | Tambah method |
| B10 | 6 route files | Auth error → HTTP 500 | Tambah `.catch()` di derive |

### Frontend (12 fix)

| # | File | Masalah | Perbaikan |
|---|---|---|---|
| F1 | `Icons.jsx` | 45 import HeroIcons salah | Rewrite semua nama import |
| F2 | `api.ts` | Hardcode `/api` → broken di Vercel | Pakai `VITE_API_URL` env |
| F3 | `authStore.ts` | Refresh token tidak disimpan | Save ke localStorage |
| F4 | `authStore.ts` | Hardcode `/api` login URL | Pakai env variable |
| F5 | `offline.ts` | Data hilang saat 4xx/5xx | Hanya hapus di 2xx |
| F6 | `offline.ts` | `crypto.randomUUID()` crash HTTP | Tambah UUID fallback |
| F7 | `LeadsPage.tsx` | Form state tidak punya `contactTitle` | `defaultForm()` dinamis |
| F8 | `LeadsPage.tsx` | Industry selector tidak muncul tanpa pack | Tambah dropdown industri |
| F9 | `IndustryFields.tsx` | Dynamic Tailwind `focus:ring-${color}` | Static color map |
| F10 | Modal backdrop (3 halaman) | Klik backdrop tidak tutup modal | `onClick` di backdrop div |
| F11 | `Sidebar.tsx` | `isPackEnabled` temporal dead zone | Pindahkan urutan deklarasi |
| F12 | `Sidebar.tsx` | Industry packs default collapsed | Auto-expand saat ada pack |

### Dashboard & UI (5 fix)

| # | File | Masalah | Perbaikan |
|---|---|---|---|
| D1 | `Dashboard.tsx` | TypeScript `stats` possibly undefined | `!` assertion |
| D2 | `Dashboard.tsx` | Redundant role check (TS error) | Remove nested check |
| D3 | `Dashboard.tsx` | Tidak ada indikator installed packs | Tambah banner "Industry Packs" |
| D4 | `Sidebar.tsx` | Pack badge terlalu kecil (dot) | Badge "✓ Aktif" / "Install" |
| D5 | `IndustryFields.tsx` | Education contactRoles kurang "Yayasan" | Tambah Ketua/Pengurus Yayasan |

### Deployment (6 fix)

| # | Masalah | Perbaikan |
|---|---|---|
| DP1 | Vite dev server pakai port salah | Port 5190 |
| DP2 | `vercel.json` build command npm | Ganti ke `bun` |
| DP3 | Vercel workspace dependency tidak ketemu | `vercel.json` di root monorepo |
| DP4 | `seed.ts` `process.exit(0)` bunuh server | `import.meta.main` guard |
| DP5 | Dynamic import seed gagal di Render | Inline seed ke `index.ts` |
| DP6 | `hostname` tidak bind `0.0.0.0` di Render | Tambah binding |

---

## 8. Masalah Yang Masih Ada (Known Issues)

### High Priority
1. **RBAC tidak di-enforce** — `requirePermission()` di `rbac.ts` tidak pernah dipanggil
2. **No ownership checks** — Agent bisa delete/modify data agent lain
3. **Analytics endpoints global** — Semua user bisa lihat data seluruh tim
4. **VITE_API_URL belum terverifikasi** — Di Vercel env vars, perlu dicek ulang

### Medium Priority
5. **No foreign key constraints** — SQLite tidak enforce referential integrity
6. **Industry packs harus diinstall manual** — Tidak auto-install saat onboarding
7. **Dynamic Tailwind di beberapa tempat lain** — Mungkin masih ada yang broken
8. **Hardcoded schedule di Dashboard** — Data dummy "PT Maju Bersama" dll
9. **JWT secret default insecure** — `"dev-secret-change-in-production"` di production
10. **CORS_ORIGIN di Render** — Mungkin belum di-set

### Low Priority
11. **Sharp dependency tidak dipakai** — Ada di root package.json
12. **@elysiajs/jwt tidak dipakai** — Ada di dependencies
13. **pg (PostgreSQL driver)** — Di devDependencies tapi tidak dipakai
14. **No tests** — Tidak ada file test satupun
15. **Bundle size 1.3MB** — Bisa di-split dengan dynamic import

---

## 9. Deployment Checklist

- [x] GitHub repo: `khayzerrrrr/prospecta-by-azer`
- [x] Vercel frontend: `prospecta-by-azer.vercel.app`
- [x] Render backend: `prospecta-api.onrender.com`
- [x] Build sukses (Vercel + Render)
- [x] Auto-migration database di Render
- [x] Auto-seed (pipeline stages, territories, demo users)
- [ ] **VITE_API_URL** di Vercel Environment Variables
- [ ] **CORS_ORIGIN** di Render Environment Variables
- [ ] Redeploy Vercel setelah set env vars
- [ ] Test login dari Vercel production

### Render Settings Saat Ini

```
Root Directory: apps/api
Build Command: cd ../.. && bun install
Start Command: bun run src/index.ts
Environment:
  PORT=10000
  JWT_SECRET=prospecta-azer-prod-2026
  CORS_ORIGIN=https://prospecta-by-azer.vercel.app  ← Cek ini!
```

### Vercel Settings Yang Dibutuhkan

```
VITE_API_URL = https://prospecta-api.onrender.com  ← Tambahkan ini!
```

---

## 10. Cara Menjalankan Lokal

```bash
cd C:\Users\Reza Pahrul\Projects\visitflow

# Install dependencies
bun install

# Jalankan backend (port 3000)
bun run dev:api

# Jalankan frontend (port 5173)
bun run dev:web

# Buka browser
# http://localhost:5173 (atau port yang muncul)
# Login: admin@visitflow.dev / password123
```

---

## 11. Catatan Penting

1. **Render free tier cold start** — setelah 15 menit idle, backend auto-sleep. Request pertama setelah itu butuh ~30-60 detik untuk wake up.

2. **Database SQLite di Render** — data hilang setiap kali Render restart server (ephemeral filesystem). Solusi jangka panjang: migrasi ke Supabase PostgreSQL.

3. **WebSocket** — sudah terintegrasi di backend tapi frontend masih hardcode `ws://localhost:3000`. Perlu diupdate untuk production.

4. **Industry Packs** — harus diinstall manual dari sidebar. Tanpa pack terinstall, form menggunakan dropdown industri generic. Install pack dari sidebar: klik nama industry → panel PackPanel muncul → Install.

5. **VITE_API_URL** — variabel lingkungan paling kritis. Tanpa ini, frontend Vercel tidak bisa menghubungi backend Render.
