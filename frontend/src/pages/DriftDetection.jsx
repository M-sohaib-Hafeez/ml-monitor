import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Upload, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { analyzeDrift, analyzeMultiDrift, uploadCSVPair, uploadCSV } from '../utils/api'

const DEMO_FEATURES = [
  {
    name: 'age',
    baseline: Array.from({ length: 100 }, () => Math.round(25 + Math.random() * 30)),
    current: Array.from({ length: 100 }, () => Math.round(35 + Math.random() * 30)),
  },
  {
    name: 'income',
    baseline: Array.from({ length: 100 }, () => Math.round(40000 + Math.random() * 30000)),
    current: Array.from({ length: 100 }, () => Math.round(55000 + Math.random() * 40000)),
  },
  {
    name: 'score',
    baseline: Array.from({ length: 100 }, () => parseFloat((Math.random()).toFixed(3))),
    current: Array.from({ length: 100 }, () => parseFloat((Math.random()).toFixed(3))),
  },
]

function SeverityBadge({ severity }) {
  const map = {
    'No Drift': 'badge-success',
    'Minor Drift': 'badge-info',
    'Moderate Drift': 'badge-warning',
    'Significant Drift': 'badge-danger',
  }
  return <span className={`badge ${map[severity] || 'badge-info'}`}>{severity}</span>
}

