# Empanadas Bochas — Website

Website for [Empanadas Bochas](https://www.instagram.com/empanadasbochas/), a homemade Argentine empanada business in NYC. Full requirements and scope live in [`docs/PRD.md`](docs/PRD.md).

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4
- Deployed on [Vercel](https://vercel.com)
- Payments/catalog: [Square](https://squareup.com) (Catalog API + Checkout API)
- Order/delivery-request emails: [Resend](https://resend.com)

## Getting started

Requires Node.js 20+ (this repo was built against v20.20.2 — if you're on an older Node, install [nvm](https://github.com/nvm-sh/nvm) and run `nvm install 20 && nvm use 20` first).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it.

## Project structure

- `src/app/` — pages (App Router: one folder per route)
- `src/components/` — shared UI (nav, footer, etc.)
- `public/brand/` — logo and brand assets
- `Images/` — source brand assets (logo variants, color palette, product photos) not yet wired into the app
- `docs/PRD.md` — full product requirements and scope
