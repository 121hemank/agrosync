# 🌾 AgroSync — Smart Agriculture Management Platform

AgroSync is a full-stack agriculture management web application that connects **farmers**, **buyers**, and **admins** in a single ecosystem. It provides an interactive marketplace for agricultural produce, role-based dashboards, real-time market price tracking, weather insights, crop planning, expense & revenue management, and automated PDF/CSV report generation.

> **Note:** The AI service (yield prediction, crop recommendation) has been removed from this repository.

---

## ✨ Features

### Role-based access
Three distinct user roles, each with a tailored dashboard:

- **Farmer** — manage farms & crops, sell produce on the marketplace, track weather, plan planting with a crop calendar, log expenses and revenue, and view analytics.
- **Buyer** — browse and purchase fresh produce, track orders, and view market trends.
- **Admin** — manage users, products, orders, and view platform-wide analytics & reports.

### Marketplace
- Farmers can create, update, and delete produce listings.
- Buyers can browse listings and place orders.
- Order lifecycle management (placed → confirmed → delivered → completed / cancelled).

### Farm & crop management
- Register farm details (name, location, soil type, area) with image uploads.
- Log crops planted on each farm and track their status.

### Weather & market data
- Current weather, multi-day forecast, and historical data per farm.
- Live market prices for crops with price history and summary.

### Crop calendar
- Schedule planting, watering, fertilizing, and harvesting tasks.
- Weather-based alerts so farmers never miss critical moments.

### Financial tracking
- Log expenses by category with monthly summaries.
- Track revenue and farm profitability analytics.

### Analytics & reports
- Dashboard analytics for farmers, buyers, and admins (Chart.js).
- Generate and download **PDF** and **CSV** reports.

### Communications & notifications
- Real-time notifications over **Socket.IO** (order updates, alerts).
- Notifications center with unread counts and read/unread state.

### Authentication & security
- Register, login, OTP email verification, forgot/reset password.
- JWT access + refresh token flow with automatic refresh on 401.
- Role-based authorization on the backend.

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI library |
| **TypeScript** | Typed JavaScript |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Styling |
| **Redux Toolkit** | Global state management |
| **React Query** | Server-state / data fetching |
| **React Router** | Client-side routing |
| **Chart.js / react-chartjs-2** | Analytics dashboards |
| **Leaflet / react-leaflet** | Interactive maps |
| **Axios** | HTTP client |
| **Socket.IO Client** | Real-time notifications |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js / Express** | REST API & WebSocket server |
| **Supabase (PostgreSQL)** | Database & storage (service role) |
| **JSON Web Tokens (JWT)** | Authentication |
| **Socket.IO** | Real-time events |
| **Multer** | File uploads |
| **PDFKit / json2csv** | Report generation |
| **Nodemailer + SendGrid** | Email (OTP, notifications) |

---

## 📁 Project Structure

```
agrosync/
├── backend/              # Node.js + Express REST API
│   └── src/
│       ├── config/       # Supabase client config
│       ├── db/           # Schema, RLS policies, seeds, migrations
│       ├── middleware/   # Auth, file upload
│       ├── routes/       # API route handlers
│       └── services/     # Email (SendGrid), etc.
├── frontend/             # React + TypeScript SPA
│   └── src/
│       ├── components/   # Shared components (Layout)
│       ├── pages/        # Landing, auth, and role pages
│       │   ├── admin/    # Admin dashboard & management
│       │   ├── buyer/    # Buyer dashboard & marketplace
│       │   └── farmer/   # Farmer tools & dashboard
│       ├── services/     # API client & socket client
│       ├── store/        # Redux store & slices
│       └── types/        # TypeScript types
└── package.json          # Root scripts (dev, install)
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ & npm
- A [Supabase](https://supabase.com/) project (PostgreSQL database + storage)

### 1. Clone & install dependencies

```bash
git clone https://github.com/121hemank/agrosync.git
cd agrosync
npm run install:all
```

This installs dependencies for both `backend` and `frontend`.

### 2. Set up environment variables

Create the required `.env` files (see templates below).

**`backend/.env`**

```env
PORT=5000

# Authentication
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret

# Supabase (PostgreSQL + storage)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# CORS
FRONTEND_URL=http://localhost:5173

# Email (for OTP & notifications) — SendGrid recommended
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key   # starts with SG.
EMAIL_FROM=AgroSync AI <your_verified_sender@example.com>
# Alternatives: RESEND_API_KEY / RESEND_FROM, or Gmail SMTP (blocked from cloud IPs)
```

See [backend/.env.example](backend/.env.example) for the full annotated template.

**`frontend/.env`**

```env
VITE_BACKEND_URL=http://localhost:5000
```

> Leave `VITE_BACKEND_URL` blank if using the Vite dev proxy (default proxy targets `http://localhost:5000`).

### 3. Set up the database

Open your Supabase project's **SQL Editor** and run, in order:
1. `backend/src/db/schema.sql` — creates all tables
2. `backend/src/db/rls_policies.sql` — row-level security policies
3. `backend/src/db/seeds.sql` — seed data
4. Any migrations in `backend/src/db/migrations/`

### 4. Run the app

From the project root:

```bash
npm run dev:backend    # API on http://localhost:5000
npm run dev:frontend   # Web app on http://localhost:5173
```

Or run both at once:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔧 Available Scripts (root)

| Command | Description |
|---|---|
| `npm run install:all` | Install backend & frontend dependencies |
| `npm run dev:backend` | Start the Express API (watch mode) |
| `npm run dev:frontend` | Start the Vite dev server |
| `npm run dev` | Run both concurrently |

---

## 🗄 Database Overview

Key tables (see `backend/src/db/schema.sql` for the full definition):

- **users** — farmer / buyer / admin accounts
- **refresh_tokens** — JWT refresh token storage
- **farms** & **farm_images** — farm profiles & photos
- **crops** — reference crop catalog
- **marketplace_listings** — produce listings
- **orders** — buyer orders / farmer sales
- **calendar_tasks** & **alerts** — crop calendar & weather alerts
- **expenses** — farm expense tracking
- **market_prices** — commodity market price history
- **notifications** — real-time notifications

---

## 📡 API Overview

Base URL: `http://localhost:5000/api`

| Area | Endpoints |
|---|---|
| **Auth** | `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/send-otp`, `/auth/forgot-password`, `/auth/reset-password` |
| **Farms** | `/farms`, `/farms/:id`, `/farms/:id/crops` |
| **Weather** | `/weather/current/:farmId`, `/weather/forecast/:farmId`, `/weather/history/:farmId` |
| **Marketplace** | `/marketplace`, `/marketplace/:id`, `/marketplace/my/listings` |
| **Orders** | `/orders`, `/orders/my-orders`, `/orders/my-sales`, `/orders/:id/status` |
| **Market prices** | `/market-prices`, `/market-prices/crops`, `/market-prices/history/:crop` |
| **Calendar** | `/calendar`, `/calendar/upcoming`, `/calendar/alerts/weather` |
| **Expenses** | `/expenses`, `/expenses/summary/by-category`, `/expenses/summary/monthly` |
| **Analytics** | `/analytics/dashboard`, `/analytics/revenue`, `/analytics/crops`, `/analytics/market-trends` |
| **Reports** | `/reports/pdf`, `/reports/csv` |
| **Notifications** | `/notifications`, `/notifications/:id/read`, `/notifications/unread-count` |
| **Admin** | `/admin/dashboard`, `/admin/users`, `/admin/products`, `/admin/orders`, `/admin/analytics` |

---

## 📝 License

This project is for demonstration/portfolio purposes.
