"""Score a job against a CV.

Placeholder scoring. Skill overlap, and a penalty for stale postings. Good
enough to produce a ranked list; not good enough to trust.
"""

from __future__ import annotations

from dataclasses import dataclass

from .cv import CV
from .jobs import Job


@dataclass
class Result:
    job: Job
    score: float
    matched: set[str]
    missing: set[str]

    @property
    def reason(self) -> str:
        if not self.matched:
            return "no overlap"
        hit = ", ".join(sorted(self.matched)[:4])
        extra = f" (+{len(self.matched) - 4})" if len(self.matched) > 4 else ""
        return f"{hit}{extra}"


def wanted(job: Job) -> set[str]:
    """Skills the job asks for, falling back to scanning the description."""
    if job.skills:
        return {s.lower() for s in job.skills}

    from .cv import SKILLS

    text = job.text.lower()
    return {s for s in SKILLS if s in text}


def score(cv: CV, job: Job) -> Result:
    need = wanted(job)
    matched = cv.skills & need
    missing = need - cv.skills

    # Share of what the job asks for that the CV covers, damped by how much
    # was asked for at all. Without the second term a job listing one skill you
    # happen to have scores the same as a job listing five.
    coverage = len(matched) / len(need) if need else 0.0
    value = coverage * min(len(matched) / 4, 1.0)

    # TODO: seniority, salary, location and title similarity all belong here.
    # A posting live for months is less likely to be real, so it sinks.
    if job.days_live and job.days_live > 90:
        value *= 0.7

    return Result(job=job, score=round(value * 100, 1), matched=matched, missing=missing)


def rank(cv: CV, jobs: list[Job], limit: int = 20) -> list[Result]:
    results = [score(cv, job) for job in jobs]
    results.sort(key=lambda r: r.score, reverse=True)
    return [r for r in results if r.score > 0][:limit]
