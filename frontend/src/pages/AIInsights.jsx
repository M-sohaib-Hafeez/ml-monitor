import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { Brain, Send, Sparkles } from 'lucide-react'
import { getInsights, explainDrift } from '../utils/api'

const EXAMPLE_PROMPTS = [
  { label: 'E-commerce Drift', context: 'Our product recommendation model was trained on pre-pandemic shopping data. Now we are seeing significant drift in user purchase patterns and the model accuracy dropped from 89% to 71%.' },
  { label: 'Financial Fraud', context: 'Credit card fraud detection model trained in 2022 is showing model degradation. PSI of 0.31 detected in transaction_amount feature. False negative rate increased from 2% to 8%.' },
  { label: 'Healthcare Prediction', context: 'Patient readmission prediction model deployed 18 months ago. New hospital procedures changed lab test distributions. KS p-value for 3 features dropped below 0.01.' },
]

function MarkdownText({ text }) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\n)/)
  return (
    <div style={{ lineHeight: 1.8, fontSize: 14 }}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**'))
          return <strong key={i} style={{ color: 'var(--text)', fontWeight: 500 }}>{part.slice(2, -2)}</strong>
        if (part.startsWith('`') && part.endsWith('`'))
          return <code key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4 }}>{part.slice(1, -1)}</code>
        if (part === '\n') return <br key={i} />
        return <span key={i}>{part}</span>
      })}
    </div>
  )
}

export default function AIInsights() {
  const [context, setContext] = useState('')
  const [question, setQuestion] = useState('')
  const [driftJson, setDriftJson] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [mode, setMode] = useState('analyze') // analyze | explain

  const run = async () => {
    if (!context.trim()) { toast.error('Describe your ML system context'); return }
    setLoading(true)
    try {
      let driftResults = null
      if (driftJson.trim()) {
        try { driftResults = JSON.parse(driftJson) } catch { toast.error('Invalid JSON in drift results'); setLoading(false); return }
      }
      const res = mode === 'analyze'
        ? await getInsights({ context, question: question || undefined, drift_results: driftResults || undefined })
        : await explainDrift({ context, drift_results: driftResults || undefined })
      setResult(res)
      toast.success('Insights generated')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Insight generation failed. Check API key.')
    } finally { setLoading(false) }
  }

  return (
    <div className="fade-in">
      <div className="section-title">AI Insights</div>
      <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 22, marginBottom: 6 }}>Claude-Powered Analysis</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
        Describe your ML system and get expert analysis, root cause diagnosis, and actionable recommendations.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[['analyze', 'System Analysis'], ['explain', 'Explain Drift']].map(([m, l]) => (
              <button key={m} onClick={() => { setMode(m); setResult(null) }}
                className={`btn ${mode === m ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 12, padding: '7px 14px' }}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Example prompts */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>
              Example Scenarios
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {EXAMPLE_PROMPTS.map(p => (
                <button key={p.label}
                  onClick={() => setContext(p.context)}
                  style={{
                    fontSize: 11, padding: '5px 10px', borderRadius: 6,
                    background: 'var(--bg-card2)', border: '1px solid var(--border)',
                    color: 'var(--text-muted)', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                ML System Context <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <textarea
                value={context}
                onChange={e => setContext(e.target.value)}
                placeholder="Describe your ML system: what it does, how old the training data is, what changes you've observed, current performance metrics..."
                style={{ minHeight: 120, resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Drift Results JSON <span style={{ color: 'var(--text-dim)' }}>(optional — paste from Drift Analyzer)</span>
              </label>
              <textarea
                value={driftJson}
                onChange={e => setDriftJson(e.target.value)}
                placeholder='{"psi_score": 0.28, "severity": "Significant Drift", ...}'
                style={{ minHeight: 70, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 12 }}
              />
            </div>

            {mode === 'analyze' && (
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  Specific Question <span style={{ color: 'var(--text-dim)' }}>(optional)</span>
                </label>
                <input value={question} onChange={e => setQuestion(e.target.value)}
                  placeholder="e.g. Should I retrain now or wait? What data should I collect?" />
              </div>
            )}

            <button className="btn btn-primary" onClick={run} disabled={loading} style={{ justifyContent: 'center', gap: 10 }}>
              {loading
                ? <><div className="spinner" /><span>Gemini is thinking...</span></>
                : <><Brain size={16} /><span>Generate Insights</span></>
              }
            </button>
          </div>
        </div>

        {result && (
          <div className="fade-in">
            <div className="card" style={{ minHeight: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: 'linear-gradient(135deg, var(--accent2), var(--accent))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Sparkles size={14} color="#fff" />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>
                  Claude Analysis
                </span>
              </div>
              <MarkdownText text={result.insight || result.explanation || ''} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
