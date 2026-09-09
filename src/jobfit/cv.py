"""Read a CV into the few fields matching needs.

Placeholder. Plain text and markdown work. PDF and docx raise.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

# TODO: this list is a stand-in. Replace with something derived from the job
# corpus rather than guessed at.
SKILLS = {
    "python", "javascript", "typescript", "react", "vue", "svelte", "node",
    "django", "flask", "fastapi", "sql", "postgres", "mysql", "sqlite",
    "docker", "kubernetes", "aws", "gcp", "azure", "terraform", "linux",
    "git", "css", "html", "tailwind", "webgl", "canvas", "d3", "figma",
    "rust", "go", "java", "c#", "php", "ruby", "swift", "kotlin",
    "pandas", "numpy", "pytorch", "tensorflow", "spark", "airflow",
}

_YEARS = re.compile(r"(\d{1,2})\+?\s*years?", re.I)


@dataclass
class CV:
    text: str
    skills: set[str] = field(default_factory=set)
    years: int | None = None
    titles: list[str] = field(default_factory=list)

    def __str__(self) -> str:
        years = f"{self.years}y" if self.years else "unknown experience"
        return f"{len(self.skills)} skills, {years}"


def load(path: str | Path) -> CV:
    path = Path(path)
    if path.suffix.lower() in {".pdf", ".docx", ".doc"}:
        raise NotImplementedError(
            f"{path.suffix} not supported yet. Export to .txt or .md for now."
        )
    return parse(path.read_text(encoding="utf-8", errors="replace"))


def parse(text: str) -> CV:
    lower = text.lower()

    skills = {s for s in SKILLS if re.search(rf"(?<![\w+#]){re.escape(s)}(?![\w+#])", lower)}

    years = None
    found = [int(m) for m in _YEARS.findall(text)]
    if found:
        years = max(found)

    # TODO: real title extraction. Lines under 60 chars containing a role word
    # is a crude stand-in and will pick up noise.
    titles = [
        line.strip()
        for line in text.splitlines()
        if 0 < len(line.strip()) < 60
        and re.search(r"engineer|developer|designer|analyst|manager|scientist", line, re.I)
    ]

    return CV(text=text, skills=skills, years=years, titles=titles[:10])
