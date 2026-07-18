# Shohay — সহায়

Crowdfunding platform for Bangladesh. Support verified campaigns for medical
care, education, and disaster relief with bKash, Nagad, and cards.

Built with [Next.js](https://nextjs.org), [Supabase](https://supabase.com),
and [SSLCommerz](https://sslcommerz.com), hosted on [Vercel](https://vercel.com).

## Running locally (or in GitHub Codespaces)

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Configuration

Copy `.env.example` to `.env.local` and fill in the values. In production the
same variables are set in **Vercel → Project → Settings → Environment
Variables** — never commit real secrets to this repository.

## Deploying

Every push to the `main` branch is deployed automatically by Vercel.
Vercel keeps every previous deployment, so a bad release can be rolled back
from the Vercel dashboard in two clicks.
