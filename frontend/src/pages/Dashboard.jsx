import React from 'react'
import { useNavigate } from 'react-router-dom'
import { GitBranch, BarChart2, Brain, RefreshCw, ArrowRight, AlertTriangle, CheckCircle, Activity } from 'lucide-react'

const features = [
  {
    icon: GitBranch,
    title: 'Drift Detection',
    desc: 'Upload baseline & current datasets. Detects PSI, KS-test drift across features with visual distribution comparisons.',
    path: '/drift',
    color: 'var(--accent)',
    tag: 'PSI · KS-Test',
  },
  {
    icon: BarChart2,
    title: 'Model Evaluator',
    desc: 'Evaluate classification or regression models. Input predictions and get accuracy, F1, R², RMSE and per-class breakdowns.',
    path: '/model',
    color: 'var(--accent2)',
    tag: 'Classification · Regression',
  },
  {
    icon: Brain,
    title: 'AI Insights',
    desc: 'Describe your ML system and get Claude-powered analysis of drift causes, risks, and tailored recommendations.',
    path: '/insights',
    color: '#f59e0b',
    tag: 'Powered by Gemini',
  },
  {
    icon: RefreshCw,
    title: 'Retrain Planner',
    desc: 'Get a full retraining plan from Claude with urgency rating, data collection strategy, validation steps & timeline.',
    path: '/retrain',
    color: 'var(--accent3)',
    tag: 'AI-Generated Plans',
  },
]

const challenges = [
  {
    icon: AlertTriangle,
    color: 'var(--warning)',
    title: 'Data Drift',
    desc: 'Real-world data distributions shift over time. A model trained on past data may become stale as user behavior, market conditions, or system environments evolve.',
  },
  {
    icon: Activity,
    color: 'var(--danger)',
    title: 'Model Degradation',
    desc: 'Accuracy silently degrades in production. Without monitoring, degraded models continue serving bad predictions, causing silent failures in downstream systems.',
  },
  {
    icon: RefreshCw,
    color: 'var(--accent)',
    title: 'Retraining Complexity',
    desc: 'Deciding when and how to retrain requires balancing data quality, computational cost, deployment risk, and business impact — a non-trivial engineering challenge.',
  },
  {
    icon: CheckCircle,
    color: 'var(--accent3)',
    title: 'This Platform',
    desc: 'ML Health Monitor addresses all these challenges: detect drift statistically, measure model health quantitatively, and get AI-driven retraining guidance.',
  },
]

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="fade-in">
      {/* Hero */}
      <div style={{ marginBottom: 40 }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: 3,
          textTransform: 'uppercase',
          color: 'var(--accent)',
          marginBottom: 12,
        }}>
          SE Project · Machine Learning Systems
        </div>
        <h1 style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 32,
          fontWeight: 700,
          color: 'var(--text)',
          lineHeight: 1.2,
          marginBottom: 14,
        }}>
          ML Health Monitor
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 600, lineHeight: 1.7 }}>
          A platform to detect data drift, measure model degradation, and generate
          AI-powered retraining plans — addressing the real challenges of maintaining
          machine learning systems in production.
        </p>
      </div>

      {/* Challenge cards */}
      <div style={{ marginBottom: 40 }}>
        <div className="section-title">The Challenges</div>
        <div className="grid-2" style={{ gap: 14 }}>
          {challenges.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="card" style={{ display: 'flex', gap: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: `${color}18`,
                border: `1px solid ${color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={16} color={color} />
              </div>
              <div>
                <div style={{ fontWeight: 500, marginBottom: 4, fontSize: 14 }}>{title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature cards */}
      <div>
        <div className="section-title">Platform Features</div>
        <div className="grid-2" style={{ gap: 16 }}>
          {features.map(({ icon: Icon, title, desc, path, color, tag }) => (
            <div
              key={path}
              onClick={() => navigate(path)}
              className="card"
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: '1px solid var(--border)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = color + '50'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.transform = 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `${color}18`,
                  border: `1px solid ${color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} color={color} />
                </div>
                <span className="badge badge-info" style={{ fontSize: 10 }}>{tag}</span>
              </div>
              <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>{desc}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color }}>
                Open <ArrowRight size={13} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
