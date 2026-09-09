"""jobfit <cv> — list jobs worth applying to."""

from __future__ import annotations

import argparse
import sys

from . import cv as cv_module
from . import jobs as jobs_module
from .match import rank


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="jobfit", description=__doc__)
    parser.add_argument("cv", help="path to a .txt or .md CV")
    parser.add_argument("-n", "--limit", type=int, default=20)
    parser.add_argument(
        "--source", default="fixture", choices=["fixture", "jobradar"]
    )
    parser.add_argument("--db", help="job-radar sqlite path, with --source jobradar")
    args = parser.parse_args(argv)

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    try:
        cv = cv_module.load(args.cv)
    except (OSError, NotImplementedError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    if args.source == "jobradar":
        if not args.db:
            print("error: --source jobradar needs --db", file=sys.stderr)
            return 2
        listings = jobs_module.load("jobradar", db=args.db)
    else:
        listings = jobs_module.load("fixture")

    results = rank(cv, listings, limit=args.limit)

    print(f"\n  {cv}  ->  {len(listings)} jobs, {len(results)} worth a look\n")
    if not results:
        print("  nothing matched. The skill list in cv.py is probably too narrow.\n")
        return 1

    width = max(len(r.job.title) for r in results)
    for r in results:
        age = f"{r.job.days_live}d" if r.job.days_live is not None else ""
        print(f"  {r.score:5.1f}  {r.job.title:<{width}}  {r.job.company:<18} {age:>5}")
        print(f"         {r.reason}")
    print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
