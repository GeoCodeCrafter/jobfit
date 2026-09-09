from jobfit import cv, jobs
from jobfit.match import rank


def test_parses_the_sample_cv():
    parsed = cv.load("data/sample-cv.md")
    assert "react" in parsed.skills
    assert parsed.years == 6


def test_pdf_is_not_supported_yet():
    import pytest

    with pytest.raises(NotImplementedError):
        cv.load("whatever.pdf")


def test_ranks_the_fixture_jobs():
    parsed = cv.load("data/sample-cv.md")
    results = rank(parsed, jobs.load("fixture"))
    assert results
    assert results[0].score >= results[-1].score


def test_stale_postings_are_pushed_down():
    parsed = cv.load("data/sample-cv.md")
    titles = [r.job.title for r in rank(parsed, jobs.load("fixture"))]
    assert titles.index("Frontend Engineer") < titles.index("Senior Frontend Engineer")
