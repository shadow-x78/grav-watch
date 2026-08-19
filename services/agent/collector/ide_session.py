# GravWatch - IDE Session Database Collector (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
import re
import sqlite3
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger("gravwatch.collector.ide_session")

DEFAULT_STATE_DB_PATHS = [
    "/root/.config/antigravity/state.vscdb",
    os.path.expanduser("~/.config/Antigravity IDE/User/globalStorage/state.vscdb"),
    os.path.expanduser("~/.config/Code/User/globalStorage/state.vscdb"),
]

def find_state_db(custom_path: Optional[str] = None) -> Optional[str]:
    if custom_path and os.path.isfile(custom_path):
        return custom_path
    for path in DEFAULT_STATE_DB_PATHS:
        if os.path.isfile(path):
            return path
    return None

def read_item_table_from_sqlite(db_path: str) -> Dict[str, str]:
    if not os.path.isfile(db_path):
        return {}
    results = {}
    try:
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM ItemTable")
        for key, value in cursor.fetchall():
            if isinstance(value, bytes):
                try:
                    value = value.decode("utf-8")
                except UnicodeDecodeError:
                    value = value.decode("latin1", errors="ignore")
            results[key] = value
        conn.close()
    except Exception as e:
        logger.warning("Failed to read SQLite DB %s: %s", db_path, e)
    return results

def extract_oauth_token(blob: str) -> Optional[str]:
    if not blob:
        return None
    patterns = [
        r'ya29\.[a-zA-Z0-9_\-\.]+',
        r'Bearer\s+(ya29\.[a-zA-Z0-9_\-\.]+)',
    ]
    for p in patterns:
        m = re.search(p, blob)
        if m:
            token = m.group(1) if "(" in p else m.group(0)
            return token
    return None

def extract_email_from_blob(blob: str) -> Optional[str]:
    if not blob:
        return None
    p = r'([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)'
    m = re.search(p, blob)
    if m:
        return m.group(1)
    return None