function DistributionChart({ baseline, current, name }) {
  const bins = 20
  const all = [...baseline, ...current]
  const min = Math.min(...all)
  const max = Math.max(...all)
  const step = (max - min) / bins

  const data = Array.from({ length: bins }, (_, i) => {
    const lo = min + i * step
    const hi = lo + step
    const label = lo.toFixed(1)
    const bCount = baseline.filter(v => v >= lo && v < hi).length
    const cCount = current.filter(v => v >= lo && v < hi).length
    return {
      label,
      Baseline: ((bCount / baseline.length) * 100).toFixed(1),
      Current: ((cCount / current.length) * 100).toFixed(1),
    }
  })

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
        Distribution: {name}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-dim)' }} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-dim)' }} />
          <Tooltip
            contentStyle={{ background: '#16161f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="Baseline" stroke="#7c3aed" fill="rgba(124,58,237,0.2)" strokeWidth={2} />
          <Area type="monotone" dataKey="Current" stroke="#00e5ff" fill="rgba(0,229,255,0.15)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function FeatureResult({ result, baselineData, currentData }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        onClick={() => setExpanded(v => !v)}
      >
        {result.drift_detected
          ? <AlertTriangle size={16} color="var(--warning)" />
          : <CheckCircle size={16} color="var(--accent3)" />
        }
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, flex: 1 }}>{result.feature_name}</span>
        <SeverityBadge severity={result.severity} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
          PSI: {result.psi_score}
        </span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>

      {expanded && (
        <div style={{ marginTop: 16 }}>
          <div className="grid-3" style={{ gap: 10, marginBottom: 12 }}>
            {[
              { label: 'PSI Score', val: result.psi_score, note: '< 0.1 = OK' },
              { label: 'KS Statistic', val: result.ks_statistic, note: '< 0.05 = OK' },
              { label: 'KS p-value', val: result.ks_p_value, note: '> 0.05 = OK' },
            ].map(m => (
              <div key={m.label} style={{
                background: 'var(--bg-card2)', borderRadius: 8,
                padding: '10px 14px', border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--text)' }}>{m.val}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{m.note}</div>
              </div>
            ))}
          </div>

          {result.baseline_stats && (
            <div className="grid-2" style={{ gap: 10, marginBottom: 12 }}>
              {['baseline_stats', 'current_stats'].map(key => (
                <div key={key} style={{ background: 'var(--bg-card2)', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {key === 'baseline_stats' ? 'Baseline' : 'Current'}
                  </div>
                  {Object.entries(result[key]).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {baselineData && currentData && (
            <DistributionChart baseline={baselineData} current={currentData} name={result.feature_name} />
          )}

          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 8,
            background: result.drift_detected ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
            border: `1px solid ${result.drift_detected ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`,
            fontSize: 13, display: 'flex', gap: 8, alignItems: 'flex-start',
          }}>
            <Info size={14} style={{ marginTop: 1, flexShrink: 0, color: result.drift_detected ? 'var(--warning)' : 'var(--accent3)' }} />
            <span>{result.recommendation}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DriftDetection() {
  const [mode, setMode] = useState('manual') // manual | csv | demo
  const [feature, setFeature] = useState('')
  const [baselineText, setBaselineText] = useState('')
  const [currentText, setCurrentText] = useState('')
  const [threshold, setThreshold] = useState(0.1)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [multiResults, setMultiResults] = useState(null)
  const [featureDataMap, setFeatureDataMap] = useState({})

  const [baselineFile, setBaselineFile] = useState(null)
  const [currentFile, setCurrentFile] = useState(null)

  const parseNums = (text) => {
    const nums = text.split(/[\s,]+/).map(Number).filter(n => !isNaN(n))
    return nums
  }

  const runManual = async () => {
    const baseline = parseNums(baselineText)
    const current = parseNums(currentText)
    if (!feature.trim()) { toast.error('Enter a feature name'); return }
    if (baseline.length < 10) { toast.error('Baseline needs at least 10 numbers'); return }
    if (current.length < 10) { toast.error('Current data needs at least 10 numbers'); return }
    setLoading(true)
    try {
      const res = await analyzeDrift({ baseline_data: baseline, current_data: current, feature_name: feature, threshold })
      setResults(res)
      setFeatureDataMap({ [feature]: { baseline, current } })
      setMultiResults(null)
      toast.success('Drift analysis complete')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Analysis failed')
    } finally { setLoading(false) }
  }

  const runDemo = async () => {
    setLoading(true)
    try {
      const res = await analyzeMultiDrift({ features: DEMO_FEATURES, threshold })
      setMultiResults(res)
      const map = {}
      DEMO_FEATURES.forEach(f => { map[f.name] = { baseline: f.baseline, current: f.current } })
      setFeatureDataMap(map)
      setResults(null)
      toast.success('Demo analysis complete')
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Demo failed')
    } finally { setLoading(false) }
  }

  const runCSV = async () => {
    if (!baselineFile || !currentFile) { toast.error('Upload both CSV files'); return }
    setLoading(true)
    try {
      const pair = await uploadCSVPair(baselineFile, currentFile)
      if (pair.analyzable_features === 0) { toast.error('No matching numeric features found'); setLoading(false); return }
      const features = Object.entries(pair.features).map(([name, d]) => ({ name, baseline: d.baseline, current: d.current }))
      const res = await analyzeMultiDrift({ features, threshold })
      setMultiResults(res)
      const map = {}
      features.forEach(f => { map[f.name] = { baseline: f.baseline, current: f.current } })
      setFeatureDataMap(map)
      setResults(null)
      toast.success(`Analyzed ${res.features_analyzed} features`)
    } catch (e) {
      toast.error(e.response?.data?.detail || 'CSV analysis failed')
    } finally { setLoading(false) }
  }

  const DropZone = ({ label, file, onFile }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      accept: { 'text/csv': ['.csv'] },
      onDrop: files => onFile(files[0]),
      maxFiles: 1,
    })
    return (
      <div {...getRootProps()} style={{
        border: `1px dashed ${isDragActive ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 10, padding: '18px 14px',
        textAlign: 'center', cursor: 'pointer',
        background: isDragActive ? 'rgba(0,229,255,0.05)' : 'var(--bg-card2)',
        transition: 'all 0.2s',
      }}>
        <input {...getInputProps()} />
        <Upload size={18} style={{ margin: '0 auto 8px', color: file ? 'var(--accent3)' : 'var(--text-dim)' }} />
        <div style={{ fontSize: 12, color: file ? 'var(--accent3)' : 'var(--text-muted)' }}>
          {file ? file.name : label}
        </div>
      </div>
    )
  }

  const allResults = multiResults?.results || (results ? [results] : [])

  return (
    <div className="fade-in">
      <div className="section-title">Drift Detection</div>
      <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 22, marginBottom: 6 }}>Data Drift Analyzer</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
        Detect statistical drift using PSI (Population Stability Index) and KS-test.
      </p>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[['manual', 'Manual Input'], ['csv', 'Upload CSV'], ['demo', 'Demo Data']].map(([m, l]) => (
          <button key={m} onClick={() => { setMode(m); setResults(null); setMultiResults(null) }}
            className={`btn ${mode === m ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 13, padding: '8px 16px' }}
          >
            {l}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: multiResults || results ? '1fr 1fr' : '1fr', gap: 24 }}>
        {/* Input panel */}
        <div>
          {mode === 'manual' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Feature Name</label>
                <input value={feature} onChange={e => setFeature(e.target.value)} placeholder="e.g. age, income, score" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  Baseline Data <span style={{ color: 'var(--text-dim)' }}>(comma or space separated numbers)</span>
                </label>
                <textarea
                  value={baselineText}
                  onChange={e => setBaselineText(e.target.value)}
                  placeholder="23, 45, 31, 28, 52, 47, 38, 29, 44, 51, ..."
                  style={{ minHeight: 100, resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  Current Data <span style={{ color: 'var(--text-dim)' }}>(same format)</span>
                </label>
                <textarea
                  value={currentText}
                  onChange={e => setCurrentText(e.target.value)}
                  placeholder="35, 58, 42, 39, 61, 55, 48, 40, 57, 63, ..."
                  style={{ minHeight: 100, resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  PSI Threshold: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{threshold}</span>
                </label>
                <input type="range" min="0.05" max="0.5" step="0.05" value={threshold}
                  onChange={e => setThreshold(parseFloat(e.target.value))}
                  style={{ width: '100%', padding: 0, background: 'none', border: 'none' }}
                />
              </div>
              <button className="btn btn-primary" onClick={runManual} disabled={loading} style={{ justifyContent: 'center' }}>
                {loading ? <div className="spinner" /> : 'Analyze Drift'}
              </button>
            </div>
          )}

          {mode === 'csv' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <DropZone label="Drop Baseline CSV here" file={baselineFile} onFile={setBaselineFile} />
              <DropZone label="Drop Current CSV here" file={currentFile} onFile={setCurrentFile} />
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  PSI Threshold: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{threshold}</span>
                </label>
                <input type="range" min="0.05" max="0.5" step="0.05" value={threshold}
                  onChange={e => setThreshold(parseFloat(e.target.value))}
                  style={{ width: '100%', padding: 0, background: 'none', border: 'none' }}
                />
              </div>
              <button className="btn btn-primary" onClick={runCSV} disabled={loading} style={{ justifyContent: 'center' }}>
                {loading ? <div className="spinner" /> : 'Analyze CSV Pair'}
              </button>
            </div>
          )}

          {mode === 'demo' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                Demo uses 3 synthetic features (age, income, score) with intentional distribution shifts to showcase drift detection.
              </div>
              {DEMO_FEATURES.map(f => (
                <div key={f.name} style={{ background: 'var(--bg-card2)', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', marginBottom: 4 }}>{f.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                    Baseline: μ={Math.round(f.baseline.reduce((a,b)=>a+b)/f.baseline.length)} · 100 samples
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                    Current: μ={Math.round(f.current.reduce((a,b)=>a+b)/f.current.length)} · 100 samples
                  </div>
                </div>
              ))}
              <button className="btn btn-primary" onClick={runDemo} disabled={loading} style={{ justifyContent: 'center' }}>
                {loading ? <div className="spinner" /> : 'Run Demo Analysis'}
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        {allResults.length > 0 && (
          <div className="fade-in">
            {multiResults && (
              <div className="grid-2" style={{ gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Features Analyzed', val: multiResults.features_analyzed },
                  { label: 'Drift Detected', val: multiResults.features_with_drift },
                ].map(m => (
                  <div key={m.label} className="metric-card">
                    <div className="metric-label">{m.label}</div>
                    <div className="metric-value" style={{ fontSize: 22, color: m.label === 'Drift Detected' && m.val > 0 ? 'var(--warning)' : 'var(--text)' }}>{m.val}</div>
                  </div>
                ))}
              </div>
            )}
            {allResults.map(r => (
              <FeatureResult
                key={r.feature_name}
                result={r}
                baselineData={featureDataMap[r.feature_name]?.baseline}
                currentData={featureDataMap[r.feature_name]?.current}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
