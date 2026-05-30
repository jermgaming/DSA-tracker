# DSA Tracker 🔥

A full-stack DSA (Data Structures & Algorithms) question tracker with daily streaks, progress tracking, and an admin panel. Built with React + Supabase.

---

## Features

- **User Auth** — Email/password + Google OAuth (via Supabase)
- **Questions** — Grouped by topic, filterable by difficulty, searchable
- **Daily tracking** — Tick off questions; checkboxes reset each day
- **Streak system** — Consecutive days tracker with current + longest streak
- **Activity heatmap** — GitHub-style contribution calendar (last 365 days)
- **History view** — Browse questions you solved on any past date
- **Admin panel** — Full CRUD for questions, view all users + their streaks
- **Dark / Light mode** — Persisted via localStorage

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Backend / DB | Supabase (PostgreSQL + Auth + Realtime) |
| Styling | Pure CSS (no Tailwind, no component library) |
| Date utils | date-fns |
| Icons | lucide-react |

---

## Folder Structure

```
dsa-tracker/
├── public/
│   └── index.html
├── src/
│   ├── App.js                    # Router + auth protection
│   ├── index.js                  # Entry point
│   ├── lib/
│   │   └── supabase.js           # Supabase client + admin config
│   ├── hooks/
│   │   ├── useAuth.js            # Auth context + provider
│   │   ├── useQuestions.js       # Questions, progress, streak, calendar
│   │   └── useAdmin.js           # Admin CRUD operations
│   ├── components/
│   │   └── shared/
│   │       └── Layout.js         # Sidebar + mobile nav
│   ├── pages/
│   │   ├── LoginPage.js          # Login / Signup
│   │   ├── Dashboard.js          # Stats, heatmap, weekly bar chart
│   │   ├── QuestionsPage.js      # All questions with filters
│   │   ├── HistoryPage.js        # Past solve history
│   │   └── AdminPage.js          # Admin CRUD + user view
│   └── styles/
│       └── global.css            # CSS variables, utility classes
├── supabase-schema.sql           # Complete DB schema + sample data
├── .env.example                  # Environment variable template
└── package.json
```

---

## Setup Instructions

### Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project**, choose a name and database password
3. Wait for the project to provision (~2 minutes)

### Step 2 — Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click **Run** (Ctrl+Enter)

This creates:
- `profiles` table (extends auth.users)
- `questions` table (with 15 sample questions)
- `user_progress` table (daily tracking)
- `streaks` table
- All RLS policies
- Triggers for auto-creating profiles + streaks
- The `update_streak()` function

### Step 3 — Enable Google OAuth (Optional)

1. In Supabase dashboard: **Authentication > Providers > Google**
2. Enable Google and copy the **Callback URL** shown
3. Go to [Google Cloud Console](https://console.cloud.google.com)
4. Create a project → **APIs & Services > Credentials > OAuth 2.0 Client**
5. Add your callback URL as an authorized redirect URI
6. Copy the Client ID and Secret back into Supabase

### Step 4 — Get Your API Keys

1. In Supabase: **Settings > API**
2. Copy:
   - **Project URL** (e.g. `https://abcxyz.supabase.co`)
   - **anon/public key**

### Step 5 — Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
REACT_APP_ADMIN_EMAILS=your@email.com
```

> **Admin access**: Add your email(s) comma-separated. These users get the Admin Panel tab.

### Step 6 — Install & Run

```bash
npm install
npm start
```

App opens at `http://localhost:3000`

---

## Making Yourself an Admin

Two options:

**Option A** (Recommended): Set `REACT_APP_ADMIN_EMAILS=your@email.com` in `.env.local`

**Option B**: Via Supabase SQL Editor:
```sql
UPDATE public.profiles
SET is_admin = TRUE
WHERE email = 'your@email.com';
```

---

## Database Schema Overview

```sql
profiles (id, email, full_name, avatar_url, is_admin, created_at)
questions (id, title, difficulty, topic, description, link, order_index, created_at)
user_progress (id, user_id, question_id, solved_date)  -- UNIQUE(user_id, question_id, solved_date)
streaks (user_id, current_streak, longest_streak, last_solved_date)
```

**Streak Logic (in `update_streak()` function):**
- `last_solved_date = today` → no change (already counted)
- `last_solved_date = yesterday` → increment streak
- `last_solved_date < yesterday` → reset to 1
- `last_solved_date = null` → first solve, set to 1

---

## Sample Questions Included

| Topic | Count | Difficulties |
|-------|-------|-------------|
| Arrays | 4 | Easy, Easy, Medium, Medium |
| Strings | 3 | Easy, Medium, Medium |
| Trees | 3 | Easy, Medium, Medium |
| Dynamic Programming | 3 | Easy, Medium, Medium |
| Graphs | 2 | Medium, Medium |

---

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
# Follow prompts, add env vars in Vercel dashboard
```

### Netlify
```bash
npm run build
# Drag the 'build' folder to netlify.com/drop
# Set env vars in Site settings > Build & deploy > Environment
```

---

## Common Issues

**"Row level security policy" errors** → Make sure you ran the full SQL schema including the `CREATE POLICY` statements.

**Google OAuth redirect mismatch** → Your Supabase callback URL must exactly match what's in Google Cloud Console.

**Checkboxes not resetting** → The app filters `user_progress` by `solved_date = today` — this is automatic. No cron needed.

**Streak not updating** → Make sure the `update_streak` function was created (check Supabase > Database > Functions).

---

## Extending the App

- **Add more topics**: Just insert questions with new topic names via Admin Panel
- **Leaderboard**: Query `streaks` table ordered by `current_streak`
- **Notes on questions**: Add a `user_notes` table with `user_id, question_id, note`
- **LeetCode import**: Use LeetCode's public API or GraphQL to bulk-import questions
- **Push notifications**: Use Supabase Edge Functions + browser Notifications API for daily reminders
