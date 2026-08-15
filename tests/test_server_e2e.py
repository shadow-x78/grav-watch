# GravWatch - Server End-to-End Test Suite (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
import sys
import unittest
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "services", "server")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "services", "agent")))

from httpx import AsyncClient, ASGITransport
from main import app
from models import init_db
from parser import generate_mock_models


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

    async def test_ingest_and_fetch_latest(self):
        headers = {"X-Agent-Key": "gravwatch-agent-secret-key"}
        
        payload1 = {
            "account_id": "acc-1",
            "account_label": "Account 1 (Primary)",
            "email": "dev1@corp.ai",
            "tier": "Pro",
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "models": generate_mock_models("acc-1")
        }
        res1 = await self.client.post("/api/v1/usage", json=payload1, headers=headers)
        self.assertEqual(res1.status_code, 201)
        self.assertTrue(res1.json()["success"])

        payload2 = {
            "account_id": "acc-2",
            "account_label": "Account 2 (Worker)",
            "email": "dev2@corp.ai",
            "tier": "Standard",
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "models": generate_mock_models("acc-2")
        }
        res2 = await self.client.post("/api/v1/usage", json=payload2, headers=headers)
        self.assertEqual(res2.status_code, 201)

        latest_res = await self.client.get("/api/v1/usage/latest")
        self.assertEqual(latest_res.status_code, 200)
        latest_data = latest_res.json()
        
        pool = latest_data["pool_summary"]
        self.assertGreaterEqual(pool["total_accounts"], 2)
        self.assertGreater(pool["total_requests_limit"], 0)
        
        acc_ids = [a["id"] for a in latest_data["accounts"]]
        self.assertIn("acc-1", acc_ids)
        self.assertIn("acc-2", acc_ids)

    async def test_history_endpoint(self):
        history_res = await self.client.get("/api/v1/usage/history?range=24h")
        self.assertEqual(history_res.status_code, 200)
        data = history_res.json()
        self.assertEqual(data["range"], "24h")
        self.assertIsInstance(data["series"], list)


if __name__ == "__main__":
    unittest.main()
