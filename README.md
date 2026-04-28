# ML Health Monitor

> **SE Project** — *Challenges in Maintaining Machine Learning-Based Systems: Data Drift & Model Retraining*

A full-stack platform to detect data drift, evaluate model performance degradation, and generate AI-powered retraining plans using Groq (LLaMA 3.3-70b).

---

## 🌐 Live Deployment

| Service | URL | Description |
|---------|-----|-------------|
| 🖥️ **Frontend** | [ml-monitor-beryl.vercel.app](https://ml-monitor-beryl.vercel.app/) | Live React app hosted on Vercel |
| ⚙️ **Backend API** | [ml-monitor-production.up.railway.app](https://ml-monitor-production.up.railway.app/) | FastAPI backend hosted on Railway (till 5/28/2026) |
| 📖 **API Docs** | [ml-monitor-production.up.railway.app/docs](https://ml-monitor-production.up.railway.app/docs) | Interactive Swagger UI for all API endpoints |

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
3. **AI-Powered Insights** — Groq LLaMA 3.3-70b analyzes your ML system context and provides root cause analysis, risk assessment, and recommendations
4. **Retraining Planner** — AI generates comprehensive retraining plans with urgency rating, data collection strategy, validation steps, and deployment considerations
5. **History (DB)** — All past drift analyses and model evaluations saved and retrieved from Supabase

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Recharts |
| Backend | FastAPI (Python) |
| ML/Stats | scikit-learn, scipy, numpy, pandas |
| AI Layer | Groq API (LLaMA 3.3-70b-versatile) |
| Database | Supabase (PostgreSQL) |
| Deploy Frontend | Vercel |
| Deploy Backend | Railway |

---

## 📁 Project Structure

```
ml-monitor/
├── frontend/              # React + Vite app
│   ├── src/
│   │   ├── components/    # Layout, Sidebar
│   │   ├── pages/         # Dashboard, DriftDetection, ModelEvaluator,
│   │   │                  # AIInsights, RetrainingPlanner, History
│   │   └── utils/         # API client (axios)
│   ├── vercel.json
│   └── package.json
│
├── backend/               # FastAPI Python backend
│   ├── app/
│   │   ├── main.py        # Entry point + CORS
│   │   ├── routers/
│   │   │   ├── drift.py       # PSI + KS drift detection
│   │   │   ├── model.py       # Classification & regression metrics
│   │   │   ├── insights.py    # Groq AI integration
│   │   │   └── upload.py      # CSV parsing
│   │   └── services/
│   │       └── supabase.py    # Supabase DB integration
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
echo "GROQ_API_KEY=your_groq_key_here" > .env
echo "SUPABASE_URL=your_supabase_url" >> .env
echo "SUPABASE_KEY=your_supabase_key" >> .env

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
4. Add environment variables: `GROQ_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`
5. Railway auto-detects `Procfile` and deploys

### Frontend → Vercel
1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Set **Root Directory** to `frontend`
3. Add environment variable: `VITE_API_URL=https://ml-monitor-production.up.railway.app`
4. Deploy — Vercel auto-detects Vite

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/drift/analyze` | Single-feature drift (PSI + KS) |
| POST | `/api/drift/analyze-multi` | Multi-feature drift analysis |
| GET  | `/api/drift/history` | Fetch drift logs from Supabase |
| POST | `/api/model/evaluate/classification` | Classification metrics |
| POST | `/api/model/evaluate/regression` | Regression metrics |
| POST | `/api/model/compare` | Compare model versions |
| GET  | `/api/model/history` | Fetch evaluation logs from Supabase |
| POST | `/api/insights/analyze` | Groq AI system analysis |
| POST | `/api/insights/retraining-plan` | Groq AI retraining plan |
| POST | `/api/insights/explain-drift` | Groq AI drift explanation |
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
- All AI features call the **Groq API** using `llama-3.3-70b-versatile`
- Context-aware prompts include system description + numerical drift results
- Responses rendered with markdown parsing in the frontend

### Database
- Every drift analysis and model evaluation is automatically saved to **Supabase**
- History page fetches and displays all past logs in a sortable table

---

## 📄 License

MIT — Educational project for Software Engineering coursework.
