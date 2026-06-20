# KB Serambi CRM — Phase 3 Frontend

React + Vite + Tailwind + Supabase Auth CRM system for KB Serambi Bina Sdn Bhd.

---

## Stack

- **React 18** + **Vite**
- **Tailwind CSS** (navy/gold luxury theme)
- **Supabase** (Auth + Database)
- **React Router v6**
- **date-fns** (calendar)
- **lucide-react** (icons)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Supabase — Required column for agent linking

The agent dashboard requires agents to be linked to auth users via `profile_id`.
Make sure your `agents` table has a `profile_id` column (uuid, references profiles.id).

Also ensure `profiles` has:
- `id` (uuid, references auth.users)
- `email` (text)
- `full_name` (text)
- `role` (text) — values: `admin` or `agent`

### 4. Create admin user

In Supabase Dashboard → Authentication → Users, create a user then run:

```sql
UPDATE profiles SET role = 'admin', full_name = 'Admin' WHERE email = 'admin@yourdomain.com';
```

### 5. Run dev server

```bash
npm run dev
```

### 6. Build for production

```bash
npm run build
```

Deploy the `dist/` folder to Netlify, Vercel, or any static host.

---

## Role System

| Role  | Access |
|-------|--------|
| `admin` | Full access: Leads, Agents, Projects, Followups, Commissions |
| `agent` | Own leads, own followups, own commissions only |

Agents are linked to auth users via `agents.profile_id = profiles.id = auth.uid()`.

---

## File Structure

```
src/
├── context/
│   └── AuthContext.jsx       # Auth state + role
├── lib/
│   └── supabase.js           # Supabase client
├── components/
│   ├── layout/
│   │   ├── AdminLayout.jsx   # Admin sidebar + shell
│   │   └── AgentLayout.jsx   # Agent sidebar + shell
│   └── ui/
│       └── index.jsx         # Modal, StatCard, Badge, Spinner, etc.
├── pages/
│   ├── LoginPage.jsx
│   ├── admin/
│   │   ├── AdminDashboard.jsx
│   │   ├── LeadsPage.jsx
│   │   ├── AgentsPage.jsx
│   │   ├── ProjectsPage.jsx
│   │   ├── FollowupsPage.jsx
│   │   └── CommissionsPage.jsx
│   └── agent/
│       ├── AgentDashboard.jsx
│       ├── AgentLeads.jsx
│       ├── AgentFollowups.jsx
│       └── AgentCommissions.jsx
├── App.jsx                   # Routes + protected routes
├── main.jsx
└── index.css                 # Tailwind + component classes
```

---

## Features

- **Login** — Email/password via Supabase Auth
- **Admin Dashboard** — Stats cards + lead pipeline chart + recent activity
- **Lead Management** — Full CRUD, search, filter by status
- **Agent Management** — CRUD + activate/deactivate
- **Project Management** — CRUD with commission rate per project
- **Followups** — Calendar view + upcoming/completed tabs + mark done
- **Commissions** — Summary cards + CRUD + auto-calculate from price × rate
- **Agent Portal** — Personal leads, followups (with today reminder), commissions
- **Mobile responsive** — Collapsible sidebar on mobile
