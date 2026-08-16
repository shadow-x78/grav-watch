# GravWatch - Telemetry Parser Test Suite (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.agent.collector.parser import parse_agy_output, clean_ansi
from services.agent.mock.generator import generate_mock_telemetry


class TestAgentParser(unittest.TestCase):

    def test_clean_ansi(self):
        colored = "\x1b[31mError\x1b[0m: Connection refused"
        self.assertEqual(clean_ansi(colored), "Error: Connection refused")

    def test_generate_mock_telemetry(self):
        data = generate_mock_telemetry("acc-1")
        self.assertIn("categories", data)
        self.assertIn("models", data)
        
        cat_ids = [c["category_id"] for c in data["categories"]]
        self.assertIn("gemini-models", cat_ids)
        self.assertIn("claude-gpt-models", cat_ids)

        model_names = [m["model_name"] for m in data["models"]]
        self.assertIn("Gemini Flash", model_names)
        self.assertIn("Gemini Pro", model_names)
        self.assertIn("Claude Sonnet", model_names)
        self.assertIn("Claude Opus", model_names)
        self.assertIn("GPT OSS", model_names)

    def test_parse_structured_cli_output(self):
        raw = """
        Gemini Models:
        Weekly Limit Remaining: 54% (fully refreshes in 5 days)
        Five Hour Limit Remaining: 79% (fully refreshes in 4 hours, 18 minutes)

        Claude and GPT models:
        Weekly Limit Remaining: 100% (fully refreshes in 6 days)
        Five Hour Limit Remaining: 100% (fully refreshes in 5 hours)
        """
        result = parse_agy_output(raw, account_id="acc-1", account_label="Account 1")
        self.assertEqual(result["account_id"], "acc-1")
        self.assertEqual(result["status"], "healthy")
        self.assertEqual(len(result["categories"]), 2)
        
        gemini_cat = next(c for c in result["categories"] if c["category_id"] == "gemini-models")
        self.assertEqual(gemini_cat["weekly_limit"]["percentage_remaining"], 54.0)
        self.assertEqual(gemini_cat["five_hour_limit"]["percentage_remaining"], 79.0)


if __name__ == "__main__":
    unittest.main()
