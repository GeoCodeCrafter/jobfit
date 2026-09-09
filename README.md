# jobfit

Free, open source job search. Drop your CV in, get the jobs that match.

**[Try it](https://geocodecrafter.github.io/jobfit/)** — no account, no signup.

Your CV is read in the browser tab. It is never uploaded, and there is no
server to upload it to. The whole thing is a static page and a JSON file.

## What's different

**It shows you how old each posting is.** Companies publish a real
first-published date through their hiring systems, and job boards don't show
it to you, so a role that has been open since February reads as new. jobfit
puts the real age on every result and hides anything over 90 days by default.

Nearly a third of the postings in the current index have been live longer than
90 days.

Lever is the exception: its API returns requisition creation rather than
publish date, so those postings show "age unknown" instead of a made up number.

## How it works

```
your CV ──▶ read in your browser ──▶ matched against docs/jobs.json ──▶ results
```

`docs/jobs.json` holds ~8,000 open roles pulled from public company job boards
(Greenhouse, Ashby and others). It's a file in this repo, so you can read it,
fork it, or build your own.

Matching is skill overlap, weighted by how much the job asks for, adjusted for
whether the job title is in the same line of work as your CV, and penalised if
the posting is stale. It is deliberately simple and easy to argue with.

## Run it locally

```
cd docs && python -m http.server 8000
```

## Rebuild the index

Needs a [job-radar](https://github.com/GeoCodeCrafter) database:

```
python scripts/build-index.py path/to/jobradar.db
```

## There's a CLI too

```
pip install -e .
jobfit data/sample-cv.md
```

## Known limits

- Skills come from a keyword list. It will miss things you'd expect it to catch.
- Seniority isn't scored, so a junior CV sees staff roles.
- The index is a snapshot, not live. Rebuild it to refresh.
- Coverage is skewed to tech. Other fields are thin.

MIT.
