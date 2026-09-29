# ─────────────────────────────────────────────
# GravWatch - Server End-to-End Test Suite (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch
# ─────────────────────────────────────────────
import json
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

test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
TestSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False)

async def override_get_db():
    async with TestSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

import tempfile

class TestServerE2E(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        from services.server.api.auth import _auth_url_cache
        _auth_url_cache.clear()
        self.test_dir = tempfile.TemporaryDirectory()
        settings.DATA_DIR = self.test_dir.name
        settings.PUBLIC_ORIGIN = "http://localhost:8000"
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
        self.transport = ASGITransport(app=app)
        self.client = AsyncClient(transport=self.transport, base_url="http://test")

    async def asyncTearDown(self):
        await self.client.aclose()
        self.test_dir.cleanup()

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

    @patch("services.server.api.auth.start_agy_login_flow")
    async def test_auth_start_pty_returns_url(self, mock_start):
        mock_start.return_value = "https://accounts.google.com/o/oauth2/auth?client_id=10710060&response_type=code&scope=openid"
        resp = await self.client.post("/api/v1/auth/start-pty?account_id=acc-1")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["auth_url"], mock_start.return_value)
        self.assertTrue(data["auth_url"].startswith("https://accounts.google.com"))

    async def test_auth_login_endpoint_returns_json(self):
        resp = await self.client.get("/api/v1/auth/login?account_id=acc-1")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["account_id"], "acc-1")
        self.assertEqual(data["action"], "pair_google_account")

    @patch("services.server.api.auth.get_agy_output")
    async def test_agy_output_endpoint_returns_live_tui(self, mock_output):
        mock_output.return_value = "Welcome to Antigravity CLI\nSign in with Google"
        resp = await self.client.get("/api/v1/auth/agy-output?account_id=acc-1")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["success"])
        self.assertFalse(data["empty"])
        self.assertIn("Sign in with Google", data["output"])

    @patch("services.server.api.auth.get_agy_output")
    async def test_agy_output_endpoint_handles_empty(self, mock_output):
        mock_output.return_value = ""
        resp = await self.client.get("/api/v1/auth/agy-output?account_id=acc-1")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["success"])
        self.assertTrue(data["empty"])
        self.assertEqual(data["output"], "")

    @patch("services.server.api.auth.start_agy_login_flow")
    async def test_auth_start_returns_agy_url(self, mock_start):
        mock_start.return_value = "https://accounts.google.com/o/oauth2/auth?client_id=10710060&response_type=code"
        resp = await self.client.post("/api/v1/auth/start-pty?account_id=acc-1")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["auth_url"], mock_start.return_value)
        mock_start.assert_called_once_with("acc-1")

    @patch("services.server.api.auth.load_account_credentials")
    @patch("services.server.api.auth.start_agy_login_flow")
    async def test_auth_start_already_authenticated(self, mock_start, mock_creds):
        mock_start.return_value = "ALREADY_AUTHENTICATED"
        mock_creds.return_value = {"email": "verified.user@gmail.com"}
        resp = await self.client.post("/api/v1/auth/start-pty?account_id=acc-1")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["already_authenticated"])
        self.assertIsNone(data["auth_url"])
        self.assertEqual(data["email"], "verified.user@gmail.com")

    async def test_auth_start_rejects_path_traversal(self):
        resp = await self.client.post("/api/v1/auth/start-pty?account_id=../etc")
        self.assertEqual(resp.status_code, 400)

    async def test_auth_status_endpoint(self):
        resp = await self.client.get("/api/v1/auth/status")
        self.assertEqual(resp.status_code, 200)
        self.assertIsInstance(resp.json(), list)

    async def test_auth_token_delete_without_key(self):
        """Token revocation is open — single-user dashboard, no API keys."""
        with patch("services.server.api.auth.deprovision_account_container") as mock_deprov:
            resp = await self.client.delete("/api/v1/auth/token?account_id=acc-1&deprovision=true")
            self.assertEqual(resp.status_code, 200)
            self.assertTrue(resp.json()["success"])
            mock_deprov.assert_called_once_with("acc-1")

    async def test_auth_token_delete_rejects_invalid_account_id(self):
        resp = await self.client.delete("/api/v1/auth/token?account_id=../etc")
        self.assertEqual(resp.status_code, 400)

    @patch("services.server.api.auth.get_user_info")
    @patch("services.server.api.auth.provision_account_container")
    @patch("services.server.api.auth.submit_code_to_agy")
    async def test_submit_code_pty_success(self, mock_submit, mock_prov, mock_userinfo):
        mock_prov.return_value = True
        mock_submit.return_value = {
            "account_id": "acc-1",
            "access_token": "ya29.test-access-token",
            "refresh_token": "1//test-refresh-token",
            "status": "authenticated",
            "output": "Welcome back!",
        }
        mock_userinfo.return_value = {
            "email": "verified.user@gmail.com",
            "name": "Verified User",
            "picture": "https://lh3.googleusercontent.com/avatar.png",
        }
        resp = await self.client.post(
            "/api/v1/auth/submit-code-pty",
            json={"account_id": "acc-1", "code": "4/0AXlqoi7-mock-code"},
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["email"], "verified.user@gmail.com")
        self.assertEqual(data["name"], "Verified User")
        mock_prov.assert_called_once()

        creds_path = os.path.join(settings.DATA_DIR, "acc-1", "credentials.json")
        self.assertTrue(os.path.exists(creds_path))
        with open(creds_path, "r", encoding="utf-8") as f:
            creds = json.load(f)
        self.assertEqual(creds["access_token"], "ya29.test-access-token")
        self.assertEqual(creds["refresh_token"], "1//test-refresh-token")
        self.assertEqual(creds["email"], "verified.user@gmail.com")

    @patch("services.server.api.auth.submit_code_to_agy")
    async def test_submit_code_pty_rejects_bad_code(self, mock_submit):
        mock_submit.side_effect = RuntimeError(
            "agy rejected the code. TUI output:\nError: invalid_grant"
        )
        resp = await self.client.post(
            "/api/v1/auth/submit-code-pty",
            json={"account_id": "acc-1", "code": "4/0BadCode"},
        )
        self.assertEqual(resp.status_code, 400)
        data = resp.json()
        self.assertFalse(data["success"])
        self.assertIn("invalid_grant", data["error"])

    async def test_submit_code_pty_requires_code(self):
        resp = await self.client.post(
            "/api/v1/auth/submit-code-pty",
            json={"account_id": "acc-1", "code": ""},
        )
        self.assertEqual(resp.status_code, 400)

    async def test_ingest_accepts_without_key(self):
        """Telemetry ingestion is open — single-user dashboard, no API keys."""
        payload = {
            "account_id": "acc-1",
            "account_label": "Account 1",
            "tier": "Antigravity Starter",
            "categories": [],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        resp = await self.client.post("/api/v1/usage", json=payload)
        self.assertEqual(resp.status_code, 201)

    async def test_ingest_accepts_no_categories(self):
        payload = {
            "account_id": "acc-1",
            "account_label": "Account 1",
            "tier": "Antigravity Starter",
            "categories": [],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        resp = await self.client.post("/api/v1/usage", json=payload)
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

