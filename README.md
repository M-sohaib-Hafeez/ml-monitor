# ML Health Monitor

> **SE Project** — *Challenges in Maintaining Machine Learning-Based Systems: Data Drift & Model Retraining*

A full-stack platform to detect data drift, evaluate model performance degradation, and generate AI-powered retraining plans

---

## 👥 Group Members

| Name | Roll No | Section |
|------|---------|---------|
| Muhammad Sohaib Hafeez | BSCS-85 | Sec-A2 |
| Maham Siddiqui | BSCS-70 | Sec-A2 |
| Maryam Aijaz | BSCS-71 | Sec-A2 |

---

## 🎯 Project Overview

This platform directly addresses the SE topic by providing:

1. **Data Drift Detection** — PSI (Population Stability Index) and KS-test based drift analysis across features, with visual distribution comparisons
2. **Model Performance Evaluator** — Classification (accuracy, F1, precision, recall) and regression (R², MAE, RMSE, MAPE) evaluation with degradation diagnosis
3. **AI-Powered Insights** — Claude analyzes your ML system context and provides root cause analysis, risk assessment, and recommendations
4. **Retraining Planner** — AI generates comprehensive retraining plans with urgency rating, data collection strategy, validation steps, and deployment considerations

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Recharts |
| Backend | FastAPI (Python) |
| ML/Stats | scikit-learn, scipy, numpy, pandas |
| AI Layer | Google Gemini API |
| Deploy Frontend | Vercel |
| Deploy Backend | Railway |

---

## 📁 Project Structure

```
ml-health-monitor/
├── frontend/              # React + Vite app
│   ├── src/
│   │   ├── components/    # Layout, Sidebar
│   │   ├── pages/         # Dashboard, DriftDetection, ModelEvaluator, AIInsights, RetrainingPlanner
│   │   └── utils/         # API client (axios)
│   ├── vercel.json
│   └── package.json
│
├── backend/               # FastAPI Python backend
│   ├── app/
│   │   ├── main.py        # Entry point + CORS
│   │   └── routers/
│   │       ├── drift.py       # PSI + KS drift detection
│   │       ├── model.py       # Classification & regression metrics
│   │       ├── insights.py    # Claude AI integration
│   │       └── upload.py      # CSV parsing
│   ├── requirements.txt
│   ├── Dockerfile
│   └── Procfile
│
└── README.md
```

---

## 🚀 Local Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
echo "GEMINI_API_KEY=your_key_here" > .env

uvicorn app.main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000" > .env

npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🌐 Deployment

### Backend → Railway

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select `backend/` as root directory
4. Add environment variable: `GEMINI_API_KEY=your_key`
5. Railway auto-detects `Procfile` and deploys

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Set **Root Directory** to `frontend`
3. Add environment variable: `VITE_API_URL=https://your-backend.railway.app`
4. Deploy — Vercel auto-detects Vite

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/drift/analyze` | Single-feature drift (PSI + KS) |
| POST | `/api/drift/analyze-multi` | Multi-feature drift analysis |
| POST | `/api/model/evaluate/classification` | Classification metrics |
| POST | `/api/model/evaluate/regression` | Regression metrics |
| POST | `/api/model/compare` | Compare model versions |
| POST | `/api/insights/analyze` | Claude AI system analysis |
| POST | `/api/insights/retraining-plan` | Claude retraining plan |
| POST | `/api/insights/explain-drift` | Claude drift explanation |
| POST | `/api/upload/csv` | Parse uploaded CSV |
| POST | `/api/upload/validate-pair` | Validate baseline/current CSV pair |

---

## 🔬 How It Works

### Drift Detection
- **PSI (Population Stability Index)**: Measures shift in feature distributions. PSI < 0.1 = stable, 0.1–0.2 = monitor, > 0.2 = retrain.
- **KS-Test**: Kolmogorov–Smirnov test measures max difference between CDFs. p-value < 0.05 = significant drift.

### Model Evaluation
- Classification: accuracy, weighted precision/recall/F1, per-class breakdown
- Regression: MSE, MAE, RMSE, R², MAPE

### AI Integration
- All AI features call the Google Gemini API (`gemini-1.5-flash`)
- Context-aware prompts include system description + numerical drift results
- Responses are streamed back and rendered with markdown parsing

---

## 📄 License

MIT — Educational project for Software Engineering coursework.
