# AgroSync Backend

Node.js + Express REST API with Supabase (PostgreSQL), JWT authentication, Socket.IO real-time notifications, and PDF/CSV report generation.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file from `.env.example`:

   ```bash
   cp .env.example .env
   ```

   Fill in your Supabase credentials, JWT secrets, and email provider keys.

3. Run the database scripts from `src/db/` in your Supabase SQL Editor:
   - `schema.sql`
   - `rls_policies.sql`
   - `seeds.sql`
   - any migrations in `src/db/migrations/`

4. Start the server:

   ```bash
   npm run dev     # watch mode
   npm start       # production
   ```

The API runs on `http://localhost:5000` (`/api/*`).

## Project Layout

```
src/
├── config/      # Supabase client config
├── db/          # Schema, RLS, seeds, migrations
├── middleware/  # Auth, file upload
├── routes/      # REST API route handlers
└── services/    # Email, etc.
```

See the [root README](../README.md) for the full API endpoint reference.
