import React, { useState } from 'react'
import toast from 'react-hot-toast'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import { evaluateClassification, evaluateRegression, compareModels } from '../utils/api'

const DEMO_CLASSIFICATION = {
  y_true: [0,1,2,0,1,2,0,1,2,0,1,2,0,1,2,0,1,2,0,1,2,0,1,2,0,1,2,0,1,2],
  y_pred: [0,1,2,0,1,1,0,1,2,1,1,2,0,2,2,0,1,2,0,1,2,0,0,2,0,1,2,0,1,2],
  model_version: 'v1.0',
}
const DEMO_REGRESSION = {
  y_true: [2.5,3.1,4.0,5.2,1.8,3.7,4.5,2.9,3.3,4.8,1.5,2.2,3.9,5.0,2.7,3.4,4.2,1.9,2.6,3.8],
  y_pred: [2.6,3.0,3.9,5.0,1.9,3.8,4.3,3.0,3.5,4.7,1.6,2.3,4.0,4.9,2.8,3.3,4.0,2.0,2.7,3.9],
  model_version: 'v1.0',
}

function HealthBadge({ health }) {
  const map = { Excellent: 'badge-success', Good: 'badge-info', Fair: 'badge-warning', Poor: 'badge-danger' }
  return <span className={`badge ${map[health] || 'badge-info'}`}>{health}</span>
}

function MetricBar({ label, value, max = 1, color = 'var(--accent)' }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', color }}>{typeof value === 'number' ? value.toFixed(4) : value}</span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  )
}

