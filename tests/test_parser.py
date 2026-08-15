# GravWatch - Telemetry Parser Test Suite (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "services", "agent")))

from parser import parse_agy_output, generate_mock_models, clean_ansi


class TestAgentParser(unittest.TestCase):

    def test_clean_ansi(self):
        colored = "\x1b[31mError\x1b[0m: Connection refused"
        self.assertEqual(clean_ansi(colored), "Error: Connection refused")

    def test_generate_mock_models(self):
        models = generate_mock_models("acc-1")
        self.assertEqual(len(models), 5)
        model_names = [m["model_name"] for m in models]
        self.assertIn("Gemini Flash", model_names)
        self.assertIn("Gemini Pro", model_names)
        self.assertIn("Claude Sonnet", model_names)
        self.assertIn("Claude Opus", model_names)
        self.assertIn("GPT OSS", model_names)

    def test_parse_structured_cli_output(self):
        raw = """
        ╭─────────────────────────── Model Quotas & Usage ───────────────────────────╮
        │ Account: dev-team-01@gmail.com                                            │
        │ Tier: Pro Developer                                                       │
        ├───────────────────────┬──────────────┬──────────────┬─────────────────────┤
        │ Model Name            │ Requests/Min │ Daily Quota  │ Resets In           │
        ├───────────────────────┼──────────────┼──────────────┼─────────────────────┤
        │ Gemini Flash          │ 120 / 1000   │ 12% used     │ 03h 42m (06:00 UTC) │
        │ Gemini Pro            │ 15 / 100     │ 15% used     │ 03h 42m (06:00 UTC) │
        │ Claude Sonnet         │ 40 / 200     │ 20% used     │ 08h 15m (12:00 UTC) │
        │ Claude Opus           │ 10 / 50      │ 20% used     │ 08h 15m (12:00 UTC) │
        │ GPT OSS               │ 80 / 500     │ 16% used     │ 01h 10m (04:00 UTC) │
        ╰───────────────────────┴──────────────┴──────────────┴─────────────────────╯
        """
        result = parse_agy_output(raw, account_id="acc-1", account_label="Account 1")
        self.assertEqual(result["account_id"], "acc-1")
        self.assertEqual(result["email"], "dev-team-01@gmail.com")
        self.assertEqual(result["status"], "healthy")
        self.assertEqual(len(result["models"]), 5)
        
        flash = next(m for m in result["models"] if m["model_id"] == "gemini-flash")
        self.assertEqual(flash["model_name"], "Gemini Flash")
        self.assertEqual(flash["used"], 120)
        self.assertEqual(flash["limit"], 1000)
        self.assertEqual(flash["percentage"], 12.0)


if __name__ == "__main__":
    unittest.main()
