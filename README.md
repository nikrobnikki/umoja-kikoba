# UMOJA KIKOBA — Mfumo wa Usimamizi wa Hisa na Jamii

Mfumo wa kisasa wa kusimamia shughuli za kikoba (SACCOS/Vicoba): hisa, michango ya jamii, mikopo, na taarifa za kila mwanachama.

![Stack](https://img.shields.io/badge/React-18-blue) ![Stack](https://img.shields.io/badge/Node.js-%3E%3D18-green) ![Stack](https://img.shields.io/badge/SQLite-sql.js-lightgrey) ![Stack](https://img.shields.io/badge/Express-4-black)

---

## Vipengele (Features)

- **Dashibodi** — muhtasari wa hisa, jamii, na michango kwa wiki na mwezi
- **Wanachama** — usajili, uhariri, na ufutaji wa wanachama
- **Ingiza Mchango** — kuingiza hisa, jamii, marejesho, bima, na faini kwa wiki
- **Kitabu cha Mwanachama** — historia ya michango kwa wiki na mwezi kwa kila mwanachama
- **Kitabu cha Jumla** — ledger ya siku nzima kwa wanachama wote (kama kitabu halisi)
- **Kitabu cha Mkopo** — kutoa mkopo, kufuatilia marejesho, na hali ya kila mkopo
- **Bei za Masoko** — kubadilisha bei ya hisa, jamii, bima; historia ya mabadiliko
- **Majukumu (Roles)** — Admin, Mwenyekiti, Katibu, Mwasibu, na Mwanachama
- **Akaunti za Wanachama** — kila mwanachama ana akaunti yake — anaona data yake pekee
- **Light / Dark Mode** — mada mbili za rangi
- **Responsive** — inafanya kazi vizuri kwenye simu, tablet, na kompyuta

---

## Muundo wa Mradi

```
kikoba-app/
├── server/          ← Express API + SQLite (sql.js)   [port 5000]
│   ├── index.js     ← Entry point + React static serving
│   ├── db.js        ← Database engine
│   ├── middleware/
│   │   └── auth.js  ← JWT + RBAC middleware
│   └── routes/
│       ├── auth.js, members.js, entries.js
│       ├── settings.js, mikopo.js
└── client/          ← React 18 + Vite
    └── src/
        ├── App.jsx, main.jsx, utils.js
        ├── api/index.js
        ├── styles/global.css
        └── components/
            ├── Header, Tabs, Dashboard, Members
            ├── EntryForm, MemberBook, GeneralBook
            ├── LoanBook, Settings, LoginPage
            ├── MemberPortal, ThemeToggle
            └── ...
```

---

## Mahitaji (Prerequisites)

- **Node.js** ≥ 18.0.0 — [nodejs.org](https://nodejs.org)
- **npm** ≥ 9.0.0 (inakuja pamoja na Node.js)

---

## Usakinishaji wa Haraka (Quick Start)

```bash
# 1. Clone repo
git clone https://github.com/YOUR_USERNAME/kikoba-app.git
cd kikoba-app

# 2. Sakinisha vitegemezi (server + client)
npm run install:all

# 3. Weka variables za mazingira
cp server/.env.example server/.env
cp client/.env.example client/.env
# Hariri server/.env — weka JWT_SECRET na SETUP_KEY za kweli

# 4. Jenga programu ya React
npm run build

# 5. Anza seva
npm start
# → http://localhost:5000
```

---

## Mazingira (Environment Variables)

### `server/.env`

| Variable | Mfano | Maelezo |
|----------|-------|---------|
| `PORT` | `5000` | Port ya seva |
| `CORS_ORIGIN` | `http://localhost:3000` | Origin(s) zinazoruhusiwa (comma-separated) |
| `JWT_SECRET` | *(siri ndefu ya nasibu)* | **LAZIMA** — siri ya JWT tokens. Tumia: `openssl rand -base64 48` |
| `SETUP_KEY` | *(siri yako)* | **LAZIMA** — ufunguo wa kutengeneza admin wa kwanza |
| `NODE_ENV` | `production` | Weka `production` kwa deploy |

> ⚠️ **Kamwe usifanye commit ya `server/.env`** — ina siri za kweli.

### `client/.env`

| Variable | Mfano | Maelezo |
|----------|-------|---------|
| `VITE_API_URL` | `/api` | Base URL ya API (dev: `/api`; prod: URL kamili) |
| `VITE_API_TARGET` | `http://localhost:5000` | Target ya Vite dev proxy (dev tu) |

---

## Kutengeneza Admin wa Kwanza

```bash
curl -X POST http://localhost:5000/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"NENOSIRI_LAKO","setupKey":"SETUP_KEY_YAKO"}'
```

Au tumia ukurasa wa kuingia → "Sajili msimamizi wa kwanza".

---

## Majukumu (Roles)

| Jukumu | Anaweza Nini |
|--------|-------------|
| `admin` | Kila kitu — kusimamia wanachama, michango, mikopo, mipangilio, wasimamizi |
| `mwenyekiti` | Kama admin — kuona na kubadilisha data yote |
| `katibu` | Kama admin — kuona na kubadilisha data yote |
| `mwasibu` | Kama admin — kuona na kubadilisha data yote |
| `mwanachama` | Kuona data yake mwenyewe tu (hisa, michango, mikopo) |

---

## Maendeleo (Development)

```bash
# Anza seva na client kwa wakati mmoja
npm run dev
# Server → http://localhost:5000
# Client → http://localhost:3000  (na hot-reload)
```

---

## Ujenzi wa Production (Build)

```bash
npm run build
# Inajenga client/dist/ — Express itaitumia moja kwa moja
```

---

## Deploy kwenye Cloud (Railway / Render / Fly.io)

1. Push code kwenye GitHub (bila `.env` na `kikoba.db`)
2. Weka environment variables kwenye dashboard ya hosting:
   - `JWT_SECRET` = siri ndefu ya nasibu
   - `SETUP_KEY` = ufunguo wako
   - `NODE_ENV` = `production`
   - `CORS_ORIGIN` = URL yako ya production
3. Set **build command**: `npm run install:all && npm run build`
4. Set **start command**: `npm start`

---

## API Endpoints (Muhtasari)

| Method | URL | Ulinzi | Maelezo |
|--------|-----|--------|---------|
| POST | `/api/auth/login` | Wazi | Ingia (officer au mwanachama) |
| POST | `/api/auth/setup` | Setup key | Admin wa kwanza |
| GET | `/api/members` | Auth | Wanachama (officer=wote, member=wake) |
| POST | `/api/members` | Officer | Sajili mwanachama |
| GET | `/api/entries` | Auth | Michango |
| POST | `/api/entries` | Officer | Ingiza mchango |
| GET | `/api/mikopo` | Auth | Mikopo |
| POST | `/api/mikopo` | Officer | Toa mkopo |
| POST | `/api/mikopo/:id/marejesho` | Officer | Ingiza malipo |
| GET | `/api/settings` | Auth | Mipangilio |
| PUT | `/api/settings` | Officer | Badilisha mipangilio/bei |

---

## Usalama (Security)

- JWT authentication na role-based access control (RBAC)
- Helmet.js security headers (X-Frame-Options, X-Content-Type-Options, n.k.)
- Rate limiting: max 10 login attempts per 15 minutes per IP
- Input validation na payload size limit (100kb)
- `X-Powered-By` header imefichwa
- Parameterized SQL queries (sql.js) — no SQL injection risk
- Passwords hashed with bcryptjs (salt rounds: 10)

---

## Leseni (License)

MIT © UMOJA KIKOBA
