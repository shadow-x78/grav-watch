#!/usr/bin/env bash
# GravWatch - Container Agent Entrypoint (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

set -euo pipefail

mkdir -p /root/.gemini /root/.config/antigravity /root/.config/Code/User/globalStorage /root/.config/"Antigravity IDE"/User/globalStorage
chmod 777 /root/.gemini /root/.config 2>/dev/null || true

python3 -c '
import sqlite3, json, os, shutil

seed = "/root/.config/antigravity_seed/state.vscdb"
targets = [
    "/root/.config/antigravity/state.vscdb",
    "/root/.config/Antigravity IDE/User/globalStorage/state.vscdb",
    "/root/.config/Code/User/globalStorage/state.vscdb"
]

for t in targets:
    os.makedirs(os.path.dirname(t), exist_ok=True)
    if os.path.exists(seed) and not os.path.exists(t):
        try:
            shutil.copy2(seed, t)
        except Exception:
            pass
    try:
        con = sqlite3.connect(t)
        cur = con.cursor()
        cur.execute("CREATE TABLE IF NOT EXISTS ItemTable (key TEXT PRIMARY KEY, value TEXT)")
        existing_val = cur.execute("SELECT value FROM ItemTable WHERE key = \"content.trust.model.key\"").fetchone()
        trust_payload = {"uriTrustInfo": []}
        if existing_val and existing_val[0]:
            try:
                trust_payload = json.loads(existing_val[0])
            except Exception:
                pass
        uris = [u.get("uri", {}).get("path") for u in trust_payload.get("uriTrustInfo", []) if isinstance(u, dict)]
        for path in ["/app", "/root", "/", "/tmp"]:
            if path not in uris:
                trust_payload.setdefault("uriTrustInfo", []).append({
                    "uri": {"$mid": 1, "external": f"file://{path}", "path": path, "scheme": "file"},
                    "trusted": True
                })
        cur.execute("INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)", ("content.trust.model.key", json.dumps(trust_payload)))
        con.commit()
        con.close()
    except Exception:
        pass

for cli_dir in ["/root/.gemini/antigravity-cli", "/root/.gemini/.gemini/antigravity-cli"]:
    os.makedirs(cli_dir, exist_ok=True)
    settings_file = os.path.join(cli_dir, "settings.json")
    tmp_settings = settings_file + ".tmp"
    with open(tmp_settings, "w") as f:
        json.dump({"trustedWorkspaces": ["/app", "/root", "/", "/tmp"]}, f, indent=2)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp_settings, settings_file)

    cache_dir = os.path.join(cli_dir, "cache")
    os.makedirs(cache_dir, exist_ok=True)
    onboarding_file = os.path.join(cache_dir, "onboarding.json")
    tmp_onboarding = onboarding_file + ".tmp"
    with open(tmp_onboarding, "w") as f:
        json.dump({"consumerOnboardingComplete": True, "enterpriseOnboardingComplete": True, "onboardingComplete": True}, f, indent=2)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp_onboarding, onboarding_file)
' 2>/dev/null || true

if [ "$#" -gt 0 ]; then
    exec "$@"
fi

exec python3 -m services.agent.agent
