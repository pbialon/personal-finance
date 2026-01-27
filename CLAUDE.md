# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev      # Start development server on :3000
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Architecture Overview

Personal Finance is a Next.js 16 full-stack application for managing personal finances with bank integration and AI-powered transaction categorization.

### Tech Stack
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend:** Next.js API Routes, Supabase PostgreSQL
- **External APIs:** Enable Banking (PSD2 Open Banking), OpenAI GPT-4o mini
- **Charts:** Highcharts
- **Deployment:** Vercel with cron jobs

### Code Structure

```
src/
├── app/              # Next.js App Router
│   ├── api/          # RESTful API endpoints
│   └── [pages]/      # Page components (dashboard, budget, categories, transactions, settings)
├── components/       # React components by feature
│   ├── ui/           # Reusable UI primitives (Card, Button, Modal, Input, Select, Badge)
│   ├── layout/       # Sidebar, Navbar, MobileNav
│   └── charts/       # Highcharts wrappers
├── hooks/            # Custom React hooks (useAnalytics, useTransactions, useCategories, useBudget)
├── lib/              # Business logic
│   ├── supabase/     # Database clients (client.ts for browser, server.ts for API routes)
│   ├── enable-banking.ts  # Open Banking integration
│   ├── openai.ts     # AI client
│   └── categorization.ts  # Transaction categorization logic
└── types/            # TypeScript definitions (index.ts)
```

### Data Flow Pattern
```
React Components → Custom Hooks (fetch) → API Routes (/api/*) → Supabase
```

### Key API Endpoints
- `/api/transactions` - CRUD for transactions
- `/api/categories` - Category management
- `/api/budget` - Budget endpoints
- `/api/analytics` - Dashboard stats (stats, category-spending, trends, budget-progress)
- `/api/bank/*` - Open Banking OAuth flow (connect, callback, sync)
- `/api/cron/sync-bank` - Daily bank sync (6 AM UTC via Vercel cron)
- `/api/ai/categorize` - AI transaction categorization

### Database Tables
- `transactions` - Bank transactions with categorization
- `categories` - Expense categories with colors and AI prompts
- `budgets` - Monthly budget allocations
- `bank_connections` - Connected bank account sessions
- `categorization_rules` - Counterparty → Category mappings
- `ai_categorization_log` - AI categorization audit trail

## Key Conventions

- **Language:** All UI text is in Polish (pl-PL), currency is PLN
- **Supabase clients:** Use `client.ts` in browser components, `server.ts` in API routes
- **Styling:** Tailwind CSS with `cn()` utility for class merging (clsx + tailwind-merge)
- **Path aliases:** `@/*` maps to `./src/*`
- **Client components:** Must have `'use client'` directive for interactive components

## Workflow Rules

- **Commit after changes:** After each significant change (new feature, bugfix, refactor), propose a commit. Don't wait for the user to ask.
- **Small commits:** Prefer frequent, small commits over rare, large ones.
- **Test before commit:** Run `npm run build` before committing to verify the code compiles.

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase connection
- `OPENAI_API_KEY` - AI categorization
- `ENABLE_BANKING_APPLICATION_ID`, `ENABLE_BANKING_PRIVATE_KEY` - Bank integration
- `NEXT_PUBLIC_APP_URL` - OAuth redirect URL
- `CRON_SECRET` - Vercel cron security
