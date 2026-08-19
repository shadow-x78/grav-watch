# GravWatch - Engine & Security Test Suite (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
import sys
import json
import stat
import tempfile
import unittest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.server.core.security import validate_account_id, ACCOUNT_ID_PATTERN
from services.server.core.google_oauth import (
    safe_write_credentials,
    load_account_credentials,
    delete_account_credentials,
)
from services.agent.collector.ide_session import (
    extract_email_from_blob,
    extract_oauth_token,
)
from services.server.core.container_manager import (
    provision_account_container,
    deprovision_account_container,
)


class TestSecurityHelpers(unittest.TestCase):
    def test_account_id_pattern_accepts_safe(self):
        self.assertTrue(ACCOUNT_ID_PATTERN.match("acc-1"))
        self.assertTrue(ACCOUNT_ID_PATTERN.match("acc_2"))
        self.assertTrue(ACCOUNT_ID_PATTERN.match("account123"))

    def test_account_id_pattern_rejects_path_traversal(self):
        self.assertIsNone(ACCOUNT_ID_PATTERN.match("../etc"))
        self.assertIsNone(ACCOUNT_ID_PATTERN.match("../../etc/passwd"))
        self.assertIsNone(ACCOUNT_ID_PATTERN.match("acc/1"))
        self.assertIsNone(ACCOUNT_ID_PATTERN.match("acc<script>"))

    def test_validate_account_id_endpoint(self):
        self.assertEqual(validate_account_id("acc-1"), "acc-1")
        with self.assertRaises(Exception):
            validate_account_id("../bogus")


class TestSafeWriteCredentials(unittest.TestCase):
    def test_permissions_and_payload(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            with patch("services.server.core.config.settings.DATA_DIR", tmpdir):
                payload = {
                    "account_id": "acc-test",
                    "email": "user@example.com",
                    "status": "authenticated",
                    "access_token": "ya29.test",
                }
                safe_write_credentials("acc-test", payload)

                creds_path = os.path.join(tmpdir, "acc-test", "credentials.json")
                self.assertTrue(os.path.exists(creds_path))

                mode = stat.S_IMODE(os.stat(creds_path).st_mode)
                self.assertEqual(mode, 0o600)

                loaded = load_account_credentials("acc-test")
                self.assertEqual(loaded["email"], "user@example.com")
                self.assertEqual(loaded["status"], "authenticated")

                deleted = delete_account_credentials("acc-test")
                self.assertTrue(deleted)
                self.assertFalse(os.path.exists(creds_path))


class TestIdeSessionParsing(unittest.TestCase):
    def test_extract_email_from_blob(self):
        blob = "user.test48@gmail.com is authenticated"
        email = extract_email_from_blob(blob)
        self.assertEqual(email, "user.test48@gmail.com")

    def test_extract_email_returns_none_for_none(self):
        self.assertIsNone(extract_email_from_blob("no-email-here"))
        self.assertIsNone(extract_email_from_blob(""))

    def test_extract_oauth_token(self):
        blob = "Bearer ya29.a0AfH6SMAexample_token_123456789 user session"
        token = extract_oauth_token(blob)
        self.assertIsNotNone(token)
        self.assertTrue(token.startswith("ya29."))

    def test_extract_oauth_token_missing(self):
        self.assertIsNone(extract_oauth_token("no token"))
        self.assertIsNone(extract_oauth_token(""))


class TestContainerManager(unittest.TestCase):
    @patch("subprocess.run")
    def test_provision_account_container(self, mock_run):
        mock_proc = MagicMock()
        mock_proc.returncode = 0
        mock_run.return_value = mock_proc
        res = provision_account_container("acc-test", "Test Account")
        self.assertTrue(res)

    @patch("subprocess.run")
    def test_deprovision_account_container(self, mock_run):
        mock_proc = MagicMock()
        mock_proc.returncode = 0
        mock_run.return_value = mock_proc
        res = deprovision_account_container("acc-test")
        self.assertTrue(res)


if __name__ == "__main__":
    unittest.main()
