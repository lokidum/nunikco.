#!/usr/bin/env python3
"""Render queued research articles into full pages.

Reads schedule.json and articles/<slug>.json + articles/<slug>.html, wraps each in the
site's research page template (taken from an existing research page so the head, nav,
footer and scripts stay identical to the live site) and writes
_queue/research/<slug>/index.html at the repo root. publish.py releases them on their date.

Usage: python3 automation/research-queue/build.py [--check]
"""
import html
import json
import re
import sys
from datetime import date
from html.parser import HTMLParser
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
TEMPLATE_SRC = ROOT / "research/trades-lose-clients-before-first-call/index.html"
OUT = ROOT / "_queue/research"
SITE = "https://nunik.co"

AUTHOR = {
    "@type": "Person",
    "@id": f"{SITE}/#founder",
    "name": "Lokesh Barani Kumar",
    "alternateName": "Loki Kumar",
    "jobTitle": "Founder",
    "worksFor": {"@id": f"{SITE}/#organization"},
    "url": f"{SITE}/",
}

ARROW = ('<svg width="14" height="14" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true">'
         '<path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/></svg>')

# Existing reports that new articles can fall back to for "previous" links.
EXISTING = {
    "trades-lose-clients-before-first-call": ("No. 03", "Why Trades Businesses Lose Clients Before the First Call",
        "How brand presentation quietly decides conversion for plumbers, electricians and landscapers, long before anyone picks up the phone."),
}

VOID = {"br", "img", "hr", "input", "meta", "link", "source", "wbr", "col", "area", "base", "embed", "param", "track"}


