from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from scipy import stats
import json
from app.services.supabase import insert_drift_log, get_drift_logs

router = APIRouter()

class DriftRequest(BaseModel):
    baseline_data: List[float]
    current_data: List[float]
    feature_name: str
    threshold: float = 0.05

class MultiFeatureDriftRequest(BaseModel):
    features: List[dict]
    threshold: float = 0.05

def compute_psi(baseline, current, buckets=10):
    baseline_arr = np.array(baseline)
    current_arr = np.array(current)
    breakpoints = np.percentile(baseline_arr, np.linspace(0, 100, buckets + 1))
    breakpoints[0] = -np.inf
    breakpoints[-1] = np.inf
    b_counts = np.histogram(baseline_arr, bins=breakpoints)[0]
    c_counts = np.histogram(current_arr, bins=breakpoints)[0]
    b_pct = np.where(b_counts / len(baseline_arr) == 0, 0.0001, b_counts / len(baseline_arr))
    c_pct = np.where(c_counts / len(current_arr) == 0, 0.0001, c_counts / len(current_arr))
    return float(np.sum((c_pct - b_pct) * np.log(c_pct / b_pct)))

def compute_ks_test(baseline, current):
    stat, p_value = stats.ks_2samp(baseline, current)
    return {"statistic": float(stat), "p_value": float(p_value)}

def drift_severity(psi):
    if psi < 0.1: return "No Drift"
    elif psi < 0.2: return "Minor Drift"
    elif psi < 0.25: return "Moderate Drift"
    else: return "Significant Drift"

@router.post("/analyze")
async def analyze_drift(req: DriftRequest):
    if len(req.baseline_data) < 10 or len(req.current_data) < 10:
        raise HTTPException(status_code=400, detail="Need at least 10 data points per dataset")
    psi = compute_psi(req.baseline_data, req.current_data)
    ks = compute_ks_test(req.baseline_data, req.current_data)
    severity = drift_severity(psi)
    drift_detected = psi >= req.threshold or ks["p_value"] < 0.05
    b = np.array(req.baseline_data)
    c = np.array(req.current_data)
    result = {
        "feature_name": req.feature_name,
        "drift_detected": drift_detected,
        "severity": severity,
        "psi_score": round(psi, 4),
        "ks_statistic": round(ks["statistic"], 4),
        "ks_p_value": round(ks["p_value"], 4),
        "baseline_stats": {"mean": round(float(b.mean()),4),"std": round(float(b.std()),4),"min": round(float(b.min()),4),"max": round(float(b.max()),4),"median": round(float(np.median(b)),4)},
        "current_stats":  {"mean": round(float(c.mean()),4),"std": round(float(c.std()),4),"min": round(float(c.min()),4),"max": round(float(c.max()),4),"median": round(float(np.median(c)),4)},
        "recommendation": ("Immediate retraining recommended" if psi > 0.25 else "Monitor closely, consider retraining" if psi > 0.1 else "No action needed, system healthy"),
    }
    await insert_drift_log({"feature_name": req.feature_name, "psi_score": round(psi,4), "ks_p_value": round(ks["p_value"],4), "severity": severity, "drift_detected": drift_detected})
    return result

@router.post("/analyze-multi")
async def analyze_multi_feature_drift(req: MultiFeatureDriftRequest):
    results = []
    for feature in req.features:
        name = feature.get("name", "unknown")
        baseline = feature.get("baseline", [])
        current = feature.get("current", [])
        if len(baseline) < 10 or len(current) < 10:
            continue
        psi = compute_psi(baseline, current)
        ks = compute_ks_test(baseline, current)
        severity = drift_severity(psi)
        drift_detected = psi >= req.threshold or ks["p_value"] < 0.05
        results.append({"feature_name": name, "drift_detected": drift_detected, "severity": severity, "psi_score": round(psi,4), "ks_p_value": round(ks["p_value"],4)})
        await insert_drift_log({"feature_name": name, "psi_score": round(psi,4), "ks_p_value": round(ks["p_value"],4), "severity": severity, "drift_detected": drift_detected})
    overall_drift = any(r["drift_detected"] for r in results)
    return {"overall_drift_detected": overall_drift, "features_analyzed": len(results), "features_with_drift": sum(1 for r in results if r["drift_detected"]), "results": results}

@router.get("/history")
async def get_drift_history():
    logs = await get_drift_logs(limit=50)
    return {"logs": logs, "count": len(logs)}
