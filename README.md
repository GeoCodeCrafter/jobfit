# jobfit

Point it at your CV, get a list of jobs worth applying to.

```
$ jobfit data/sample-cv.md

  15 skills, 6y  ->  6 jobs, 6 worth a look

  100.0  Frontend Engineer         Placeholder Ltd      12d
         css, react, typescript, webgl
   75.0  Product Designer          Sample Studio        31d
         css, figma, html
   70.0  Senior Frontend Engineer  Example Corp        140d
         aws, node, react, typescript
```

The number on the right is how long the posting has been live. Anything over
90 days is scored down, because a lot of those are not really open.

## Status

Skeleton. It runs end to end, but every interesting part is a stand-in:

- **CV parsing** matches against a hardcoded skill list. Titles are picked up
  with a regex. PDF and docx raise `NotImplementedError`.
- **Scoring** is skill overlap and nothing else. No seniority, no salary, no
  location, no title similarity.
- **Jobs** come from a fixture file by default.

## Real data

Reads a [job-radar](https://github.com/GeoCodeCrafter) database if you have one:

```
jobfit cv.md --source jobradar --db path/to/jobradar.db
```

## Install

```
pip install -e .
pytest
```

## Next

1. Replace the skill list with something derived from the job corpus.
2. Score seniority and title, not just skills.
3. PDF parsing.
4. Explain the rejects too. Knowing why a job was filtered out is more useful
   than the ranking.