class TagCheck(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack, self.errors = [], []

    def handle_starttag(self, tag, attrs):
        if tag not in VOID:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if not self.stack or self.stack[-1] != tag:
            self.errors.append(f"unexpected </{tag}> (open: {self.stack[-3:]})")
            if tag in self.stack:
                while self.stack and self.stack.pop() != tag:
                    pass
        else:
            self.stack.pop()


def check_fragment(name, text):
    problems = []
    p = TagCheck()
    p.feed(text)
    p.close()
    problems += p.errors
    if p.stack:
        problems.append(f"unclosed {p.stack}")
    for ch, label in (("—", "em dash"), ("–", "en dash")):
        if ch in text:
            problems.append(f"{label} present")
    return [f"{name}: {x}" for x in problems]


def load_template():
    t = TEMPLATE_SRC.read_text(encoding="utf-8")
    old_url = f"{SITE}/research/trades-lose-clients-before-first-call/"
    old_title = "Why Trades Businesses Lose Clients Before the First Call"
    old_desc = ("How brand presentation quietly decides conversion for plumbers, electricians and "
                "landscapers, long before anyone picks up the phone.")

    def sub(pattern, repl, s, flags=0, count=1):
        new, n = re.subn(pattern, repl, s, count=count, flags=flags)
        assert n == count, f"template pattern not found: {pattern[:60]}"
        return new

    t = sub(r'<script type="application/ld\+json">.*?</script>', "{{JSONLD}}", t, re.S)
    t = sub(r'<article class="research-article">.*?</article>',
            '<article class="research-article">\n{{BODY}}\n                </article>', t, re.S)
    t = sub(r'(<span class="t-faint">/</span>\s*<span class="t-accent">)[^<]*(</span>\s*</nav>)', r"\1{{CRUMB}}\2", t)
    t = sub(r'(eyebrow-rule reveal-item" style="opacity:0.6;">)Research Series / No\. 03 / Brand Strategy', r"\1{{EYEBROW}}", t)
    t = sub(r'(<h1 class="[^"]*">).*?(</h1>)', r"\1{{H1}}\2", t, re.S)
    t = sub(r'(</h1>\s*<p class="[^"]*">).*?(</p>)', r"\1{{DEK}}\2", t, re.S)
    t = sub(r'Published <time datetime="2026-05-09" class="t-text">May 2026</time> <span class="t-faint">/</span> by Loki Kumar',
            'Published <time datetime="{{DATE}}" class="t-text">{{DATE_HUMAN}}</time> <span class="t-faint">/</span> by Lokesh Barani Kumar', t)
    t = sub(r'(<h2 class="[^"]*">Keep reading, or fix it\.</h2>\s*</div>\s*)<div class="grid[^"]*">.*?</a>\s*</div>',
            r"\1{{RELATED}}", t, re.S)
    t = sub(r'<meta property="article:published_time" content="2026-05-09"/>',
            '<meta property="article:published_time" content="{{DATE}}"/>', t)
    t = sub(r'<meta property="article:author" content="Loki Kumar"/>',
            '<meta property="article:author" content="Lokesh Barani Kumar"/>', t)
    t = sub(r'<meta property="article:section" content="Brand Strategy"/>',
            '<meta property="article:section" content="{{SECTION}}"/>', t)
    assert old_url in t and old_title in t and old_desc in t
    t = t.replace(old_url, "{{URL}}").replace(old_title, "{{TITLE}}").replace(old_desc, "{{DESCRIPTION}}")
    leftovers = [s for s in ("trades-lose-clients", "No. 03", "Brand Strategy") if s in t.split("<footer")[0]]
    assert not leftovers, f"template still has article-specific text: {leftovers}"
    return t


def human(d):
    return f"{d.day} {d.strftime('%B %Y')}"


def card(href, label, title, blurb, cta="Read"):
    return (f'<a href="{href}" class="glass-card rounded-xl p-6 md:p-8 reveal-item nav-link block group">\n'
            f'                        <p class="font-mono text-xs t-accent mb-3" style="opacity:0.6;">{html.escape(label)}</p>\n'
            f'                        <h3 class="font-headline italic text-2xl md:text-3xl t-text mb-3">{html.escape(title)}</h3>\n'
            f'                        <p class="t-muted text-sm leading-relaxed">{html.escape(blurb)}</p>\n'
            f'                        <span class="inline-flex items-center gap-1 mt-4 text-xs uppercase tracking-widest t-accent group-hover:translate-x-1 transition-transform">{cta} {ARROW}</span>\n'
            f'                    </a>')


def word_count(fragment):
    text = re.sub(r"<[^>]+>", " ", fragment)
    return len(re.findall(r"[A-Za-z0-9$%']+", html.unescape(text)))


def render(template, item, meta, body, previous):
    url = f"{SITE}/research/{item['slug']}/"
    d = date.fromisoformat(item["publish"])
    no = f"No. {item['no']:02d}"
    graph = [
        {
            "@type": "Article",
            "@id": f"{url}#article",
            "headline": meta["title"],
            "description": meta["description"],
            "datePublished": item["publish"],
            "dateModified": item["publish"],
            "inLanguage": "en-AU",
            "author": AUTHOR,
            "publisher": {"@type": "ProfessionalService", "@id": f"{SITE}/#organization", "name": "Nunik Co.",
                          "url": f"{SITE}/", "logo": {"@type": "ImageObject", "url": f"{SITE}/public/favicons/android-chrome-512x512.png"}},
            "image": {"@type": "ImageObject", "url": f"{SITE}/public/brand/og-image-1200x630.png", "width": 1200, "height": 630},
            "mainEntityOfPage": {"@type": "WebPage", "@id": url},
            "url": url,
            "isPartOf": {"@type": "CreativeWorkSeries", "name": "Nunik Co. Research Series", "url": f"{SITE}/research/"},
            "wordCount": word_count(body),
            "articleSection": item["section"],
            "keywords": meta.get("primary_keyword", ""),
            "about": {"@type": "Thing", "name": meta.get("primary_keyword", meta["title"])},
        },
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{SITE}/"},
            {"@type": "ListItem", "position": 2, "name": "Research", "item": f"{SITE}/research/"},
            {"@type": "ListItem", "position": 3, "name": meta["title"], "item": url},
        ]},
    ]
    faq = [f for f in meta.get("faq", []) if f.get("q") and f.get("a")]
    if faq:
        graph.append({"@type": "FAQPage", "@id": f"{url}#faq", "mainEntity": [
            {"@type": "Question", "name": f["q"], "acceptedAnswer": {"@type": "Answer", "text": f["a"]}} for f in faq]})
    jsonld = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, separators=(",", ":"))
    jsonld = '<script type="application/ld+json">' + jsonld.replace("</", "<\\/") + "</script>"

    prev_slug, prev_label, prev_title, prev_blurb = previous
    related = ('<div class="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 reveal-container">\n                    '
               + card(f"/research/{prev_slug}/", f"Previous report / {prev_label}", prev_title, prev_blurb)
               + "\n                    "
               + card(item["service"], "What we build", meta.get("related_title", "Work with Nunik Co."),
                      meta.get("related_blurb", "Websites, branding and automation for small businesses."), "Open")
               + "\n                </div>")

    h1 = html.escape(meta["h1_main"]) + ("<br><em>" + html.escape(meta["h1_em"]) + "</em>" if meta.get("h1_em") else "")
    out = template
    for key, val in {
        "{{JSONLD}}": jsonld,
        "{{BODY}}": body.strip(),
        "{{RELATED}}": related,
        "{{H1}}": h1,
        "{{DEK}}": html.escape(meta["dek"]),
        "{{CRUMB}}": html.escape(meta.get("breadcrumb", meta["title"])),
        "{{EYEBROW}}": html.escape(f"Research Series / {no} / {item['section']}"),
        "{{DATE_HUMAN}}": human(d),
        "{{DATE}}": item["publish"],
        "{{SECTION}}": html.escape(item["section"]),
        "{{URL}}": url,
        "{{TITLE}}": html.escape(meta["title"]),
        "{{DESCRIPTION}}": html.escape(meta["description"]),
    }.items():
        out = out.replace(key, val)
    assert "{{" not in out, f"unfilled placeholder in {item['slug']}"
    return out


def main():
    check_only = "--check" in sys.argv
    schedule = json.loads((HERE / "schedule.json").read_text())["articles"]
    template = load_template()
    problems, built, missing = [], [], []
    previous = ("trades-lose-clients-before-first-call",) + EXISTING["trades-lose-clients-before-first-call"]
    for item in schedule:
        slug = item["slug"]
        mpath, bpath = HERE / f"articles/{slug}.json", HERE / f"articles/{slug}.html"
        if not (mpath.exists() and bpath.exists()):
            missing.append(slug)
            continue
        meta = json.loads(mpath.read_text())
        body = bpath.read_text(encoding="utf-8")
        problems += check_fragment(slug, body)
        if len(meta["title"]) > 60:
            problems.append(f"{slug}: title is {len(meta['title'])} characters")
        if not 110 <= len(meta["description"]) <= 160:
            problems.append(f"{slug}: description is {len(meta['description'])} characters")
        if not check_only:
            dest = OUT / slug / "index.html"
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(render(template, item, meta, body, previous), encoding="utf-8")
            built.append(slug)
        previous = (slug, f"No. {item['no']:02d}", meta["title"], meta["description"])
    print(f"built {len(built)}, missing {len(missing)}: {', '.join(missing) or 'none'}")
    for p in problems:
        print("PROBLEM", p)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
