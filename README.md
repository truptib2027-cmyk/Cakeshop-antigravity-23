# 🎂 CakeCart — Production-Ready Home-Bakery Ordering System

A production-ready home-bakery web application designed for bespoke celebration cakes, with **strict daily capacity limits**, **pickup window scheduling**, **tamper-resistant server-side pricing**, **40-character custom cake message limits**, **10-minute temporary holds**, and **digital collection QR codes**.

Prepared for deployment on **Vercel** with **Neon Serverless PostgreSQL** and **Drizzle ORM**.

---

## 👥 The CakeCart Multi-Agent Architecture

Built and verified by the **CakeCart Three-Agent Team**:

1. **Agent 1 (App Agent)**:
   - Modern luxury bakery responsive UI built with Next.js 15 App Router, TypeScript, and Tailwind CSS.
   - Complete customer flow: Home, filterable Menu, interactive Cake Details & Customiser, Cart, Checkout, Order Confirmation (with dynamic collection QR code), My Orders (with 24h cutoff cancellation), and Baker Production Dashboard.
   - Enforces 48-hour minimum lead times and 40-character message limits in both client UI and server APIs.

2. **Agent 2 (Database Engine Agent)**:
   - Neon Serverless PostgreSQL with Drizzle ORM migrations across 14 tables.
   - Enforces database integrity: UUID PKs, UTC timestamps, integer minor units (cents), unique dates on `daily_capacity`, and check constraints (`reserved_cakes <= max_cakes`, `reserved_cakes >= 0`, `length(custom_message) <= 40`).
   - Transactional order engine locking rows with 10-minute temporary reservation holds and server-side fee recalculation.
   - Automated idempotent Vercel Cron endpoint (`/api/cron/release-holds`) protected by `CRON_SECRET`.

3. **Agent 3 (QA Agent)**:
   - 32-check automated end-to-end verification suite (`tests/qa-suite.ts`).
   - Verified concurrent capacity race conditions (preventing overselling), expired hold releases, 48h lead times, 40-char limits, payment idempotency, and 24h cancellation rules.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router, React 19, TypeScript)
- **Styling**: Tailwind CSS v4 with luxury artisan bakery design tokens
- **Database**: Neon Serverless PostgreSQL via `@neondatabase/serverless`
- **ORM & Migrations**: Drizzle ORM (`drizzle-orm`, `drizzle-kit`)
- **Authentication**: Email + password with `bcryptjs`, secure sessions in `httpOnly` cookies with `jose` (JWT)
- **Background Scheduled Tasks**: Vercel Cron (`vercel.json`)
- **Image Storage**: Vercel Blob / Base64 Data URL integration
- **Icons**: Lucide React

---

## 🚀 Quick Start & Local Setup

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd "CakeShop Antigravity"
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your `JWT_SECRET`, `CRON_SECRET`, and optionally your Neon `DATABASE_URL`.

### 3. Database Migration & Seeding
```bash
# Generate SQL migrations
npm run db:generate

# Apply migrations to Neon PostgreSQL (if DATABASE_URL is configured)
npm run db:migrate

# Seed products, sizes, flavours, dietary tags, pickup slots, and capacity
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running the Automated QA Test Suite

The QA Agent provides an automated test suite verifying all 24 production criteria:
```bash
npm run test:qa
```
This tests:
- Customer and baker authentication, password hashing, and role checks
- Menu filtering (Eggless, Gluten-Free, Bento, Price range)
- 40-character message limit rejection on server
- 48-hour minimum advance lead time server enforcement
- Closed bakery dates rejection
- Concurrent capacity race conditions (2 parallel requests for 1 remaining cake slot)
- Expired hold cleanup and capacity restoration via cron
- Server fee calculations ($3.00 hand-piped message fee, size/flavour modifiers)
- Payment idempotency and duplicate retry prevention
- 24-hour cancellation cutoff rule
- Customer isolation security
- Baker status transitions (`CONFIRMED` ➜ `BAKING` ➜ `READY` ➜ `COLLECTED`)

---

## 👩‍🍳 Demo Accounts

For testing, two pre-configured accounts are seeded:

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Baker** | `baker@cakecart.com` | `BakerSecret123!` | Full Baker Production Hub, Capacity Editor, Status Transitions, QR Lookup |
| **Customer** | `customer@example.com` | `Customer123!` | Ordering, Order Tracking, QR Passes, Cancellation |

---

## 🚢 Deploying to Vercel

### Step 1: Provision Neon PostgreSQL in Vercel
1. In the Vercel Dashboard for your project, navigate to the **Storage** tab.
2. Select **Connect Store** ➔ **Neon** (from Vercel Marketplace).
3. Vercel automatically sets:
   - `DATABASE_URL` (pooled connection for serverless function requests)
   - `DATABASE_URL_UNPOOLED` (direct connection for running migrations)

### Step 2: Configure Environment Variables
Set the following secrets in **Vercel Project Settings > Environment Variables**:
- `JWT_SECRET`: Random 32+ character string
- `CRON_SECRET`: Secret token for protecting `/api/cron/release-holds`
- `BLOB_READ_WRITE_TOKEN`: (Optional) Provisioned from Vercel Blob
- `PAYMENT_PROVIDER_KEY`: Test mode key

### Step 3: Run Migrations on Deploy
Add to your Vercel Build Command:
```bash
npm run db:migrate && next build
```

### Step 4: Verify Cron Job
The file `vercel.json` automatically registers the cron job:
```json
{
  "crons": [
    {
      "path": "/api/cron/release-holds",
      "schedule": "*/10 * * * *"
    }
  ]
}
```
Every 10 minutes, Vercel triggers this endpoint with `Authorization: Bearer ${CRON_SECRET}`, automatically releasing expired temporary holds.

---

## 🛡️ Key Business Rules Implemented

1. **48-Hour Minimum Lead Time**:
   Every cake is handcrafted from scratch. Orders scheduled within 48 hours of the current timestamp are blocked both in the calendar UI and on the server (`400 Bad Request`).
2. **Strict Daily Oven Capacity**:
   Daily capacity is enforced using database locks. `reserved_cakes` can never exceed `max_cakes`.
3. **10-Minute Hold Reservation**:
   When a customer initiates checkout, a temporary hold is placed. If payment is not completed within 10 minutes, the hold expires and the capacity is automatically returned to the bakery.
4. **40-Character Message Limit**:
   Hand-piped messages are strictly constrained to 40 characters in the UI and enforced with a PostgreSQL check constraint:
   `CONSTRAINT "custom_message_len" CHECK (length(custom_message) <= 40)`.
5. **24-Hour Cancellation Cut-Off**:
   Customers can cancel their orders freely up to 24 hours before their scheduled pickup window. Within 24 hours, the order is locked for kitchen prep and cancellation is disallowed.
