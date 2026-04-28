from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_squared_error, mean_absolute_error, r2_score
from app.services.supabase import insert_model_evaluation, get_model_evaluations

router = APIRouter()

class ClassificationMetricsRequest(BaseModel):
    y_true: List[int]
    y_pred: List[int]
    model_version: str
    timestamp: Optional[str] = None

class RegressionMetricsRequest(BaseModel):
    y_true: List[float]
    y_pred: List[float]
    model_version: str
    timestamp: Optional[str] = None

class ModelComparisonRequest(BaseModel):
    versions: List[dict]

@router.post("/evaluate/classification")
async def evaluate_classification(req: ClassificationMetricsRequest):
    if len(req.y_true) != len(req.y_pred):
        raise HTTPException(status_code=400, detail="y_true and y_pred must have same length")
    if len(req.y_true) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 samples")
    y_true = np.array(req.y_true)
    y_pred = np.array(req.y_pred)
    accuracy  = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred, average='weighted', zero_division=0)
    recall    = recall_score(y_true, y_pred, average='weighted', zero_division=0)
    f1        = f1_score(y_true, y_pred, average='weighted', zero_division=0)
    classes   = sorted(list(set(req.y_true)))
    per_class = {}
    for c in classes:
        mask = y_true == c
        if mask.sum() > 0:
            per_class[str(c)] = {
                "precision": round(float(precision_score(y_true, y_pred, labels=[c], average='micro', zero_division=0)), 4),
                "recall":    round(float(recall_score(y_true, y_pred, labels=[c], average='micro', zero_division=0)), 4),
                "support":   int(mask.sum()),
            }
    health = "Excellent" if accuracy > 0.9 else "Good" if accuracy > 0.75 else "Fair" if accuracy > 0.6 else "Poor"
    metrics = {"accuracy": round(accuracy,4), "precision": round(float(precision),4), "recall": round(float(recall),4), "f1_score": round(float(f1),4)}
    result = {
        "model_version": req.model_version, "task_type": "classification",
        "metrics": metrics, "per_class_metrics": per_class,
        "model_health": health, "total_samples": len(req.y_true),
        "correct_predictions": int((y_true == y_pred).sum()),
        "recommendation": ("Model performing excellently" if accuracy > 0.9 else "Consider fine-tuning" if accuracy > 0.75 else "Retraining strongly recommended"),
    }
    await insert_model_evaluation({"model_version": req.model_version, "task_type": "classification", "metrics": metrics, "model_health": health})
    return result

@router.post("/evaluate/regression")
async def evaluate_regression(req: RegressionMetricsRequest):
    if len(req.y_true) != len(req.y_pred):
        raise HTTPException(status_code=400, detail="y_true and y_pred must have same length")
    if len(req.y_true) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 samples")
    y_true = np.array(req.y_true)
    y_pred = np.array(req.y_pred)
    mse  = mean_squared_error(y_true, y_pred)
    mae  = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mse)
    r2   = r2_score(y_true, y_pred)
    mape = float(np.mean(np.abs((y_true - y_pred) / np.where(y_true == 0, 1, y_true))) * 100)
    health = "Excellent" if r2 > 0.9 else "Good" if r2 > 0.75 else "Fair" if r2 > 0.5 else "Poor"
    metrics = {"mse": round(float(mse),4), "mae": round(float(mae),4), "rmse": round(float(rmse),4), "r2_score": round(float(r2),4), "mape": round(mape,2)}
    result = {
        "model_version": req.model_version, "task_type": "regression",
        "metrics": metrics, "model_health": health, "total_samples": len(req.y_true),
        "recommendation": ("Model performing excellently" if r2 > 0.9 else "Consider fine-tuning" if r2 > 0.75 else "Retraining strongly recommended"),
    }
    await insert_model_evaluation({"model_version": req.model_version, "task_type": "regression", "metrics": metrics, "model_health": health})
    return result

@router.post("/compare")
def compare_models(req: ModelComparisonRequest):
    results = []
    for version_data in req.versions:
        version = version_data.get("version", "unknown")
        task    = version_data.get("task", "classification")
        y_true  = version_data.get("y_true", [])
        y_pred  = version_data.get("y_pred", [])
        if len(y_true) < 2 or len(y_true) != len(y_pred): continue
        yt = np.array(y_true); yp = np.array(y_pred)
        if task == "classification":
            score = accuracy_score(yt, yp); metric_name = "accuracy"
        else:
            score = r2_score(yt, yp); metric_name = "r2_score"
        results.append({"version": version, "task": task, "primary_metric": metric_name, "score": round(float(score),4)})
    best = max(results, key=lambda x: x["score"]) if results else None
    return {"versions_compared": len(results), "results": results, "best_version": best["version"] if best else None, "best_score": best["score"] if best else None}

@router.get("/history")
async def get_evaluation_history():
    logs = await get_model_evaluations(limit=50)
    return {"logs": logs, "count": len(logs)}
