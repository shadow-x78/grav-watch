# GravWatch - Real Prompt Execution API via Official Google Antigravity CLI (GPL-3.0-or-later)
# https://github.com/shadow-x78/grav-watch

import os
import time
import logging
import subprocess
from pydantic import BaseModel, Field
from typing import Optional
from fastapi import APIRouter, HTTPException, status

try:
    from services.server.core.config import settings
    from services.server.core.security import validate_account_id
except ImportError:
    from ..core.config import settings
    from ..core.security import validate_account_id

logger = logging.getLogger("gravwatch.api.prompt")
router = APIRouter(prefix="/prompt", tags=["Prompt Execution"])

class PromptExecuteRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=10000)
    account_id: Optional[str] = Field("acc-1")
    model: Optional[str] = Field(None)

class PromptExecuteResponse(BaseModel):
    success: bool
    response: str
    account_id: str
    tokens_used: int
    latency_ms: float
    model: str

@router.post("/execute", response_model=PromptExecuteResponse)
async def execute_prompt(req: PromptExecuteRequest):
    account_id = validate_account_id(req.account_id or "acc-1")
    acc_home = os.path.abspath(os.path.join(settings.DATA_DIR, account_id))

    if not os.path.exists(acc_home):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account node [{account_id}] is not provisioned or authenticated.",
        )

    if os.path.exists("/usr/local/bin/agy"):
        cmd = ["/usr/local/bin/agy", "-p", req.prompt]
        if req.model:
            cmd.extend(["--model", req.model])
        env = {**os.environ, "HOME": acc_home, "TERM": "xterm-256color"}
    else:
        cmd = ["docker", "exec", "-i", f"gravwatch-{account_id}", "agy", "-p", req.prompt]
        if req.model:
            cmd.extend(["--model", req.model])
        env = {**os.environ, "TERM": "xterm-256color"}

    start_time = time.time()
    try:
        proc = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
            timeout=60,
            text=True,
        )
        elapsed = time.time() - start_time
    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Prompt execution timed out after 60 seconds.",
        )
    except Exception as e:
        logger.error("Failed to execute agy prompt on %s: %s", account_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Execution failed: {e}",
        )

    if proc.returncode != 0:
        error_msg = proc.stderr.strip() or proc.stdout.strip() or "Unknown CLI error"
        logger.warning("agy prompt failed with code %d: %s", proc.returncode, error_msg)
        return PromptExecuteResponse(
            success=False,
            response=f"Error ({proc.returncode}): {error_msg}",
            account_id=account_id,
            tokens_used=0,
            latency_ms=round(elapsed * 1000, 2),
            model=req.model or "Gemini 3.7 Flash",
        )

    raw_output = proc.stdout.strip()
    words = len(raw_output.split())
    estimated_tokens = max(1, int(words * 1.3))

    return PromptExecuteResponse(
        success=True,
        response=raw_output,
        account_id=account_id,
        tokens_used=estimated_tokens,
        latency_ms=round(elapsed * 1000, 2),
        model=req.model or "Gemini 3.7 Flash",
    )
