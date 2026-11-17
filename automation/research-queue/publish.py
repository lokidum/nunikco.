#!/usr/bin/env python3
"""Release queued research articles on their scheduled date.

For every article in schedule.json whose date is on or before today (Canberra time) and
whose page exists in _queue/research/<slug>/, this:
  - copies the page to research/<slug>/index.html
  - turns cross-links to articles that are not live yet into plain text, and back into
    links once they are live (anchors carry data-article="<slug>")
  - lists live articles on /research/, in sitemap.xml and in llms.txt
Writes the commit message to automation/research-queue/.commit-message when something
new went live. Safe to run any number of times.

Usage: python3 automation/research-queue/publish.py [--today YYYY-MM-DD]
"""
import html
import json
import re
import shutil
import sys
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
QUEUE = ROOT / "_queue/research"
SITE = "https://nunik.co"
ARROW = ('<svg width="14" height="14" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true">'
         '<path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/></svg>')

A_RE = re.compile(r'<a href="/research/([a-z0-9-]+)/" data-article="\1">(.*?)</a>', re.S)
SPAN_RE = re.compile(r'<span class="ra-xref" data-article="([a-z0-9-]+)">(.*?)</span>', re.S)


def today_canberra():
    for i, a in enumerate(sys.argv):
        if a == "--today" and i + 1 < len(sys.argv):
            return date.fromisoformat(sys.argv[i + 1])
    return datetime.now(ZoneInfo("Australia/Sydney")).date()


def meta_for(slug):
    m = json.loads((HERE / f"articles/{slug}.json").read_text())
    return m["title"], m["description"]


def toggle_links(text, live):
    text = A_RE.sub(lambda m: m.group(0) if m.group(1) in live
                    else f'<span class="ra-xref" data-article="{m.group(1)}">{m.group(2)}</span>', text)
    text = SPAN_RE.sub(lambda m: f'<a href="/research/{m.group(1)}/" data-article="{m.group(1)}">{m.group(2)}</a>'
                       if m.group(1) in live else m.group(0), text)
    return text


def replace_block(text, start, end, block, anchor_before):
    pattern = re.compile(re.escape(start) + r".*?" + re.escape(end), re.S)
    new = f"{start}\n{block}{end}" if block else f"{start}\n{end}"
    if pattern.search(text):
        return pattern.sub(lambda _: new, text, count=1)
    i = text.index(anchor_before)
    return text[:i] + new + "\n" + text[i:]


def month(d):
    return d.strftime("%B %Y")


def card(item, title, desc):
    d = date.fromisoformat(item["publish"])
    return f'''                    <a href="/research/{item['slug']}/" class="glass-card rounded-xl p-8 md:p-12 reveal-item nav-link block group">
                        <div class="flex flex-col md:flex-row gap-6 md:gap-12 items-start">
                            <div class="flex-1">
                                <p class="font-mono text-xs t-accent mb-3" style="opacity:0.6;">No. {item['no']:02d} / {html.escape(item['section'])}</p>
                                <h3 class="font-headline italic text-3xl md:text-4xl t-text mb-4">{html.escape(title)}</h3>
                                <p class="t-muted text-sm md:text-base leading-relaxed max-w-2xl">{html.escape(desc)}</p>
                                <span class="inline-flex items-center gap-1 mt-6 text-xs uppercase tracking-widest t-accent group-hover:translate-x-1 transition-transform">Read the report {ARROW}</span>
                            </div>
                            <div class="flex-shrink-0">
                                <span class="font-mono text-xs t-muted block">Published</span>
                                <time datetime="{item['publish']}" class="font-headline italic text-2xl t-accent">{month(d)}</time>
                            </div>
                        </div>
                    </a>
'''


def main():
    today = today_canberra()
    schedule = json.loads((HERE / "schedule.json").read_text())["articles"]
    ready = [a for a in schedule if (QUEUE / a["slug"] / "index.html").exists()]
    live_items = [a for a in ready if date.fromisoformat(a["publish"]) <= today]
    live = {a["slug"] for a in live_items}
    newly = [a for a in live_items if not (ROOT / "research" / a["slug"] / "index.html").exists()]

    # 1. Cross-links anywhere on the site (articles, the Canberra page, service pages).
    site_pages = [p for p in ROOT.glob("**/*.html")
                  if not p.relative_to(ROOT).parts[0] in ("automation", ".git", "node_modules")]
    for path in site_pages:
        old = path.read_text(encoding="utf-8")
        new = toggle_links(old, live)
        if new != old:
            path.write_text(new, encoding="utf-8")

    # 2. Copy live pages into place.
    for a in live_items:
        src, dest = QUEUE / a["slug"] / "index.html", ROOT / "research" / a["slug"] / "index.html"
        dest.parent.mkdir(parents=True, exist_ok=True)
        if not dest.exists() or dest.read_bytes() != src.read_bytes():
            shutil.copyfile(src, dest)

    newest_first = sorted(live_items, key=lambda a: a["publish"], reverse=True)

    # 3. Research index cards.
    idx = ROOT / "research/index.html"
    t = idx.read_text(encoding="utf-8")
    cards = "".join(card(a, *meta_for(a["slug"])) for a in newest_first)
    t = replace_block(t, "<!-- queue:cards:start -->", "<!-- queue:cards:end -->", cards,
                      '<a href="/research/digital-transformation-australian-smbs-2026/"')
    idx.write_text(t, encoding="utf-8")

    # 4. Sitemap.
    sm = ROOT / "sitemap.xml"
    t = sm.read_text(encoding="utf-8")
    urls = "".join(f"  <url>\n    <loc>{SITE}/research/{a['slug']}/</loc>\n    <lastmod>{a['publish']}</lastmod>\n"
                   f"    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n" for a in newest_first)
    t = replace_block(t, "<!-- queue:start -->", "<!-- queue:end -->", urls, "</urlset>")
    if newest_first:
        t = re.sub(r"(<loc>https://nunik\.co/research/</loc>\s*<lastmod>)[^<]*", r"\g<1>" + newest_first[0]["publish"], t)
    sm.write_text(t, encoding="utf-8")

    # 5. llms.txt: one line per live article, under the Research index line.
    ll = ROOT / "llms.txt"
    lines = ll.read_text(encoding="utf-8").splitlines()
    queue_urls = {f"{SITE}/research/{a['slug']}/" for a in schedule}
    lines = [l for l in lines if not any(u in l for u in queue_urls)]
    at = next(i for i, l in enumerate(lines) if l.startswith("Field reports from client work"))
    add = []
    for a in newest_first:
        title, desc = meta_for(a["slug"])
        add.append(f"- [{title}]({SITE}/research/{a['slug']}/): {desc} Published {month(date.fromisoformat(a['publish']))}.")
    lines[at + 1:at + 1] = add
    ll.write_text("\n".join(lines) + "\n", encoding="utf-8")

    msg = HERE / ".commit-message"
    if newly:
        titles = [meta_for(a["slug"])[0] for a in newly]
        msg.write_text("Publish research: " + "; ".join(titles) + "\n", encoding="utf-8")
    elif msg.exists():
        msg.unlink()
    print(f"today {today}: {len(live)} live, {len(newly)} new, {len(ready) - len(live)} waiting")
    for a in newly:
        print("  published", a["slug"])
    upcoming = [a for a in ready if a["slug"] not in live]
    if upcoming:
        print(f"  next: {upcoming[0]['slug']} on {upcoming[0]['publish']}")


if __name__ == "__main__":
    main()
