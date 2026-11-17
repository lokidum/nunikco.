# Research queue

Seventeen articles release on nunik.co, one every three days, without anyone touching the site.

- `schedule.json`: the order and the dates. Change a date to move an article.
- `articles/<slug>.json` and `.html`: each article's metadata and body (format in FORMAT.md). Edit these to change wording.
- `source/`: the original PDFs and text extracts.
- `build.py`: renders every article into `_queue/research/<slug>/index.html` with the live site's template. Run it after any edit to `articles/`.
- `publish.py`: copies articles that are due into `research/`, updates /research/, `sitemap.xml` and `llms.txt`, and turns links to not-yet-published articles into plain text until they go live.
- `.github/workflows/publish-research.yml`: runs `publish.py` at 7:30 am Canberra time every day and pushes when something was due.

After editing an article:

```
python3 automation/research-queue/build.py
python3 automation/research-queue/publish.py
```

then commit and push. To publish early, change its date to today, run both scripts and push, or run the workflow from the Actions tab.

Folders starting with `_` and everything in `automation/` are never served by GitHub Pages, so queued articles stay private until their date (they are visible in the GitHub repository itself).
