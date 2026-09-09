"""Where jobs come from.

Two backends. `fixture` reads the sample file and is the default so the thing
runs with no setup. `jobradar` reads a job-radar sqlite database if you have
one.
"""

from __future__ import annotations

import json
import sqlite3
from dataclasses import dataclass, field
from pathlib import Path

DATA = Path(__file__).resolve().parents[2] / "data"


@dataclass
class Job:
    title: str
    company: str
    url: str = ""
    skills: set[str] = field(default_factory=set)
    text: str = ""
    salary_min: int | None = None
    days_live: int | None = None

    def __str__(self) -> str:
        return f"{self.title} at {self.company}"


def fixture() -> list[Job]:
    payload = json.loads((DATA / "sample-jobs.json").read_text(encoding="utf-8"))
    return [
        Job(
            title=j["title"],
            company=j["company"],
            url=j.get("url", ""),
            skills=set(j.get("skills", [])),
            text=j.get("description", ""),
            salary_min=j.get("salary_min"),
            days_live=j.get("days_live"),
        )
        for j in payload
    ]


def jobradar(db: str | Path, limit: int = 500) -> list[Job]:
    """Read open jobs out of a job-radar database."""
    con = sqlite3.connect(str(db))
    con.row_factory = sqlite3.Row
    rows = con.execute(
        """
        SELECT j.id, j.title, j.url, j.description, j.salary_min_gbp,
               c.name AS company,
               CAST(julianday('now') - julianday(j.posted_at) AS INT) AS days_live
        FROM jobs j
        JOIN companies c ON c.id = j.company_id
        WHERE j.is_open = 1
        ORDER BY j.posted_at DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()

    skills: dict[int, set[str]] = {}
    for r in con.execute("SELECT job_id, skill FROM job_skills"):
        skills.setdefault(r[0], set()).add(r[1].lower())

    con.close()
    return [
        Job(
            title=r["title"],
            company=r["company"],
            url=r["url"] or "",
            skills=skills.get(r["id"], set()),
            text=r["description"] or "",
            salary_min=r["salary_min_gbp"],
            days_live=r["days_live"],
        )
        for r in rows
    ]


def load(source: str = "fixture", **kwargs) -> list[Job]:
    if source == "fixture":
        return fixture()
    if source == "jobradar":
        return jobradar(**kwargs)
    raise ValueError(f"unknown source {source!r}")
