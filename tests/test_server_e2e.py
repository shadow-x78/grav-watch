# GravWatch - Server End-to-End Test Suite (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
import sys
import unittest
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from httpx import AsyncClient, ASGITransport
from services.server.main import app
from services.server.core.database import init_db
from services.agent.mock.generator import generate_mock_telemetry


class TestServerE2E(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self):
        await init_db()
        self.transport = ASGITransport(app=app)
        self.client = AsyncClient(transport=self.transport, base_url="http://test")

    async def asyncTearDown(self):
        await self.client.aclose()

    async def test_health_endpoint(self):
        resp = await self.client.get("/api/v1/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "healthy")

    async def test_auth_endpoints(self):
        # 1. Test Google Token Login Page (HTTP 200)
        login_res = await self.client.get("/api/v1/auth/login?account_id=acc-1", follow_redirects=False)
        self.assertEqual(login_res.status_code, 200)
        self.assertIn("Connect Google Account", login_res.text)

        # 2. Test URL Endpoint
        url_res = await self.client.get("/api/v1/auth/url?account_id=acc-1")
        self.assertEqual(url_res.status_code, 200)

        # 3. Test Status Endpoint
        status_res = await self.client.get("/api/v1/auth/status")
        self.assertEqual(status_res.status_code, 200)
        self.assertIsInstance(status_res.json(), list)

    async def test_ingest_and_fetch_latest(self):
        headers = {"X-Agent-Key": "gravwatch-agent-secret-key"}
        
        telemetry1 = generate_mock_telemetry("acc-1")
        payload1 = {
            "account_id": "acc-1",
            "account_label": "Account 1 (Primary)",
            "email": "shadow.x7e48@gmail.com",
            "tier": "Antigravity Starter (Free Tier)",
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "categories": telemetry1["categories"],
            "models": telemetry1["models"]
        }
        res1 = await self.client.post("/api/v1/usage", json=payload1, headers=headers)
        self.assertEqual(res1.status_code, 201)
        self.assertTrue(res1.json()["success"])

        latest_res = await self.client.get("/api/v1/usage/latest")
        self.assertEqual(latest_res.status_code, 200)
        latest_data = latest_res.json()
        
        pool = latest_data["pool_summary"]
        self.assertGreaterEqual(pool["total_accounts"], 1)
        self.assertGreater(len(pool["category_summaries"]), 0)
        
        acc_ids = [a["id"] for a in latest_data["accounts"]]
        self.assertIn("acc-1", acc_ids)

    async def test_history_endpoint(self):
        history_res = await self.client.get("/api/v1/usage/history?range=24h")
        self.assertEqual(history_res.status_code, 200)
        data = history_res.json()
        self.assertEqual(data["range"], "24h")
        self.assertIsInstance(data["series"], list)


if __name__ == "__main__":
    unittest.main()
