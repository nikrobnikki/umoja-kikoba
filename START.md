# Mfumo wa Kikoba — Maelekezo ya Kuanza

## Muundo wa Mradi

```
kikoba-app/
├── package.json          ← Root launcher (npm run dev / start zote mbili)
├── START.md              ← Faili hili
│
├── server/               ← Backend (Express + sql.js SQLite)  — PORT 5000
│   ├── .env              ← Variables za mazingira (usiziingize kwenye git)
│   ├── .env.example      ← Mfano wa .env
│   ├── package.json
│   ├── index.js          ← Entry point — CORS, routes, DB init
│   ├── db.js             ← SQLite engine (sql.js) + persistence
│   ├── kikoba.db         ← Hifadhidata (inaundwa mara ya kwanza)
│   ├── middleware/
│   │   └── auth.js       ← JWT requireAdmin middleware
│   └── routes/
│       ├── auth.js       ← Login, setup, wasimamizi
│       ├── members.js    ← Wanachama CRUD
│       ├── entries.js    ← Michango CRUD
│       └── settings.js   ← Mipangilio + Historia ya bei
│
└── client/               ← Frontend (React 18 + Vite)  — PORT 3000
    ├── .env              ← Variables za mazingira
    ├── .env.example      ← Mfano wa .env
    ├── vite.config.js    ← Vite config + dev proxy → server
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx       ← Root component, auth state, tab routing
        ├── utils.js      ← Msaidizi: tarehe, wiki, hesabu
        ├── api/
        │   └── index.js  ← API client (BASE = VITE_API_URL)
        ├── styles/
        │   └── global.css
        └── components/
            ├── Header.jsx
            ├── Tabs.jsx
            ├── LoginPage.jsx
            ├── Dashboard.jsx
            ├── Members.jsx
            ├── EntryForm.jsx
            ├── MemberBook.jsx
            ├── GeneralBook.jsx
            └── Settings.jsx
```

---

## Hatua 1 — Sakinisha vitegemezi (mara moja tu)

```powershell
# Kutoka kwenye kikoba-app/
npm run install:all
```

Au kila moja peke yake:

```powershell
cd server  &&  npm install
cd client  &&  npm install
```

---

## Hatua 2 — Sanidi variables za mazingira

### Backend — `server/.env`

```env
PORT=5000
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=badilisha_hii_siri_ndefu_2026
SETUP_KEY=kikoba_setup_2026
```

### Frontend — `client/.env`

```env
VITE_API_URL=/api
VITE_API_TARGET=http://localhost:5000
```

> `VITE_API_URL=/api` inamaanisha Vite proxy itashughulikia maombi.  
> Kwa uzalishaji (production) badilisha `VITE_API_URL` kuwa URL kamili ya API yako.

---

## Hatua 3 — Anza mfumo

### Njia 1 — Kutoka kwenye kikoba-app/ (zote kwa pamoja)

```powershell
# Terminal 1 — server na client kwa wakati mmoja (Windows)
cd "c:\xampp\htdocs\UMOJA KIKOBA\kikoba-app"
npm run dev:server   # Terminal 1
npm run dev:client   # Terminal 2 (fungua terminal mpya)
```

### Njia 2 — Kila moja peke yake (inapendekezwa)

```powershell
# Terminal 1 — Backend
cd "c:\xampp\htdocs\UMOJA KIKOBA\kikoba-app\server"
npm start
# au kwa maendeleo (auto-restart):
npm run dev
```

```powershell
# Terminal 2 — Frontend
cd "c:\xampp\htdocs\UMOJA KIKOBA\kikoba-app\client"
npm run dev
```

### Fungua kivinjari
```
http://localhost:3000
```

---

## Hatua 4 — Tengeneza akaunti ya msimamizi wa kwanza

Ukifungua mfumo kwa mara ya kwanza:

1. Bonyeza **"🔐 Ingia"** kwenye kichwa cha ukurasa
2. Chagua **"Sajili msimamizi wa kwanza"**
3. Jaza jina, nenosiri, na **Setup Key** (`kikoba_setup_2026`)
4. Bonyeza **Sajili na Ingia**

Au tumia API moja kwa moja:

```powershell
Invoke-RestMethod -Method POST -Uri http://localhost:5000/api/auth/setup `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"nenosiri_lako","setupKey":"kikoba_setup_2026"}'
```

---

## API Endpoints

| Method   | URL                         | Ulinzi    | Maelezo                        |
|----------|-----------------------------|-----------|--------------------------------|
| GET      | /api/health                 | Wazi      | Hali ya seva                   |
| POST     | /api/auth/setup             | Setup key | Tengeneza msimamizi wa kwanza  |
| POST     | /api/auth/login             | Wazi      | Ingia, pata JWT token          |
| GET      | /api/auth/me                | Admin     | Thibitisha token               |
| GET      | /api/auth/admins            | Admin     | Orodha ya wasimamizi           |
| POST     | /api/auth/admins            | Admin     | Ongeza msimamizi               |
| DELETE   | /api/auth/admins/:id        | Admin     | Futa msimamizi                 |
| GET      | /api/settings               | Wazi      | Soma mipangilio                |
| PUT      | /api/settings               | Admin     | Hifadhi mipangilio / bei       |
| GET      | /api/settings/historia      | Admin     | Historia ya mabadiliko ya bei  |
| GET      | /api/members                | Wazi      | Orodha ya wanachama            |
| POST     | /api/members                | Admin     | Sajili mwanachama              |
| PUT      | /api/members/:id            | Admin     | Hariri mwanachama              |
| DELETE   | /api/members/:id            | Admin     | Futa mwanachama                |
| GET      | /api/entries                | Wazi      | Orodha ya michango             |
| POST     | /api/entries                | Admin     | Ingiza mchango                 |
| PUT      | /api/entries/:id            | Admin     | Hariri mchango                 |
| DELETE   | /api/entries/:id            | Admin     | Futa mchango                   |

---

## Jinsi Frontend na Backend Zinavyowasiliana

```
Browser (port 3000)
  └─ React fetch('/api/members')
      └─ Vite proxy (dev)  ──►  http://localhost:5000/api/members
          └─ Express router
              └─ middleware/auth.js  (protected routes)
                  └─ routes/members.js
                      └─ db.js  →  kikoba.db
```

**Muhimu:** Proxy ya Vite inafanya kazi wakati wa maendeleo (`npm run dev`) tu.  
Kwa uzalishaji (production), tumia reverse proxy (nginx) au `VITE_API_URL` ya URL kamili.

---

## Deployment ya Production (muhtasari)

```env
# server/.env
CORS_ORIGIN=https://kikoba.example.com
JWT_SECRET=<siri_ndefu_na_salama>

# client/.env
VITE_API_URL=https://api.kikoba.example.com
```

```powershell
# Jenga frontend
cd client && npm run build
# Faili zitakuwa kwenye client/dist/ — zipeleke kwenye seva yako
```
