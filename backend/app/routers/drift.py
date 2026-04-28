from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from scipy import stats
import json

router = APIRouter()

class DriftRequest(BaseModel):
    baseline_data: List[float]
    current_data: List[float]
    feature_name: str
    threshold: float = 0.05

class MultiFeatureDriftRequest(BaseModel):
    features: List[dict]
    threshold: float = 0.05

def compute_psi(baseline: List[float], current: List[float], buckets: int = 10) -> float:
    baseline_arr = np.array(baseline)
    current_arr = np.array(current)
    breakpoints = np.percentile(baseline_arr, np.linspace(0, 100, buckets + 1))
    breakpoints[0] = -np.inf
    breakpoints[-1] = np.inf
    baseline_counts = np.histogram(baseline_arr, bins=breakpoints)[0]
    current_counts = np.histogram(current_arr, bins=breakpoints)[0]
    baseline_percents = baseline_counts / len(baseline_arr)
    current_percents = current_counts / len(current_arr)
    baseline_percents = np.where(baseline_percents == 0, 0.0001, baseline_percents)
    current_percents = np.where(current_percents == 0, 0.0001, current_percents)
    psi = np.sum((current_percents - baseline_percents) * np.log(current_percents / baseline_percents))
    return float(psi)

def compute_ks_test(baseline: List[float], current: List[float]) -> dict:
    stat, p_value = stats.ks_2samp(baseline, current)
    return {"statistic": float(stat), "p_value": float(p_value)}

def drift_severity(psi: float) -> str:
    if psi < 0.1:
        return "No Drift"
    elif psi < 0.2:
        return "Minor Drift"
    elif psi < 0.25:
        return "Moderate Drift"
    else:
        return "Significant Drift"

@router.post("/analyze")
def analyze_drift(req: DriftRequest):
    if len(req.baseline_data) < 10 or len(req.current_data) < 10:
        raise HTTPException(status_code=400, detail="Need at least 10 data points per dataset")

    psi = compute_psi(req.baseline_data, req.current_data)
    ks = compute_ks_test(req.baseline_data, req.current_data)
    severity = drift_severity(psi)
    drift_detected = psi >= req.threshold or ks["p_value"] < 0.05

    baseline_arr = np.array(req.baseline_data)
    current_arr = np.array(req.current_data)

    return {
        "feature_name": req.feature_name,
        "drift_detected": drift_detected,
        "severity": severity,
        "psi_score": round(psi, 4),
        "ks_statistic": round(ks["statistic"], 4),
        "ks_p_value": round(ks["p_value"], 4),
        "baseline_stats": {
            "mean": round(float(baseline_arr.mean()), 4),
            "std": round(float(baseline_arr.std()), 4),
            "min": round(float(baseline_arr.min()), 4),
            "max": round(float(baseline_arr.max()), 4),
            "median": round(float(np.median(baseline_arr)), 4),
        },
        "current_stats": {
            "mean": round(float(current_arr.mean()), 4),
            "std": round(float(current_arr.std()), 4),
            "min": round(float(current_arr.min()), 4),
            "max": round(float(current_arr.max()), 4),
            "median": round(float(np.median(current_arr)), 4),
        },
        "recommendation": (
            "Immediate retraining recommended" if psi > 0.25
            else "Monitor closely, consider retraining" if psi > 0.1
            else "No action needed, system healthy"
        ),
    }

@router.post("/analyze-multi")
def analyze_multi_feature_drift(req: MultiFeatureDriftRequest):
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
        results.append({
            "feature_name": name,
            "drift_detected": psi >= req.threshold or ks["p_value"] < 0.05,
            "severity": severity,
            "psi_score": round(psi, 4),
            "ks_p_value": round(ks["p_value"], 4),
        })
    overall_drift = any(r["drift_detected"] for r in results)
    return {
        "overall_drift_detected": overall_drift,
        "features_analyzed": len(results),
        "features_with_drift": sum(1 for r in results if r["drift_detected"]),
        "results": results,
    }
