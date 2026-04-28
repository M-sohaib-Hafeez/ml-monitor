import os
import httpx
from typing import Optional

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

def get_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

async def insert_drift_log(data: dict) -> Optional[dict]:
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.post(
                f"{SUPABASE_URL}/rest/v1/drift_logs",
                headers=get_headers(),
                json=data,
            )
            if res.status_code in (200, 201):
                return res.json()
        except Exception:
            pass
    return None

async def insert_model_evaluation(data: dict) -> Optional[dict]:
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.post(
                f"{SUPABASE_URL}/rest/v1/model_evaluations",
                headers=get_headers(),
                json=data,
            )
            if res.status_code in (200, 201):
                return res.json()
        except Exception:
            pass
    return None

async def get_drift_logs(limit: int = 20) -> list:
    if not SUPABASE_URL or not SUPABASE_KEY:
        return []
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.get(
                f"{SUPABASE_URL}/rest/v1/drift_logs",
                headers=get_headers(),
                params={"order": "created_at.desc", "limit": limit},
            )
            if res.status_code == 200:
                return res.json()
        except Exception:
            pass
    return []

async def get_model_evaluations(limit: int = 20) -> list:
    if not SUPABASE_URL or not SUPABASE_KEY:
        return []
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.get(
                f"{SUPABASE_URL}/rest/v1/model_evaluations",
                headers=get_headers(),
                params={"order": "created_at.desc", "limit": limit},
            )
            if res.status_code == 200:
                return res.json()
        except Exception:
            pass
    return []
