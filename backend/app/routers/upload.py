from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import numpy as np
import io

router = APIRouter()

@router.post("/csv")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file is empty")

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()

    preview = df.head(5).replace({np.nan: None}).to_dict(orient="records")

    features = {}
    for col in numeric_cols[:10]:
        col_data = df[col].dropna().tolist()
        if len(col_data) >= 10:
            features[col] = {
                "type": "numeric",
                "values": col_data,
                "stats": {
                    "mean": round(float(df[col].mean()), 4),
                    "std": round(float(df[col].std()), 4),
                    "min": round(float(df[col].min()), 4),
                    "max": round(float(df[col].max()), 4),
                    "missing": int(df[col].isna().sum()),
                },
            }

    return {
        "filename": file.filename,
        "rows": len(df),
        "columns": len(df.columns),
        "numeric_columns": numeric_cols,
        "categorical_columns": categorical_cols,
        "preview": preview,
        "features": features,
    }

@router.post("/validate-pair")
async def validate_dataset_pair(
    baseline: UploadFile = File(...),
    current: UploadFile = File(...)
):
    def parse_csv(upload):
        contents = upload.file.read()
        try:
            return pd.read_csv(io.StringIO(contents.decode("utf-8")))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse {upload.filename}: {e}")

    df_baseline = parse_csv(baseline)
    df_current = parse_csv(current)

    common_cols = list(set(df_baseline.columns) & set(df_current.columns))
    numeric_common = [c for c in common_cols if
                      df_baseline[c].dtype in [np.float64, np.int64] and
                      df_current[c].dtype in [np.float64, np.int64]]

    features = {}
    for col in numeric_common[:8]:
        b_vals = df_baseline[col].dropna().tolist()
        c_vals = df_current[col].dropna().tolist()
        if len(b_vals) >= 10 and len(c_vals) >= 10:
            features[col] = {
                "baseline": b_vals,
                "current": c_vals,
            }

    return {
        "baseline_rows": len(df_baseline),
        "current_rows": len(df_current),
        "common_columns": len(common_cols),
        "analyzable_features": len(features),
        "features": features,
    }
