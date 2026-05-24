# HumanX

Claim pressure system: users submit claims, attach evidence, add pressure points, generate social reveal cards, and run server-side AI pressure analysis through Cloudflare Workers.

## What is included

- Cloudflare Worker API
- D1 database schema
- Static frontend in `public/index.html`
- Standalone demo mode
- Server-side Anthropic proxy at `/api/ai/analyse`

## Required Cloudflare secrets

- `ANTHROPIC_KEY`
- `ADMIN_TOKEN`

## Deployment

Connect this GitHub repo to Cloudflare Workers / Pages, set the D1 binding as `DB`, set the static assets binding as `ASSETS`, and add the two secrets above.
