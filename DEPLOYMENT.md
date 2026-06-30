# Public Deployment Checklist

This app has two deployable parts:

1. Flask API in `backend/`
2. React/Vite frontend in `frontend/`

The public frontend cannot use `http://127.0.0.1:5000`; that address only works on your own computer.

## Required Online Services

- A hosted PostgreSQL database, for example Render PostgreSQL, Supabase, Neon, or Railway.
- A hosted Flask API, for example Render Web Service.
- A hosted static frontend, for example Render Static Site, Vercel, Netlify, or GitHub Pages.

## Database

Create the hosted PostgreSQL database, then run these SQL files in order:

1. `database/02_tables.sql`
2. `database/04_ubelt_postgresql_seed.sql`
3. `database/05_ubelt_contact_verification.sql`

Run `database/03_seed.sql` only if you still want the original five demo establishments.

## Backend Environment Variables

Set these on the hosted backend:

```env
DB_HOST=your_host
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_user
DB_PASSWORD=your_password
CORS_ORIGINS=https://your-frontend-domain.example
```

Start command:

```bash
gunicorn --chdir backend app:app
```

## Frontend Environment Variables

Set this on the hosted frontend:

```env
VITE_API_BASE_URL=https://your-backend-domain.example
```

Build command:

```bash
pnpm install --frozen-lockfile && pnpm build
```

Publish directory:

```text
frontend/dist
```

## Contact Verification Rule

Do not publish guessed contact numbers. Keep `Contact to verify` until you have a source from official signage, official social page, direct call, or staff/owner confirmation.
