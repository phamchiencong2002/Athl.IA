from app.services.adaptation import build_advice, compute_readiness_score, suggest_intensity


def test_readiness_score_bounds():
    assert compute_readiness_score(0, 10, 10, 10, 10) == 0
    assert compute_readiness_score(12, 0, 0, 0, 0) == 100


def test_intensity_reduction_with_high_pain():
    assert suggest_intensity(8, readiness_score=80, pain_level=8) == 4


def test_advice_contains_recovery_for_low_score():
    advice = build_advice(readiness_score=20, pain_level=2)
    assert "recuperation" in advice.lower()
