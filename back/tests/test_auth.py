def test_register_creates_account(client):
    resp = client.post("/auth/register", json={
        "username": "alice",
        "mail": "alice@example.com",
        "password": "pass1234",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert "refreshToken" in data
    assert data["account"]["username"] == "alice"
    assert data["account"]["mail"] == "alice@example.com"


def test_register_duplicate_with_same_password_returns_tokens(client):
    payload = {"username": "bob", "mail": "bob@example.com", "password": "pass1234"}
    r1 = client.post("/auth/register", json=payload)
    r2 = client.post("/auth/register", json=payload)
    assert r1.status_code == 200
    assert r2.status_code == 200


def test_register_duplicate_with_wrong_password_returns_409(client):
    client.post("/auth/register", json={"username": "carol", "mail": "carol@example.com", "password": "pass1"})
    resp = client.post("/auth/register", json={"username": "carol", "mail": "carol@example.com", "password": "wrong"})
    assert resp.status_code == 409


def test_login_success(client, registered_user):
    resp = client.post("/auth/login", json={"mail": "test@example.com", "password": "secret123"})
    assert resp.status_code == 200
    assert "token" in resp.json()


def test_login_wrong_password(client, registered_user):
    resp = client.post("/auth/login", json={"mail": "test@example.com", "password": "wrong"})
    assert resp.status_code == 401


def test_login_unknown_user(client):
    resp = client.post("/auth/login", json={"mail": "nobody@example.com", "password": "x"})
    assert resp.status_code == 401


def test_me_returns_account(client, registered_user, auth_headers):
    resp = client.get("/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == "testuser"
    assert data["mail"] == "test@example.com"


def test_me_without_token_returns_401(client):
    resp = client.get("/auth/me")
    assert resp.status_code == 401


def test_refresh_returns_new_tokens(client, registered_user):
    resp = client.post("/auth/refresh", json={"refreshToken": registered_user["refreshToken"]})
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert "refreshToken" in data


def test_refresh_with_access_token_returns_401(client, registered_user):
    resp = client.post("/auth/refresh", json={"refreshToken": registered_user["token"]})
    assert resp.status_code == 401
