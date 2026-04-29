def test_generate_program(client, registered_user, auth_headers):
    account_id = registered_user["account"]["id"]
    resp = client.post("/workouts/programs/generate", json={
        "account_id": account_id,
        "goal": "muscle",
        "week_availability": 3,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["goal"] == "muscle"
    assert len(data["sessions"]) == 3
    for s in data["sessions"]:
        assert s["planned_intensity"] > 0
        assert s["status"] == "planned"


def test_generate_program_unknown_account(client):
    resp = client.post("/workouts/programs/generate", json={
        "account_id": "00000000-0000-0000-0000-000000000000",
        "goal": "health",
        "week_availability": 2,
    })
    assert resp.status_code == 404


def test_today_session_not_found(client, registered_user):
    account_id = registered_user["account"]["id"]
    resp = client.get(f"/workouts/sessions/today?account_id={account_id}")
    assert resp.status_code == 404


def test_today_session_found_after_generate(client, registered_user):
    account_id = registered_user["account"]["id"]
    client.post("/workouts/programs/generate", json={
        "account_id": account_id,
        "goal": "health",
        "week_availability": 5,
    })
    resp = client.get(f"/workouts/sessions/today?account_id={account_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert "id" in data
    assert data["status"] == "planned"


def test_complete_session(client, registered_user):
    account_id = registered_user["account"]["id"]
    program_resp = client.post("/workouts/programs/generate", json={
        "account_id": account_id,
        "goal": "endurance",
        "week_availability": 3,
    })
    session_id = program_resp.json()["sessions"][0]["id"]
    resp = client.post(f"/workouts/sessions/{session_id}/complete", json={
        "rpe_reported": 7,
        "notes": "Bon effort",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "done"
    assert data["rpe_reported"] == 7


def test_list_sessions(client, registered_user):
    account_id = registered_user["account"]["id"]
    client.post("/workouts/programs/generate", json={
        "account_id": account_id,
        "goal": "health",
        "week_availability": 2,
    })
    resp = client.get(f"/workouts/sessions?account_id={account_id}")
    assert resp.status_code == 200
    assert len(resp.json()) >= 2


def test_list_exercises(client):
    resp = client.get("/workouts/exercises")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) > 0
    assert "name" in data[0]


def test_dashboard_summary(client, registered_user, auth_headers):
    account_id = registered_user["account"]["id"]
    client.post("/workouts/programs/generate", json={
        "account_id": account_id,
        "goal": "muscle",
        "week_availability": 4,
    })
    resp = client.get("/dashboard/summary", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["user"]["username"] == "testuser"
    assert "analytics" in data
    assert "progress" in data


def test_dashboard_summary_unauthorized(client):
    resp = client.get("/dashboard/summary")
    assert resp.status_code == 401


def test_weight_log_crud(client, registered_user, auth_headers):
    resp = client.post("/weight-logs", json={"weight_kg": 78.5}, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["weight_kg"] == 78.5

    resp = client.get("/weight-logs", headers=auth_headers)
    assert resp.status_code == 200
    logs = resp.json()
    assert len(logs) == 1
    assert logs[0]["weight_kg"] == 78.5


def test_weight_log_unauthorized(client):
    resp = client.post("/weight-logs", json={"weight_kg": 70.0})
    assert resp.status_code == 401


def test_injuries_crud(client, registered_user, auth_headers):
    account_id = registered_user["account"]["id"]
    resp = client.post("/injuries", json={
        "account_id": account_id,
        "muscle_group": "quadriceps",
        "pain_level": 4,
    })
    assert resp.status_code == 200
    injury_id = resp.json()["id"]

    resp = client.get(f"/injuries?account_id={account_id}")
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp = client.patch(f"/injuries/{injury_id}/resolve")
    assert resp.status_code == 200
    assert resp.json()["is_active"] is False
