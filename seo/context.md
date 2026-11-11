# Nunik Co.: SEO context

Site:          https://nunik.co
Business:      AI automation, brand identity and web development studio for owner-operated businesses (trades, hospitality, automotive, real estate), based in Canberra, delivering remotely worldwide.
Business type: service-area (no public premises; remote delivery)
Service area:  Worldwide. Canberra is the home base and has its own page (/locations/canberra/). The booking page deliberately does not mention Canberra.
Conversion:    Enquiry form (six-step flow on / and /contact/, delivered by Web3Forms to hello@nunik.co) and Cal.com booking (nunikco/strategy-call, on /book/ and embedded on most pages). Google Ads conversion fires on /thank-you/inquiry/ and /thank-you/booking/. Not tracked beyond that.
Competitors:   find them. One web search on 2026-11-11 returned Fiverr and Upwork freelancers and no Canberra agency with the same stack; the owner's own list is needed.
Ship mode:     commit to main, owner pushes (GitHub Pages deploys from main)
Client voice:  Plain, direct, Australian English, no em dashes, no hype words. Sanskrit principle names (Yukti, Rasa, Artha) are display words only. See PRODUCT.md and DESIGN.md in the repo root.
State folder:  seo/ is excluded from the published site by `_config.yml` (GitHub Pages legacy Jekyll build). Verify after deploy: https://nunik.co/seo/context.md must be a 404.

## Facts (each with where it came from)

| Fact | Value | Source | Checked |
| --- | --- | --- | --- |
| Email | hello@nunik.co | footer of every page, JSON-LD on / | 2026-11-11 |
| Phone | none published | site | 2026-11-11 |
| Address | Canberra, ACT, AU (locality only, no street) | JSON-LD ProfessionalService on / | 2026-11-11 |
| Area served | Worldwide | JSON-LD on /, footer "Delivery: Remote, worldwide" on /book/ | 2026-11-11 |
| Hours | none published | site | 2026-11-11 |
| Years trading | not published | site | 2026-11-11 |
| Licences, memberships, ABN | none published | site | 2026-11-11 |
| Prices | none published ("scoped plan and a fixed price within one working day") | /contact/ | 2026-11-11 |
| Reviews | none on site; GBP not verified | site | 2026-11-11 |
| Social | instagram.com/nunikco, linkedin.com/company/nunik-co | JSON-LD sameAs on / | 2026-11-11 |

## Data sources

| Source | Connected | What it unlocks |
| --- | --- | --- |
| Google Search Console | no | queries, positions, indexing status, page two pushes, CTR rewrites |
| Google Business Profile | not verified (unknown whether one exists) | calls, direction requests, reviews, map pack for "ai agency canberra" |
| Analytics | gtag present (`lead_form_step`, `lead_form_submit` events); GA4 property not checked from here | enquiries by channel |
| Rank tracker | no | positions by location |

## How the site is built

Static HTML, one self-contained `index.html` per folder, no templating and no build step for pages. Titles, descriptions, canonicals, hreflang (en-AU + x-default), Open Graph, Twitter cards and JSON-LD all live in each page's `<head>`; a change to a shared element is a scripted edit across every page (see the scratch scripts described in the repo's past commits). `sitemap.xml`, `robots.txt` and `llms.txt` are hand-maintained files at the root. `main.js` and `style.css` are minified with esbuild into `main.min.js` and `style.min.css`, which the pages load. Tailwind is prebuilt into `tailwind.min.css`; only classes already present exist. Hosting is GitHub Pages (legacy Jekyll build from `main`, CNAME nunik.co). No HTTP headers can be set; HSTS and the HTTP to HTTPS redirect depend on the repository's "Enforce HTTPS" setting, which is off as of 2026-11-11.

Structured data on 2026-11-11 (from the health check): BreadcrumbList on 32 pages, Service on 24, FAQPage on 19 (no rich result since Google ended FAQ rich results; harmless), Article on 4, CollectionPage on 4, ProfessionalService on 3, ContactPage 1, WebPage 1. All blocks parse.
