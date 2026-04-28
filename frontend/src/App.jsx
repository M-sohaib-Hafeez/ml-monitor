import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import DriftDetection from './pages/DriftDetection'
import ModelEvaluator from './pages/ModelEvaluator'
import AIInsights from './pages/AIInsights'
import RetrainingPlanner from './pages/RetrainingPlanner'
import History from './pages/History'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{
        style: { background:'#16161f', color:'#e8e8f0', border:'1px solid rgba(255,255,255,0.1)', fontFamily:"'DM Sans', sans-serif", fontSize:'14px' },
        success: { iconTheme: { primary:'#10b981', secondary:'#000' } },
        error:   { iconTheme: { primary:'#ef4444', secondary:'#000' } },
      }}/>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="drift" element={<DriftDetection />} />
          <Route path="model" element={<ModelEvaluator />} />
          <Route path="insights" element={<AIInsights />} />
          <Route path="retrain" element={<RetrainingPlanner />} />
          <Route path="history" element={<History />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
