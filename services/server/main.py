# GravWatch - FastAPI Application Entrypoint (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware

try:
    from services.server.core.config import settings
    from services.server.core.database import init_db
    from services.server.api.router import api_router
except ImportError:
    try:
        from .core.config import settings
        from .core.database import init_db
        from .api.router import api_router
    except ImportError:
        from core.config import settings
        from core.database import init_db
        from api.router import api_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s")
logger = logging.getLogger("gravwatch.server")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing GravWatch Database...")
    await init_db()
    yield
    logger.info("Shutting down GravWatch Server...")


DASHBOARD_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GravWatch - Antigravity Live Quota Monitor</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: #18191a;
            color: #e4e6eb;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            padding: 40px 20px;
        }
        .container {
            width: 100%;
            max-width: 680px;
        }
        .header-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid #2d2f31;
        }
        .logo-title {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .logo-icon {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .logo-icon svg { width: 18px; height: 18px; fill: white; }
        .logo-title h1 { font-size: 20px; font-weight: 700; color: #fff; letter-spacing: -0.3px; }
        .account-badge {
            background: #242526;
            border: 1px solid #3a3b3c;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .account-badge:hover { border-color: #3b82f6; }
        .status-dot {
            width: 8px;
            height: 8px;
            background: #ef4444;
            border-radius: 50%;
            box-shadow: 0 0 8px #ef4444;
        }
        .status-dot.online {
            background: #22c55e;
            box-shadow: 0 0 8px #22c55e;
        }
        .unauth-banner {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            margin-bottom: 24px;
        }
        .unauth-banner h3 { font-size: 16px; color: #f87171; margin-bottom: 6px; }
        .unauth-banner p { font-size: 13px; color: #9ca3af; margin-bottom: 16px; }
        .btn-connect {
            background: #2563eb;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            text-decoration: none;
            transition: background 0.2s;
        }
        .btn-connect:hover { background: #1d4ed8; }
        .section-header {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 15px;
            font-weight: 600;
            color: #d1d5db;
            margin: 24px 0 12px 4px;
        }
        .info-icon {
            width: 15px;
            height: 15px;
            fill: #6b7280;
        }
        .quota-card {
            background: #242526;
            border: 1px solid #2d2f31;
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 24px;
        }
        .quota-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            border-bottom: 1px solid #2d2f31;
        }
        .quota-row:last-child { border-bottom: none; }
        .quota-text {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .quota-name {
            font-size: 14px;
            font-weight: 500;
            color: #f3f4f6;
        }
        .quota-desc {
            font-size: 12.5px;
            color: #9ca3af;
        }
        .gauge-wrap {
            display: flex;
            align-items: center;
            gap: 14px;
        }
        .gauge-pct {
            font-size: 15px;
            font-weight: 600;
            color: #f3f4f6;
            font-variant-numeric: tabular-nums;
            min-width: 42px;
            text-align: right;
        }
        .gauge-ring {
            position: relative;
            width: 32px;
            height: 32px;
        }
        .gauge-ring svg {
            transform: rotate(-90deg);
            width: 32px;
            height: 32px;
        }
        .gauge-ring circle {
            fill: none;
            stroke-width: 3.5;
            stroke-linecap: round;
        }
        .gauge-bg { stroke: #3a3b3c; }
        .gauge-val {
            stroke: #4ade80;
            transition: stroke-dashoffset 0.6s ease;
        }
        .auth-modal {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.75);
            align-items: center;
            justify-content: center;
            padding: 20px;
            z-index: 100;
        }
        .modal-card {
            background: #1e1f20;
            border: 1px solid #374151;
            border-radius: 16px;
            padding: 32px;
            max-width: 480px;
            width: 100%;
            text-align: left;
        }
        .modal-card h2 { font-size: 18px; margin-bottom: 8px; color: #fff; }
        .modal-card p { color: #9ca3af; font-size: 13px; line-height: 1.5; margin-bottom: 16px; }
        .modal-card label { display: block; font-size: 12px; font-weight: 600; color: #cbd5e1; margin-bottom: 6px; }
        .modal-card input {
            width: 100%;
            padding: 10px 12px;
            background: #111213;
            border: 1px solid #374151;
            border-radius: 8px;
            color: #fff;
            margin-bottom: 14px;
            outline: none;
        }
        .modal-card input:focus { border-color: #3b82f6; }
        .footer-info {
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            margin-top: 24px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header-bar">
            <div class="logo-title">
                <div class="logo-icon">
                    <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
                <h1>GravWatch</h1>
            </div>
            <div class="account-badge" onclick="openAuthModal()">
                <div class="status-dot" id="statusDot"></div>
                <span id="accountEmail">Checking connection...</span>
            </div>
        </div>

        <div class="unauth-banner" id="unauthBanner" style="display: none;">
            <h3>Google Account Not Connected</h3>
            <p>Connect your official Google Cloud OAuth credentials to stream live Google Antigravity quotas directly to node <strong>acc-1</strong>.</p>
            <a href="/api/v1/auth/login?account_id=acc-1" class="btn-connect">
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                Connect with Google OAuth &rarr;
            </a>
        </div>

        <div class="section-header">
            <span>Gemini Models</span>
            <svg class="info-icon" viewBox="0 0 20 20"><path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/></svg>
        </div>
        <div class="quota-card">
            <div class="quota-row">
                <div class="quota-text">
                    <div class="quota-name">Weekly Limit Remaining</div>
                    <div class="quota-desc" id="geminiWeeklyDesc">Awaiting Google OAuth authentication...</div>
                </div>
                <div class="gauge-wrap">
                    <div class="gauge-pct" id="geminiWeeklyPct">--%</div>
                    <div class="gauge-ring">
                        <svg viewBox="0 0 36 36">
                            <circle class="gauge-bg" cx="18" cy="18" r="14"/>
                            <circle class="gauge-val" id="geminiWeeklyCircle" cx="18" cy="18" r="14" stroke-dasharray="88" stroke-dashoffset="88"/>
                        </svg>
                    </div>
                </div>
            </div>
            <div class="quota-row">
                <div class="quota-text">
                    <div class="quota-name">Five Hour Limit Remaining</div>
                    <div class="quota-desc" id="gemini5hDesc">Awaiting Google OAuth authentication...</div>
                </div>
                <div class="gauge-wrap">
                    <div class="gauge-pct" id="gemini5hPct">--%</div>
                    <div class="gauge-ring">
                        <svg viewBox="0 0 36 36">
                            <circle class="gauge-bg" cx="18" cy="18" r="14"/>
                            <circle class="gauge-val" id="gemini5hCircle" cx="18" cy="18" r="14" stroke-dasharray="88" stroke-dashoffset="88"/>
                        </svg>
                    </div>
                </div>
            </div>
        </div>

        <div class="section-header">
            <span>Claude and GPT models</span>
            <svg class="info-icon" viewBox="0 0 20 20"><path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/></svg>
        </div>
        <div class="quota-card">
            <div class="quota-row">
                <div class="quota-text">
                    <div class="quota-name">Weekly Limit Remaining</div>
                    <div class="quota-desc" id="claudeWeeklyDesc">Awaiting Google OAuth authentication...</div>
                </div>
                <div class="gauge-wrap">
                    <div class="gauge-pct" id="claudeWeeklyPct">--%</div>
                    <div class="gauge-ring">
                        <svg viewBox="0 0 36 36">
                            <circle class="gauge-bg" cx="18" cy="18" r="14"/>
                            <circle class="gauge-val" id="claudeWeeklyCircle" cx="18" cy="18" r="14" stroke-dasharray="88" stroke-dashoffset="88"/>
                        </svg>
                    </div>
                </div>
            </div>
            <div class="quota-row">
                <div class="quota-text">
                    <div class="quota-name">Five Hour Limit Remaining</div>
                    <div class="quota-desc" id="claude5hDesc">Awaiting Google OAuth authentication...</div>
                </div>
                <div class="gauge-wrap">
                    <div class="gauge-pct" id="claude5hPct">--%</div>
                    <div class="gauge-ring">
                        <svg viewBox="0 0 36 36">
                            <circle class="gauge-bg" cx="18" cy="18" r="14"/>
                            <circle class="gauge-val" id="claude5hCircle" cx="18" cy="18" r="14" stroke-dasharray="88" stroke-dashoffset="88"/>
                        </svg>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer-info">
            Automated Telemetry Polling &bull; <a href="/docs" style="color: #3b82f6; text-decoration: none;">API Docs (Swagger)</a>
        </div>
    </div>

    <div class="auth-modal" id="authModal" onclick="closeAuthModal(event)">
        <div class="modal-card" onclick="event.stopPropagation()">
            <h2>Google Cloud OAuth Credentials</h2>
            <p>Enter your Google OAuth Client ID & Secret to pair your account with node <strong>acc-1</strong>.</p>
            
            <form action="/api/v1/auth/configure" method="POST">
                <input type="hidden" name="account_id" value="acc-1">
                <label for="client_id">Google Client ID</label>
                <input type="text" id="client_id" name="client_id" placeholder="your-client-id.apps.googleusercontent.com" required>
                
                <label for="client_secret">Google Client Secret</label>
                <input type="password" id="client_secret" name="client_secret" placeholder="GOCSPX-..." required>
                
                <button type="submit" class="btn-connect" style="width: 100%; justify-content: center; padding: 12px;">Save & Authorize with Google &rarr;</button>
            </form>
        </div>
    </div>

    <script>
        const CIRCUMFERENCE = 88;

        function setRing(circleId, pct) {
            const circle = document.getElementById(circleId);
            if (!circle) return;
            if (pct === null || isNaN(pct)) {
                circle.style.strokeDashoffset = CIRCUMFERENCE;
                return;
            }
            const val = Math.max(0, Math.min(100, pct));
            const offset = CIRCUMFERENCE - (val / 100) * CIRCUMFERENCE;
            circle.style.strokeDashoffset = offset;
            if (val < 30) circle.style.stroke = "#ef4444";
            else if (val < 60) circle.style.stroke = "#f59e0b";
            else circle.style.stroke = "#4ade80";
        }

        async function fetchQuota() {
            try {
                const res = await fetch('/api/v1/usage/latest');
                if (!res.ok) return;
                const data = await res.json();

                const accounts = data.accounts || [];
                const primary = accounts.find(a => a.id === 'acc-1') || accounts[0];

                const statusDot = document.getElementById('statusDot');
                const unauthBanner = document.getElementById('unauthBanner');

                if (!primary || primary.status === 'unauthenticated' || !primary.categories || primary.categories.length === 0) {
                    statusDot.className = 'status-dot';
                    document.getElementById('accountEmail').innerText = 'Unauthenticated (Click to Pair)';
                    unauthBanner.style.display = 'block';

                    document.getElementById('geminiWeeklyPct').innerText = '--%';
                    setRing('geminiWeeklyCircle', null);
                    document.getElementById('geminiWeeklyDesc').innerText = 'Unauthenticated. Sign in with Google to view live limits.';

                    document.getElementById('gemini5hPct').innerText = '--%';
                    setRing('gemini5hCircle', null);
                    document.getElementById('gemini5hDesc').innerText = 'Unauthenticated. Sign in with Google to view live limits.';

                    document.getElementById('claudeWeeklyPct').innerText = '--%';
                    setRing('claudeWeeklyCircle', null);
                    document.getElementById('claudeWeeklyDesc').innerText = 'Unauthenticated. Sign in with Google to view live limits.';

                    document.getElementById('claude5hPct').innerText = '--%';
                    setRing('claude5hCircle', null);
                    document.getElementById('claude5hDesc').innerText = 'Unauthenticated. Sign in with Google to view live limits.';
                    return;
                }

                // Authenticated
                statusDot.className = 'status-dot online';
                document.getElementById('accountEmail').innerText = primary.email || 'Connected';
                unauthBanner.style.display = 'none';

                const catSummaries = data.pool_summary.category_summaries || [];
                const geminiCat = catSummaries.find(c => c.category_id === 'gemini-models');
                const claudeCat = catSummaries.find(c => c.category_id === 'claude-gpt-models');

                if (geminiCat) {
                    document.getElementById('geminiWeeklyPct').innerText = Math.round(geminiCat.weekly_limit_remaining) + '%';
                    setRing('geminiWeeklyCircle', geminiCat.weekly_limit_remaining);
                    if (geminiCat.weekly_refresh_human) {
                        document.getElementById('geminiWeeklyDesc').innerText = 'You have used some of your weekly limit, it will ' + geminiCat.weekly_refresh_human + '.';
                    }

                    document.getElementById('gemini5hPct').innerText = Math.round(geminiCat.five_hour_limit_remaining) + '%';
                    setRing('gemini5hCircle', geminiCat.five_hour_limit_remaining);
                    if (geminiCat.five_hour_refresh_human) {
                        document.getElementById('gemini5hDesc').innerText = 'You have used some of your 5-hour limit, it will ' + geminiCat.five_hour_refresh_human + '.';
                    }
                }

                if (claudeCat) {
                    document.getElementById('claudeWeeklyPct').innerText = Math.round(claudeCat.weekly_limit_remaining) + '%';
                    setRing('claudeWeeklyCircle', claudeCat.weekly_limit_remaining);
                    document.getElementById('claudeWeeklyDesc').innerText = 'Full capacity remaining, refreshes weekly.';

                    document.getElementById('claude5hPct').innerText = Math.round(claudeCat.five_hour_limit_remaining) + '%';
                    setRing('claude5hCircle', claudeCat.five_hour_limit_remaining);
                    document.getElementById('claude5hDesc').innerText = 'Full capacity remaining, refreshes every 5 hours.';
                }
            } catch (e) {
                console.error("Failed fetching quota:", e);
            }
        }

        function openAuthModal() {
            document.getElementById('authModal').style.display = 'flex';
        }

        function closeAuthModal(e) {
            document.getElementById('authModal').style.display = 'none';
        }

        fetchQuota();
        setInterval(fetchQuota, 3000);
    </script>
</body>
</html>
"""


def create_app() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="Multi-account Google Antigravity CLI quota monitoring & telemetry engine",
        lifespan=lifespan
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.get("/", response_class=HTMLResponse)
    async def root_dashboard():
        return HTMLResponse(content=DASHBOARD_HTML, status_code=200)

    application.include_router(api_router)
    return application


app = create_app()
