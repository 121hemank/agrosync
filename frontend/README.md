# AgroSync Frontend

React + TypeScript single-page application built with Vite, Tailwind CSS, Redux Toolkit, and React Query.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file from `.env.example` (optional — the dev proxy points to `http://localhost:5000` by default):

   ```bash
   cp .env.example .env
   ```

   `VITE_BACKEND_URL` can be left blank to use the Vite dev proxy, or set to your backend URL.

3. Start the dev server:

   ```bash
   npm run dev
   ```

The app runs on `http://localhost:5173`.

## Build

```bash
npm run build   # type-checks (tsc) then builds with Vite
npm run preview
```

## Project Layout

```
src/
├── components/  # Shared components (Layout)
├── hooks/
├── pages/       # Landing, auth, and role pages
│   ├── admin/
│   ├── buyer/
│   └── farmer/
├── services/    # API client, socket client
├── store/       # Redux store & slices
└── types/       # TypeScript types
```

See the [root README](../README.md) for full feature & setup details.
