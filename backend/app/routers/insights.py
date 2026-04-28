from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx
import os
import json

router = APIRouter()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

class InsightRequest(BaseModel):
    context: str
    drift_results: Optional[dict] = None
    model_metrics: Optional[dict] = None
    question: Optional[str] = None

class RetrainingRequest(BaseModel):
    drift_results: dict
    model_metrics: Optional[dict] = None
    dataset_size: Optional[int] = None
    deployment_context: Optional[str] = None

async def call_gemini(system_prompt: str, user_message: str) -> str:
    if not GEMINI_API_KEY:
        return "Gemini API key not configured. Please set GEMINI_API_KEY environment variable."
    full_prompt = f"{system_prompt}\n\n{user_message}"
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{GEMINI_URL}?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": full_prompt}]}],
                "generationConfig": {"maxOutputTokens": 1024, "temperature": 0.4},
            },
        )
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Gemini API error: {response.text}")
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]

@router.post("/analyze")
async def get_insights(req: InsightRequest):
    system = (
        "You are an expert ML systems engineer specializing in model monitoring, "
        "data drift detection, and production ML systems. Provide concise, actionable "
        "insights in plain English. Structure your response with: 1) Key Finding, "
        "2) Root Cause Analysis, 3) Recommended Actions. Be specific and practical."
    )
    parts = [f"Context: {req.context}"]
    if req.drift_results:
        parts.append(f"Drift Analysis Results: {json.dumps(req.drift_results, indent=2)}")
    if req.model_metrics:
        parts.append(f"Model Performance Metrics: {json.dumps(req.model_metrics, indent=2)}")
    if req.question:
        parts.append(f"Specific Question: {req.question}")
    user_message = "\n\n".join(parts)
    insight = await call_gemini(system, user_message)
    return {"insight": insight, "context": req.context}

@router.post("/retraining-plan")
async def get_retraining_plan(req: RetrainingRequest):
    system = (
        "You are an expert ML engineer. Generate a detailed, practical retraining plan "
        "based on the drift analysis and model performance data. Include: "
        "1) Urgency level (Critical/High/Medium/Low), "
        "2) Data collection strategy, "
        "3) Retraining approach, "
        "4) Validation steps, "
        "5) Deployment considerations, "
        "6) Estimated timeline. Be specific and actionable."
    )
    user_message = (
        f"Drift Analysis: {json.dumps(req.drift_results, indent=2)}\n"
        f"Model Metrics: {json.dumps(req.model_metrics or {}, indent=2)}\n"
        f"Dataset Size: {req.dataset_size or 'Unknown'}\n"
        f"Deployment Context: {req.deployment_context or 'Production ML System'}\n\n"
        "Please generate a comprehensive retraining plan."
    )
    plan = await call_gemini(system, user_message)
    return {"retraining_plan": plan, "drift_severity": req.drift_results.get("severity", "Unknown")}

@router.post("/explain-drift")
async def explain_drift(req: InsightRequest):
    system = (
        "You are an ML educator explaining data drift to a software engineering student. "
        "Explain what the drift means in practical terms, why it happens, and what its "
        "real-world impact would be. Use simple analogies and avoid jargon where possible."
    )
    user_message = (
        f"Drift Results: {json.dumps(req.drift_results or {}, indent=2)}\n"
        f"Context: {req.context}\n"
        "Explain what this drift means and why it matters."
    )
    explanation = await call_gemini(system, user_message)
    return {"explanation": explanation}
