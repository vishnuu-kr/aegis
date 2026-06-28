# Aegis — Pre-Launch TODO

This file tracks work deliberately deferred from the launch commit.
Each item is a clear, single-line headline + a one-paragraph why-when.

---

## Critical (post-launch, week 1)

### Newsletter real backend
- Current state: `src/App.tsx` `footer-newsletter-form` shows "Sent!" without POSTing anywhere (visual fake).
- Goal: pick a provider (ConvertKit / Resend / Buttondown / Loops), add `VITE_NEWSLETTER_ENDPOINT` env var, wire `fetch()`.
- Acceptance: real email lands in your provider; success state still shows "Sent!".

### `og.png` social card
- Current state: `index.html:20` is still a `<!-- TODO ... -->` comment.
- Goal: 1200×630 PNG with brand mark + tagline. Light + dark variants optional.
- Acceptance: `metatags.io` and `opengraph.xyz` show the correct preview; `twitter:card` flipped to `summary_large_image`.

### Demo dashboard gating (`#/app/*`)
- Current state: `#/app/dashboard` opens with mocked data, no auth, no disclaimer banner.
- Goal: either add a fixed sample-data banner, gate behind `?demo=1`, or move to `demo.agenttag.ai` subdomain.
- Acceptance: anon visitors either see an honest "demo data" label or are routed to a wait-list page.

---

## Pre-Launch Polish (do this week if traffic ramps)

### Pricing checkout wiring (or honest "Request quote")
- Goal: bind `pricing` section CTA to a real Stripe Price ID, or relabel to "Talk to sales".
- Acceptance: pricing CTA either works server-side or honestly says "request quote"; no chance of confusion.

### Domain + TLS lockdown
- Goal: confirm `https://agenttag.ai` redirects HTTP→HTTPS, ship HSTS preload, set CSP `default-src` allowing Google Fonts + og.png.
- Acceptance: `curl -I https://agenttag.ai` shows HSTS, redirect, valid CSP.

### Multi-locale hreflang
- Goal: scaffold `x-default` + per-locale alternates when i18n plan lands.
- Acceptance: validators green for the locales you launch in.

### Bundle-size tuning
- Current state: Vite warns bundle > 500 kB during build (`dist/assets/index-*.js` 915 kB).
- Goal: lazy-load `dashboard/*`, dynamic-import framer-motion + lenis to drop below 500 kB on landing route.
- Acceptance: Lighthouse Performance ≥ 90; initial draw weight ≤ 350 kB gzipped.

### Cookie consent banner (if EU traffic)
- Goal: GDPR/CCPA banner on first visit; choice persisted in localStorage.
- Acceptance: visitors see banner once; choice honored across pages.

---

## Operational / Moat

### CI deploy workflow
- Current state: no `.github/workflows/deploy.yml`.
- Goal: on `main` push, `vite build` then deploy to Vercel (or Netlify/Cloudflare).
- Acceptance: every merge to `main` auto-deploys to staging.

### Analytics (privacy-respecting)
- Goal: Plausible or PostHog self-hosted event taxonomy (hero CTA, newsletter submit, dashboard route views).
- Acceptance: events fire; no third-party script leaking data.

### `.well-known/security.txt` + `humans.txt`
- Goal: standard disclosure + attribution files (security researchers use these).
- Acceptance: `/.well-known/security.txt` valid; `humans.txt` credits contributors.

### Mobile dropdown parity
- Current state: Platform dropdown only opens via mouse hover.
- Goal: tap/keyboard support on touch devices; ESC to close; `aria-expanded` toggles correctly.
- Acceptance: iOS Safari and Android Chrome open the panel on tap.

### Readme final pass
- Goal (mostly done in this commit): elevator + stack + scripts + contact.

---

## Tracking

- [ ] Newsletter backend
- [ ] og.png card
- [ ] Demo dashboard gating
- [ ] Pricing checkout
- [ ] Domain + TLS lockdown
- [ ] hreflang scaffold
- [ ] Bundle-size tuning
- [ ] Cookie consent
- [ ] CI deploy workflow
- [ ] Analytics taxonomy
- [ ] .well-known/security.txt
- [ ] humans.txt
- [ ] Mobile dropdown parity
- [ ] Readme final pass

Last updated: pre-launch draft.
