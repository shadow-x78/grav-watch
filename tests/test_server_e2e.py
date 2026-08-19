# GravWatch - Server End-to-End Test Suite (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
import sys
import unittest
from datetime import datetime, timezone
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from httpx import AsyncClient, ASGITransport
from services.server.main import app
from services.server.core.config import settings
from services.server.models.db import Base
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from services.server.core.database import get_db

TEST_AGENT_KEY = "test-agent-secret-key-32-chars-long"
TEST_MASTER_KEY = "test-master-secret-key-32-chars-long"
test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
TestSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False)

async def override_get_db():
    async with TestSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

class TestServerE2E(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        settings.AGENT_API_KEY = TEST_AGENT_KEY
        settings.MASTER_API_KEY = TEST_MASTER_KEY
        settings.PUBLIC_ORIGIN = "http://localhost:8000"
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
        self.transport = ASGITransport(app=app)
        self.client = AsyncClient(transport=self.transport, base_url="http://test")

    async def asyncTearDown(self):
        await self.client.aclose()

    async def test_health_endpoint(self):
        resp = await self.client.get("/api/v1/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "healthy")

    async def test_root_status_endpoint(self):
        resp = await self.client.get("/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "online")
        self.assertEqual(data["dashboard_url"], "http://localhost:3000")

    async def test_auth_url_returns_absolute_origin(self):
        resp = await self.client.get("/api/v1/auth/url?account_id=acc-1")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["auth_url"].startswith("https://accounts.google.com") or "auth" in data["auth_url"])

    async def test_auth_url_rejects_path_traversal(self):
        resp = await self.client.get("/api/v1/auth/url?account_id=../etc")
        self.assertEqual(resp.status_code, 400)

    async def test_auth_login_endpoint_returns_json(self):
        resp = await self.client.get("/api/v1/auth/login?account_id=acc-1")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["account_id"], "acc-1")
        self.assertEqual(data["action"], "pair_google_account")

    @patch("services.server.api.auth.start_agy_login_flow")
    async def test_auth_start_redirects_to_google(self, mock_start):
        mock_start.return_value = "https://accounts.google.com/o/oauth2/auth?client_id=10710060"
        resp = await self.client.get("/api/v1/auth/start?account_id=acc-1", follow_redirects=False)
        self.assertEqual(resp.status_code, 302)
        location = resp.headers.get("location", "")
        self.assertTrue(location.startswith("https://accounts.google.com/o/oauth2/auth"))

    async def test_auth_status_endpoint(self):
        resp = await self.client.get("/api/v1/auth/status")
        self.assertEqual(resp.status_code, 200)
        self.assertIsInstance(resp.json(), list)

    async def test_auth_token_delete_requires_master_key(self):
        resp = await self.client.delete("/api/v1/auth/token?account_id=acc-1")
        self.assertEqual(resp.status_code, 401)

        headers = {"X-Master-Key": TEST_MASTER_KEY}
        with patch("services.server.api.auth.deprovision_account_container") as mock_deprov:
            resp = await self.client.delete("/api/v1/auth/token?account_id=acc-1", headers=headers)
            self.assertEqual(resp.status_code, 200)
            self.assertTrue(resp.json()["success"])
            mock_deprov.assert_called_once_with("acc-1")

    async def test_auth_token_delete_rejects_invalid_account_id(self):
        headers = {"X-Master-Key": TEST_MASTER_KEY}
        resp = await self.client.delete("/api/v1/auth/token?account_id=../etc", headers=headers)
        self.assertEqual(resp.status_code, 400)

    @patch("services.server.api.auth.provision_account_container")
    @patch("services.server.api.auth.submit_code_to_agy")
    async def test_exchange_code_success(self, mock_submit, mock_prov):
        mock_submit.return_value = {
            "account_id": "acc-1",
            "email": "verified.user@gmail.com",
            "status": "authenticated",
        }
        resp = await self.client.post(
            "/api/v1/auth/exchange-code",
            json={"account_id": "acc-1", "code": "4/0AeanS-mock-code"},
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["email"], "verified.user@gmail.com")
        mock_prov.assert_called_once()

    async def test_ingest_rejects_wrong_agent_key(self):
        payload = {
            "account_id": "acc-1",
            "account_label": "Account 1",
            "tier": "Antigravity Starter",
            "categories": [],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        resp = await self.client.post("/api/v1/usage", json=payload, headers={"X-Agent-Key": "wrong"})
        self.assertEqual(resp.status_code, 401)

    async def test_ingest_accepts_no_categories(self):
        payload = {
            "account_id": "acc-1",
            "account_label": "Account 1",
            "tier": "Antigravity Starter",
            "categories": [],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        headers = {"X-Agent-Key": TEST_AGENT_KEY}
        resp = await self.client.post("/api/v1/usage", json=payload, headers=headers)
        self.assertEqual(resp.status_code, 201)

    async def test_latest_endpoint_no_fake_percentages(self):
        resp = await self.client.get("/api/v1/usage/latest")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIsNone(data.get("gemini_pool_percent"))
        self.assertIsNone(data.get("claude_pool_percent"))

    async def test_history_endpoint_honors_range(self):
        resp1 = await self.client.get("/api/v1/usage/history?range=1h")
        self.assertEqual(resp1.status_code, 200)
        self.assertEqual(resp1.json()["range"], "1h")

        resp2 = await self.client.get("/api/v1/usage/history?range=7d")
        self.assertEqual(resp2.status_code, 200)
        self.assertEqual(resp2.json()["range"], "7d")


if __name__ == "__main__":
    unittest.main()
