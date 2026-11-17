# Research article format

Each article in the queue is two files in `articles/`, named by its slug from `schedule.json`:

- `<slug>.json`: the page metadata
- `<slug>.html`: the article body only (what goes inside `<article class="research-article">`)

`build.py` wraps them in the site's research page template and writes `_queue/research/<slug>/index.html`. `publish.py` copies an article into `research/<slug>/` on its date and updates the research index, `sitemap.xml` and `llms.txt`.

## `<slug>.json`

```json
{
  "slug": "how-much-does-a-website-cost-australia",
  "title": "How Much Does a Small Business Website Cost in Australia?",
  "description": "120 to 155 characters. Leads with the answer or the main keyword, ends with a reason to click.",
  "h1_main": "How Much Does a Small Business Website Cost",
  "h1_em": "in Australia in 2027?",
  "dek": "One or two sentences under the H1. The direct answer, in plain words.",
  "breadcrumb": "Website Cost in Australia",
  "primary_keyword": "how much does a website cost australia",
  "faq": [ { "q": "A question that appears in the article", "a": "Its answer, plain text, 1 to 3 sentences" } ],
  "related_title": "Web design and development",
  "related_blurb": "One sentence on how Nunik Co. helps with this topic."
}
```

Rules for the fields:

- `title`: 60 characters or fewer, no brand suffix. Main keyword first or near the front. It is the `<title>` and the og/twitter title.
- `description`: 120 to 155 characters. Contains the main keyword once. No clickbait.
- `h1_main` + `h1_em` together are the visible H1. The template prints them on two lines, the second in italics. Together they should read as the article's title from the PDF.
- `faq`: only question and answer pairs that already exist in the article (a question heading and the paragraph that answers it, or an FAQ section). Two to six. Never invent one. Used for FAQPage structured data.
- `breadcrumb`: 2 to 5 words.

## `<slug>.html`

Plain HTML, no `<html>`, `<head>` or wrapper. Use only these patterns (they are styled already):

```html
<p>Opening paragraph. The direct answer goes first.</p>

<div class="ra-stats">
  <div class="ra-stat"><span class="ra-fig">300</span><span class="ra-lab">what the number means</span></div>
</div>

<span class="ra-num">01</span>
<h2>Section heading, ideally the question a customer asks</h2>
<p>...</p>
<h3>Sub heading</h3>
<ul><li><strong>Lead-in.</strong> Detail.</li></ul>
<ol><li>Step</li></ol>

<div class="ra-table"><table>
  <thead><tr><th>Col</th><th>Col</th></tr></thead>
  <tbody><tr><td>..</td><td>..</td></tr></tbody>
</table></div>

<div class="glass-card rounded-xl p-6 md:p-8 ra-card">
  <p class="ra-label">Small label</p>
  <h4>Card heading</h4>
  <p>Callout text, for "Quick facts", tips and warnings.</p>
</div>

<blockquote class="ra-pull">A line worth pulling out.<cite>Lokesh Barani Kumar, Nunik Co.</cite></blockquote>

<div class="ra-takeaways">
  <p class="ra-label">Label</p>
  <h2>Heading</h2>
  <ul><li>...</li></ul>
</div>

<p class="ra-endnote"><strong>About the author.</strong> ...</p>
```

- Number every H2 section with a `ra-num` span before it (01, 02, ...), except the takeaways block.
- Links to another article in the queue: `<a href="/research/<slug>/" data-article="<slug>">text</a>`. `publish.py` turns these into plain text until that article is live, then back into links, so link freely.
- Links to service pages: `/services/web/`, `/services/automation/`, `/services/brand/`, `/locations/canberra/`, `/industries/trades/`, `/contact/`, `/book/`. Two or three per article, where they help the reader.
- Australian English. No em dashes or en dashes; use commas, colons or full stops.
- Keep the author's words. Light edits only: fix PDF line breaks, turn lists and tables back into lists and tables. Do not add facts, numbers, clients or claims that are not in the PDF.
