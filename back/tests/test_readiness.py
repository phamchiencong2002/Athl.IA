from app.services.adaptation import build_advice, compute_readiness_score, suggest_intensity


# --- Unit tests for adaptation logic ---

def test_readiness_score_perfect_sleep_no_strain():
    score = compute_readiness_score(8, 0, 0, 0, 0)
    assert score == 100


def test_readiness_score_no_sleep_max_strain():
    score = compute_readiness_score(0, 10, 10, 10, 10)
    assert score == 0


def test_readiness_score_midpoint():
    score = compute_readiness_score(6, 3, 3, 2, 1)
    assert 0 <= score <= 100


def test_intensity_reduction_high_pain():
    result = suggest_intensity(8, readiness_score=80, pain_level=8)
    assert result == 4


def test_intensity_boost_high_readiness():
    result = suggest_intensity(8, readiness_score=80, pain_level=0)
    assert result > 8


def test_intensity_reduction_low_readiness():
    result = suggest_intensity(8, readiness_score=20, pain_level=0)
    assert result < 8


def test_advice_recovery_for_low_score():
    advice = build_advice(readiness_score=20, pain_level=2)
    assert "recuperation" in advice.lower()


def test_advice_excellent_high_score():
    advice = build_advice(readiness_score=90, pain_level=0)
    assert "excellente" in advice.lower()


# --- Integration tests for readiness endpoints ---

def test_submit_readiness(client, registered_user, auth_headers):
    account_id = registered_user["account"]["id"]
    resp = client.post("/readiness", json={
        "account_id": account_id,
        "sleep_hours": 7.5,
        "fatigue": 3,
        "stress": 2,
        "soreness": 2,
        "pain_level": 0,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "readiness_score" in data
    assert "ai_advice" in data
    assert 0 <= data["readiness_score"] <= 100


def test_get_latest_readiness(client, registered_user):
    account_id = registered_user["account"]["id"]
    client.post("/readiness", json={
        "account_id": account_id,
        "sleep_hours": 8,
        "fatigue": 1,
        "stress": 1,
        "soreness": 1,
        "pain_level": 0,
    })
    resp = client.get(f"/readiness/latest?account_id={account_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["readiness_score"] >= 0
    assert "log_date" in data


def test_get_latest_readiness_not_found(client, registered_user):
    account_id = registered_user["account"]["id"]
    resp = client.get(f"/readiness/latest?account_id={account_id}")
    assert resp.status_code == 404


def test_readiness_history(client, registered_user):
    account_id = registered_user["account"]["id"]
    for _ in range(3):
        client.post("/readiness", json={
            "account_id": account_id,
            "sleep_hours": 7,
            "fatigue": 4,
            "stress": 3,
            "soreness": 2,
            "pain_level": 1,
        })
    resp = client.get(f"/readiness/history?account_id={account_id}")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1
