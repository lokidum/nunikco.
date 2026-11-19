# Backlog

Ordered by expected enquiries per hour of work. Top item ships next. Evidence column names where the problem was seen.

| # | Query or page | Change | Why (evidence) | Effort | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | whole site | Turn on "Enforce HTTPS" in GitHub Pages settings | http://nunik.co/ returns 200 instead of redirecting; no HSTS. Health check 2026-11-11: "http to https: NO". Owner-only setting. | S | blocked: owner |
| 2 | Google Business Profile | Get reviews flowing to the Nunik Co. profile (or create a service-area profile if there is none). The map pack for "web design canberra" is Subz Designs (143 reviews), Project Simple (47), Canberra Web (42); no page change can win it without a profile and reviews | Google AU SERP 2026-11-17 | M | blocked: owner |
| 3 | /services/automation/ | Rewrite the opening passage to answer the query in two sentences and add one concrete fact (typical project length, a named platform, a real timeframe) | citability_check 2026-11-11: page score 59/100, 0 of 12 passages at 70+, every passage flagged "no concrete fact". The page already has FAQ answers ("How long does an automation project take?") but they are short and vague. Needs the owner's real numbers: [NEEDS REAL DATA: typical build time, typical retainer scope]. | M | todo |
| 4 | /services/brand/ and /services/web/ | Same answer-first rewrite as item 3 | Same pattern expected; run citability_check on each before editing. | M | todo |
| 5 | / | Home page hero passages score 20 to 28 for citability; that is fine for a hero, but add one quotable "what Nunik Co. does, for whom, from where" paragraph in the server HTML near the top | citability_check on /: 63/100, 6% of passages at 70+. AI assistants quote self-contained passages; the home page has none. | S | todo |
| 6 | real estate | Decide whether real estate gets an industry page. The home page and llms.txt name it as a sector and a research article exists, but there is no /industries/real-estate/ | keyword-map.csv gap rows; the autopilot's rule is one page per core query. | M | todo: owner decision |
| 7 | /locations/canberra/ | Photo added 2026-11-19. Still to do: one Canberra client or project when there is one; check it passes the swap test (what on the page is true of Canberra only?) and add Canberra-specific proof if the owner has it: local clients, local events, where meetings happen | local-seo swap test; not yet reviewed. | S | todo |
| 8 | Google Business Profile | Confirm whether a GBP exists for Nunik Co. If it does, record category, reviews and the website link in seo/local.md; if not, decide with the owner whether to create one (service-area, address hidden) | seo/local.md is empty of GBP facts. | S | blocked: owner |
| 9 | llms.txt | publish.py now keeps llms.txt in step with each new article; nothing manual left | ai-visibility step 7 (optional, cheap). | S | todo |
| 10 | competitors | Get three to eight competitor names from the owner, snapshot their sitemaps into seo/competitors/ | Web search on 2026-11-11 found no comparable Canberra agency; owner knows the real ones. | S | blocked: owner |
| 11 | /industries/* | 19 pages carry FAQPage markup that no longer earns a rich result. Keep for now (harmless, labels Q and A clearly); do not add more | Health check structured data summary; Google ended FAQ rich results in 2026. | - | note |
| 13 | "300 clicks a month" claim | Four queued articles (stand-out guide 20 Nov, ACDA case study 23 Nov, Rams case study 2 Dec, lead-gen guide 8 Dec) say each driving-school site gets about 300 Google clicks a month. Search Console shows about 140 (ACDA, last 28 days) and 45 to 60 a month (Rams). Owner to confirm the source or correct the wording before each date | GSC 2026-11-17; seo/claims.md | S | blocked: owner |
| 14 | Canberra links | Pitch two or three Canberra sites for a link to /locations/canberra/ (local business associations, an ACT directory). Canberra Daily's "best web designers" list is a paid placement ($165 to $275 a month) and its links pass ranking credit, which breaks Google's link rules, so skip it | competitor teardown 2026-11-17 | M | todo |
| 15 | seo canberra | Build /locations/canberra/seo/ for seo canberra, small business seo canberra and seo services canberra (all in AU autocomplete). Needs the owner to say what the $300 and $550 retainers include, or the page is thin | keyword-research-2026-11-19.md | M | blocked: owner |
| 16 | indexing | Request indexing for /locations/canberra/ (last crawled 15 Nov, before the rebuild), /services/, /industries/trades/, /services/web/ and the website cost article (both "unknown to Google") | URL Inspection 2026-11-19 | S | blocked: owner |
| 12 | research articles | Check each article's internal links down to a service page and the industry page it supports | content-that-ranks rule: every guide links to a money page. Not yet checked. | S | todo |

## Done

| # | What | When |
| --- | --- | --- |
| d1 | /book/ was an orphan (in the sitemap, linked from no page except 404). Footer link "Book a 15-minute call" added on every page. | 2026-11-11 |
| d4 | /locations/canberra/ rebuilt as "Web Design Canberra" (title, H1, 1,600 words, prices, proof, FAQ, ProfessionalService + OfferCatalog + FAQPage schema); home retitled for web design and growth consultancy; 19 industry H1s carry a keyword line; footer link reads "Web design Canberra" on every page | 2026-11-17 |
| d5 | 17-article research queue: one article every three days 17 Nov to 4 Jan via GitHub Actions (automation/research-queue/) | 2026-11-17 |
| d2 | 12 meta descriptions over 160 characters and 4 titles over 60 (or under 25) rewritten within range; og: and twitter: tags kept in sync. | 2026-11-11 |
| d3 | seo/ and the internal markdown docs excluded from the published site with `_config.yml`. | 2026-11-11 |