export default function ModelEvaluator() {
  const [task, setTask] = useState('classification')
  const [modelVersion, setModelVersion] = useState('')
  const [yTrue, setYTrue] = useState('')
  const [yPred, setYPred] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const parseInts = t => t.split(/[\s,]+/).map(Number).filter(n => !isNaN(n))
  const parseFloats = t => t.split(/[\s,]+/).map(Number).filter(n => !isNaN(n))

  const run = async () => {
    if (!modelVersion.trim()) { toast.error('Enter model version'); return }
    const fn = task === 'classification' ? parseInts : parseFloats
    const yt = fn(yTrue)
    const yp = fn(yPred)
    if (yt.length < 2) { toast.error('Need at least 2 samples in y_true'); return }
    if (yt.length !== yp.length) { toast.error('y_true and y_pred must have same length'); return }
    setLoading(true)
    try {
      const res = task === 'classification'
        ? await evaluateClassification({ y_true: yt, y_pred: yp, model_version: modelVersion })
        : await evaluateRegression({ y_true: yt, y_pred: yp, model_version: modelVersion })
      setResult(res)
      toast.success('Evaluation complete')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Evaluation failed')
    } finally { setLoading(false) }
  }

  const runDemo = async () => {
    setLoading(true)
    try {
      const demo = task === 'classification' ? DEMO_CLASSIFICATION : DEMO_REGRESSION
      setYTrue(demo.y_true.join(', '))
      setYPred(demo.y_pred.join(', '))
      setModelVersion(demo.model_version)
      const res = task === 'classification'
        ? await evaluateClassification(demo)
        : await evaluateRegression(demo)
      setResult(res)
      toast.success('Demo evaluation loaded')
    } catch (e) {
      toast.error('Demo failed')
    } finally { setLoading(false) }
  }

  const classMetrics = result?.metrics ? [
    { name: 'Accuracy', value: result.metrics.accuracy || 0 },
    { name: 'Precision', value: result.metrics.precision || 0 },
    { name: 'Recall', value: result.metrics.recall || 0 },
    { name: 'F1 Score', value: result.metrics.f1_score || 0 },
  ] : []

  return (
    <div className="fade-in">
      <div className="section-title">Model Evaluator</div>
      <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 22, marginBottom: 6 }}>Performance Metrics</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
        Evaluate model outputs and diagnose performance degradation.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 24 }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Task toggle */}
          <div style={{ display: 'flex', gap: 8 }}>
            {['classification', 'regression'].map(t => (
              <button key={t} onClick={() => { setTask(t); setResult(null) }}
                className={`btn ${task === t ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 12, padding: '7px 14px', textTransform: 'capitalize' }}
              >
                {t}
              </button>
            ))}
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Model Version</label>
            <input value={modelVersion} onChange={e => setModelVersion(e.target.value)} placeholder="e.g. v1.0, v2.3-retrained" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              y_true <span style={{ color: 'var(--text-dim)' }}>({task === 'classification' ? 'integer class labels' : 'float values'})</span>
            </label>
            <textarea value={yTrue} onChange={e => setYTrue(e.target.value)}
              placeholder={task === 'classification' ? "0, 1, 2, 0, 1, 2, ..." : "2.5, 3.1, 4.0, ..."}
              style={{ minHeight: 90, resize: 'vertical' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              y_pred <span style={{ color: 'var(--text-dim)' }}>(predicted values)</span>
            </label>
            <textarea value={yPred} onChange={e => setYPred(e.target.value)}
              placeholder={task === 'classification' ? "0, 1, 1, 0, 1, 2, ..." : "2.6, 3.0, 3.9, ..."}
              style={{ minHeight: 90, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={run} disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? <div className="spinner" /> : 'Evaluate Model'}
            </button>
            <button className="btn btn-secondary" onClick={runDemo} disabled={loading} style={{ justifyContent: 'center' }}>
              Demo
            </button>
          </div>
        </div>

        {result && (
          <div className="fade-in">
            {/* Summary row */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <div className="metric-card" style={{ flex: 1, minWidth: 100 }}>
                <div className="metric-label">Version</div>
                <div className="metric-value" style={{ fontSize: 18, color: 'var(--accent)' }}>{result.model_version}</div>
              </div>
              <div className="metric-card" style={{ flex: 1, minWidth: 100 }}>
                <div className="metric-label">Health</div>
                <div style={{ marginTop: 4 }}><HealthBadge health={result.model_health} /></div>
              </div>
              <div className="metric-card" style={{ flex: 1, minWidth: 100 }}>
                <div className="metric-label">Samples</div>
                <div className="metric-value" style={{ fontSize: 18 }}>{result.total_samples}</div>
              </div>
            </div>

            {/* Metrics */}
            <div className="card" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
                Performance Metrics
              </div>
              {task === 'classification' ? (
                <>
                  <MetricBar label="Accuracy" value={result.metrics.accuracy} color="var(--accent3)" />
                  <MetricBar label="Precision" value={result.metrics.precision} color="var(--accent)" />
                  <MetricBar label="Recall" value={result.metrics.recall} color="var(--accent2)" />
                  <MetricBar label="F1 Score" value={result.metrics.f1_score} color="var(--warning)" />
                </>
              ) : (
                <>
                  <MetricBar label="R² Score" value={result.metrics.r2_score} color="var(--accent3)" />
                  <MetricBar label="MAE" value={result.metrics.mae} max={result.metrics.mae * 2} color="var(--accent)" />
                  <MetricBar label="RMSE" value={result.metrics.rmse} max={result.metrics.rmse * 2} color="var(--warning)" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
                    <span style={{ color: 'var(--text-muted)' }}>MAPE</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent2)' }}>{result.metrics.mape?.toFixed(2)}%</span>
                  </div>
                </>
              )}
            </div>

            {task === 'classification' && classMetrics.length > 0 && (
              <div className="card" style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Radar Overview
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={classMetrics}>
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <Radar dataKey="value" stroke="var(--accent)" fill="rgba(0,229,255,0.15)" strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {result.per_class_metrics && Object.keys(result.per_class_metrics).length > 0 && (
              <div className="card">
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Per-Class Metrics
                </div>
                {Object.entries(result.per_class_metrics).map(([cls, m]) => (
                  <div key={cls} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12,
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>Class {cls}</span>
                    <span style={{ color: 'var(--text-muted)' }}>P: {m.precision?.toFixed(3)} · R: {m.recall?.toFixed(3)} · n={m.support}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 8,
              background: 'rgba(0,229,255,0.06)',
              border: '1px solid rgba(0,229,255,0.15)',
              fontSize: 13, color: 'var(--text-muted)',
            }}>
              {result.recommendation}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
