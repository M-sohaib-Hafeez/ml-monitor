from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import drift, model, insights, upload

app = FastAPI(title="ML Health Monitor API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
app.include_router(drift.router, prefix="/api/drift", tags=["drift"])
app.include_router(model.router, prefix="/api/model", tags=["model"])
app.include_router(insights.router, prefix="/api/insights", tags=["insights"])

@app.get("/")
def root():
    return {"status": "ML Health Monitor API is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}
