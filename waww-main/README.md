# GARIHA — Smart Urban Parking Management Platform

GARIHA is a full-stack Next.js application designed to streamline urban parking management. It connects drivers with available parking spaces in real-time, empowers parking owners to monetize their spaces, and gives administrators complete operational oversight.

---

## Architecture Overview

The application has been unified into a 100% native Next.js full-stack architecture ready for serverless deployment on **Vercel**:
* **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion, Chart.js.
* **Backend**: Next.js native Route Handlers under `/app/api/`.
* **Database**: PostgreSQL (compatible with Vercel Postgres, Neon, Supabase, AWS RDS).
* **Authentication**: Signed JWTs with `jose`, stored in `HttpOnly`, `SameSite=Lax` secure cookies + Bearer token support.
* **Passwords**: Salted hashing with `bcryptjs`.

---

## Roles & Access Control

* **Super Admin (`admin`)**:
  * Platform overview, statistics, transaction monitor.
  * Validation and management of parking owners (approve, reject, delete).
  * Global user directory with search and role filtering.
  * System-wide notifications and announcements broadcasting.
  * Admin support messaging threads.
* **Parking Owner (`owner`)**:
  * Owner dashboard (revenue, occupancy rates, spot status).
  * Creation and management of parkings and individual parking spots (P1..PN).
  * Reservation tracking and spot availability toggle.
  * Direct communication with support.
  * Profile and security settings.
* **Client / Driver (`driver`)**:
  * Public parking discovery and real-time availability lookup (`/book`).
  * Instant spot reservation with automated expiration handling.
  * Check-in and check-out tracking.
  * Personal reservation history.

---

## Getting Started Locally

### 1. Prerequisites
* Node.js 20+ installed.
* A PostgreSQL database instance (local PostgreSQL, or free cloud instance from Neon / Supabase).

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update the values in `.env`:
```env
DATABASE_URL=postgres://username:password@localhost:5432/gariha_db
JWT_SECRET=your_32_character_random_secret_here
ADMIN_EMAIL=admin@gariha.com
ADMIN_INITIAL_PASSWORD=ChooseYourInitialSecurePassword123!
```

### 3. Initialize the Database & Admin
Run the automated initialization script:
```bash
npm run setup-db
```
This script creates all required tables, relations, and indexes, and configures the initial Super Administrator account using `ADMIN_EMAIL` and `ADMIN_INITIAL_PASSWORD`.

### 4. (Optional) Seed Demo Data
To seed sample parkings and spots in local development, call the seed endpoint:
```bash
curl -X POST http://localhost:3000/api/setup/seed
```

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Automated Tests

Run the test suite to verify password hashing, JWT signing, role authorization rules, and error handling:
```bash
npm test
```

---

## Deployment to Vercel

1. **Push your repository** to GitHub or GitLab.
2. **Import the project in Vercel**:
   * Set **Root Directory** to `waww-main`.
   * Framework Preset: **Next.js**.
3. **Configure Environment Variables in Vercel**:
   * `DATABASE_URL`: Your PostgreSQL connection string (from Vercel Postgres / Neon / Supabase).
   * `JWT_SECRET`: A strong random string (32+ characters).
   * `ADMIN_EMAIL`: The initial administrator's email address.
   * `ADMIN_INITIAL_PASSWORD`: Initial password for the administrator.
   * `SETUP_SECRET`: (Optional) A secret token to protect setup routes.
4. **Deploy**:
   * Once deployed, the database tables are auto-created on first access.
   * Alternatively, trigger a POST to `/api/setup` with `x-setup-secret` header to initialize the schema and admin account.

---

## Legacy Backend Note

The previous Python/FastAPI backend files in `backend/` have been superseded by the native Next.js API routes under `app/api/`. They are retained temporarily for reference and can be safely archived or deleted.
