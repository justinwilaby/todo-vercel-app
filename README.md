# Vercel + Neon Todo App

This is a non-trivial Next.js app with full todo CRUD backed by Neon Postgres.
It is designed for deployment on Vercel so you can test migration workflows later (for example, Vercel -> Render).

## What it includes

- Next.js App Router project (TypeScript)
- Neon Postgres connection via `@neondatabase/serverless`
- API routes:
  - `GET /api/todos`
  - `POST /api/todos`
  - `PATCH /api/todos/:id`
  - `DELETE /api/todos/:id`
- Todo UI features:
  - create
  - edit inline
  - mark complete/incomplete
  - delete
  - filter by all/active/completed
  - counts summary
- Automatic schema bootstrap (`todos` table is created on first request)

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. Set `DATABASE_URL` in `.env.local` using your Neon connection string.

4. Run locally:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

## Create Neon database

1. In Neon, create a project and database.
2. Copy the pooled connection string.
3. Ensure it includes `sslmode=require`.
4. Use that as `DATABASE_URL`.

## Deploy to Vercel

1. Push this repository to GitHub.
2. In Vercel, import the repo.
3. In Vercel project settings, add environment variable:
   - `DATABASE_URL` = your Neon connection string
4. Deploy.
5. Open the deployed URL and add a todo to confirm DB connectivity.

## Notes for migration testing (Vercel -> Render)

- Keep the same schema and `DATABASE_URL` contract.
- For Render, set the same `DATABASE_URL` env var in your Web Service.
- Because this app initializes schema automatically, first request on Render can bootstrap the table.

