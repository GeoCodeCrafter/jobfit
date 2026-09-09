#!/usr/bin/env python
"""Turn a job-radar database into the static index the web page loads.

    python scripts/build-index.py path/to/jobradar.db

Only jobs with at least one extracted skill go in, since the browser matches on
skills and a job with none can never rank.
"""

from __future__ import annotations

import json
import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from places import classify  # noqa: E402

OUT = Path(__file__).resolve().parents[1] / "docs" / "jobs.json"


def build(db: str) -> dict:
    con = sqlite3.connect(db)
    con.row_factory = sqlite3.Row

    skills: dict[int, list[str]] = {}
    for job_id, skill in con.execute("SELECT job_id, skill FROM job_skills"):
        skills.setdefault(job_id, []).append(skill.lower())

    rows = con.execute(
        """
        SELECT j.id, j.title, c.name AS company, c.ats, j.url,
               j.location_raw, j.remote_type, j.salary_min_gbp, j.posted_at
        FROM jobs j JOIN companies c ON c.id = j.company_id
        WHERE j.is_open = 1
        """
    ).fetchall()
    con.close()

    jobs = []
    for r in rows:
        tags = skills.get(r["id"])
        if not tags:
            continue
        jobs.append(
            {
                "t": r["title"],
                "c": r["company"],
                "u": r["url"] or "",
                "s": sorted(set(tags)),
                # Lever's createdAt is requisition creation and never resets, so
                # its dates are not posting ages. Drop them rather than mislead.
                "p": (r["posted_at"] or "")[:10] if r["ats"] != "lever" else "",
                "l": r["location_raw"] or "",
                # Country and region tokens, resolved here so the browser only
                # compares short strings. See places.py.
                "k": classify(r["location_raw"] or ""),
                "r": r["remote_type"] or "",
                "m": r["salary_min_gbp"],
            }
        )

    return {"jobs": jobs}


def main(argv: list[str]) -> int:
    if not argv:
        print(__doc__)
        return 2

    index = build(argv[0])
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(index, separators=(",", ":")), encoding="utf-8")

    size = OUT.stat().st_size / 1_048_576
    print(f"  {len(index['jobs']):,} jobs -> {OUT}  ({size:.1f} MB, ~{size / 6:.1f} MB gzipped)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
