# DoctorCRM

Patient management app: schedule appointments, manage patients, attach photos. Installable as a Progressive Web App (PWA) — open the deployed link on a phone and "Add to Home Screen".

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without any extra setup, data is stored in `data/db.json` on disk — fine for local dev, but **not for production**, since most hosts wipe the filesystem on every deploy/restart.

## Persistent storage (required for production)

The app automatically switches to Postgres when a `DATABASE_URL` environment variable is set — no code changes needed. Tables are created automatically on first use.

1. Create a free Postgres database with any provider, e.g. [Neon](https://neon.tech) (recommended, generous free tier) or [Supabase](https://supabase.com).
2. Copy its connection string (looks like `postgresql://user:pass@host/dbname?sslmode=require`).
3. Set it as `DATABASE_URL`:
   - Locally: create a `.env.local` file with `DATABASE_URL=postgresql://...`
   - On your host (see below): add it as an environment variable in the project settings.

Once set, all clients/appointments/photos persist permanently in that database, regardless of how many times the app is redeployed or restarted.

## Deploying so anyone can use it

1. Push this project to a GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new), import the repo, and deploy (free tier is enough).
3. In the Vercel project's **Settings → Environment Variables**, add `DATABASE_URL` from the step above.
4. Redeploy. Vercel gives you a public `https://your-app.vercel.app` URL anyone can open — including on an iPhone, where Safari's "Add to Home Screen" will install it like a native app icon.

## Why Postgres instead of the JSON file in production

`lib/db-file.ts` (JSON file) and `lib/db-postgres.ts` (Postgres) both implement the same interface (`lib/types.ts`); `lib/db.ts` just picks one based on whether `DATABASE_URL` is set. This means the rest of the app (API routes, pages) never needs to know which backend is active.
