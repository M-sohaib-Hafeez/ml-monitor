import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { RefreshCw, Sparkles, AlertTriangle, Clock, Database, CheckCircle } from 'lucide-react'
import { getRetrainingPlan } from '../utils/api'

const SEVERITY_OPTS = ['No Drift', 'Minor Drift', 'Moderate Drift', 'Significant Drift']
const CONTEXT_EXAMPLES = [
  'Production recommendation system for an e-commerce platform with 50k daily users',
  'Medical diagnosis assistant deployed in 3 hospitals, trained on 2022 patient data',
  'Financial fraud detection model with strict latency requirements',
  'NLP sentiment classifier for social media monitoring tool',
]

function MarkdownText({ text }) {
  const lines = text.split('\n')
  return (
    <div style={{ lineHeight: 1.9, fontSize: 14 }}>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: 8 }} />
        const bold = line.replace(/\*\*(.*?)\*\*/g, '<BOLD>$1</BOLD>')
        const parts = bold.split(/(<BOLD>.*?<\/BOLD>)/)
        const rendered = parts.map((p, j) => {
          if (p.startsWith('<BOLD>') && p.endsWith('</BOLD>'))
            return <strong key={j} style={{ color: 'var(--text)', fontWeight: 500 }}>{p.slice(6, -7)}</strong>
          if (p.startsWith('`') && p.endsWith('`'))
            return <code key={j} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4 }}>{p.slice(1, -1)}</code>
          return <span key={j}>{p}</span>
        })
        if (line.match(/^\d+\./)) {
          return (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
              <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 12, flexShrink: 0, marginTop: 2 }}>
                {line.match(/^\d+/)[0]}.
              </span>
              <span>{rendered}</span>
            </div>
          )
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 4, paddingLeft: 8 }}>
              <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 6, width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
              <span>{rendered}</span>
            </div>
          )
        }
        if (line.startsWith('#')) {
          const lvl = line.match(/^#+/)[0].length
          const txt = line.replace(/^#+\s/, '')
          return <div key={i} style={{ fontWeight: 500, fontSize: lvl === 1 ? 16 : 14, color: 'var(--text)', marginTop: 14, marginBottom: 6 }}>{txt}</div>
        }
        return <div key={i} style={{ marginBottom: 4, color: 'var(--text-muted)' }}>{rendered}</div>
      })}
    </div>
  )
}

export default function RetrainingPlanner() {
  const [severity, setSeverity] = useState('Moderate Drift')
  const [psiScore, setPsiScore] = useState('')
  const [accuracy, setAccuracy] = useState('')
  const [datasetSize, setDatasetSize] = useState('')
  const [deployContext, setDeployContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState(null)

  const run = async () => {
    if (!deployContext.trim()) { toast.error('Describe your deployment context'); return }
    setLoading(true)
    try {
      const driftResults = {
        severity,
        psi_score: psiScore ? parseFloat(psiScore) : undefined,
        drift_detected: severity !== 'No Drift',
      }
      if (accuracy) driftResults.current_accuracy = parseFloat(accuracy)

      const res = await getRetrainingPlan({
        drift_results: driftResults,
        dataset_size: datasetSize ? parseInt(datasetSize) : undefined,
        deployment_context: deployContext,
      })
      setPlan(res)
      toast.success('Retraining plan generated')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Plan generation failed. Check API key.')
    } finally { setLoading(false) }
  }

  const urgencyColor = {
    'No Drift': 'var(--accent3)',
    'Minor Drift': 'var(--accent)',
    'Moderate Drift': 'var(--warning)',
    'Significant Drift': 'var(--danger)',
  }

  return (
    <div className="fade-in">
      <div className="section-title">Retraining Planner</div>
      <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 22, marginBottom: 6 }}>AI Retraining Plan</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
        Get a comprehensive, AI-generated retraining plan with urgency rating, data strategy, and deployment steps.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: plan ? '380px 1fr' : '1fr', gap: 24 }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, height: 'fit-content' }}>
          {/* Severity */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 10 }}>
              Drift Severity
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SEVERITY_OPTS.map(opt => (
                <div
                  key={opt}
                  onClick={() => setSeverity(opt)}
                  style={{
                    padding: '9px 14px', borderRadius: 8, cursor: 'pointer',
                    border: `1px solid ${severity === opt ? urgencyColor[opt] + '60' : 'var(--border)'}`,
                    background: severity === opt ? urgencyColor[opt] + '12' : 'var(--bg-card2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: 13, transition: 'all 0.15s',
                    color: severity === opt ? urgencyColor[opt] : 'var(--text-muted)',
                  }}
                >
                  {opt}
                  {severity === opt && <CheckCircle size={14} />}
                </div>
              ))}
            </div>
          </div>

          {/* Metrics */}
          <div className="grid-2" style={{ gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>PSI Score</label>
              <input value={psiScore} onChange={e => setPsiScore(e.target.value)} placeholder="e.g. 0.28" type="number" step="0.01" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Current Accuracy</label>
              <input value={accuracy} onChange={e => setAccuracy(e.target.value)} placeholder="e.g. 0.72" type="number" step="0.01" />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Training Dataset Size</label>
            <input value={datasetSize} onChange={e => setDatasetSize(e.target.value)} placeholder="e.g. 50000" type="number" />
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Deployment Context <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <textarea
              value={deployContext}
              onChange={e => setDeployContext(e.target.value)}
              placeholder="Describe your ML system and its deployment context..."
              style={{ minHeight: 100, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {CONTEXT_EXAMPLES.map(ex => (
                <button key={ex.slice(0, 20)}
                  onClick={() => setDeployContext(ex)}
                  style={{
                    fontSize: 10, padding: '3px 8px', borderRadius: 4,
                    background: 'var(--bg-card2)', border: '1px solid var(--border)',
                    color: 'var(--text-dim)', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                >
                  {ex.slice(0, 30)}…
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" onClick={run} disabled={loading} style={{ justifyContent: 'center', gap: 10 }}>
            {loading
              ? <><div className="spinner" /><span>Generating plan...</span></>
              : <><RefreshCw size={16} /><span>Generate Retraining Plan</span></>
            }
          </button>
        </div>

        {plan && (
          <div className="fade-in">
            {/* Header */}
            <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${urgencyColor[plan.drift_severity] || 'var(--accent)'}18`,
                border: `1px solid ${urgencyColor[plan.drift_severity] || 'var(--accent)'}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={18} color={urgencyColor[plan.drift_severity] || 'var(--accent)'} />
              </div>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>AI-Generated Retraining Plan</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Based on {plan.drift_severity} · Generated by Gemini
                </div>
              </div>
            </div>

            {/* Plan content */}
            <div className="card" style={{ maxHeight: 600, overflowY: 'auto' }}>
              <MarkdownText text={plan.retraining_plan || ''} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
