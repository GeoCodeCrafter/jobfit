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

## Live search

Press **search company boards live** and your browser queries around 100
company hiring systems directly and matches what it finds. Every search is
your own: you see what is posted right now, not what someone scraped weeks ago.

This works because Greenhouse and Ashby both send
`access-control-allow-origin: *`, so a static page can read them with no proxy
and no server in between.

Ashby is opt-in because it returns the full description of every job, which
averages 649KB a board and about 27MB across the set. Greenhouse is 56KB a
board, roughly 5.5MB for all 100, and has no descriptions at all — so live
Greenhouse matching works off job titles, which is weaker than the saved index.
Fetching Greenhouse descriptions would cost around 80MB, which is why it
doesn't.

## How it works

```
your CV ──▶ read in your browser ──▶ matched against the saved index
                                 └─▶ or against boards fetched live
```

`docs/jobs.json` holds ~8,000 roles as a starting point so there is something
to show instantly. `docs/boards.json` is the list of company boards the live
search visits. Both are files in this repo, so you can read them, fork them or
swap in your own.

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

## Location

It reads your country off the CV: a UK postcode, a dialling code, or a city
name. Jobs are then filtered to ones open to that country, counting regions, so
a role listed for EMEA still shows for someone in the UK. Listings with no
usable location stay in rather than being guessed away.

The detected country is a dropdown you can change, because the guess is
sometimes wrong.

## Known limits

- Skills come from a keyword list. It will miss things you'd expect it to catch.
- Seniority isn't scored, so a junior CV sees staff roles.
- The saved index is a snapshot. Use live search for what's posted now.
- Live Greenhouse results match on the job title only, so they rank lower
  and less accurately than the saved index does.
- Coverage is software, design and data. If you work in another field there is
  very little here for you, and the page says so rather than showing junk.
- About 13% of listings have a location string it can't resolve.

MIT.
