import React, { useEffect, useState } from 'react'
import { getDriftHistory, getModelHistory } from '../utils/api'
import { Database, RefreshCw } from 'lucide-react'

function SeverityBadge({ s }) {
  const map = { 'No Drift':'badge-success','Minor Drift':'badge-info','Moderate Drift':'badge-warning','Significant Drift':'badge-danger' }
  return <span className={`badge ${map[s]||'badge-info'}`}>{s}</span>
}
function HealthBadge({ h }) {
  const map = { Excellent:'badge-success', Good:'badge-info', Fair:'badge-warning', Poor:'badge-danger' }
  return <span className={`badge ${map[h]||'badge-info'}`}>{h}</span>
}

export default function History() {
  const [driftLogs, setDriftLogs] = useState([])
  const [modelLogs, setModelLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('drift')

  const load = async () => {
    setLoading(true)
    try {
      const [d, m] = await Promise.all([getDriftHistory(), getModelHistory()])
      setDriftLogs(d.logs || [])
      setModelLogs(m.logs || [])
    } catch (e) { /* Supabase not configured */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return (
    <div className="fade-in">
      <div className="section-title">Supabase History</div>
      <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 22, marginBottom: 6 }}>Saved Logs</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
        All past drift analyses and model evaluations saved to Supabase.
      </p>

      <div style={{ display:'flex', gap:8, marginBottom:20, alignItems:'center' }}>
        {[['drift','Drift Logs'],['model','Model Evaluations']].map(([t,l]) => (
          <button key={t} onClick={()=>setTab(t)} className={`btn ${tab===t?'btn-primary':'btn-secondary'}`} style={{fontSize:13,padding:'8px 16px'}}>{l}</button>
        ))}
        <button onClick={load} className="btn btn-secondary" style={{marginLeft:'auto',gap:6,fontSize:13,padding:'8px 14px'}}>
          <RefreshCw size={13}/> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:60}}><div className="spinner"/></div>
      ) : tab === 'drift' ? (
        driftLogs.length === 0 ? (
          <div className="card" style={{textAlign:'center',padding:48,color:'var(--text-muted)'}}>
            <Database size={32} style={{margin:'0 auto 12px',opacity:0.3}}/>
            No drift logs yet. Run a drift analysis to see history here.
          </div>
        ) : (
          <div className="card" style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{borderBottom:'1px solid var(--border)'}}>
                  {['Feature','PSI Score','KS p-value','Severity','Drift?','Time'].map(h=>(
                    <th key={h} style={{padding:'8px 12px',textAlign:'left',color:'var(--text-dim)',fontFamily:'var(--font-mono)',fontSize:11,fontWeight:400,textTransform:'uppercase',letterSpacing:1}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {driftLogs.map((log,i)=>(
                  <tr key={log.id||i} style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    <td style={{padding:'10px 12px',fontFamily:'var(--font-mono)',color:'var(--accent)'}}>{log.feature_name}</td>
                    <td style={{padding:'10px 12px',fontFamily:'var(--font-mono)'}}>{log.psi_score}</td>
                    <td style={{padding:'10px 12px',fontFamily:'var(--font-mono)'}}>{log.ks_p_value}</td>
                    <td style={{padding:'10px 12px'}}><SeverityBadge s={log.severity}/></td>
                    <td style={{padding:'10px 12px',color:log.drift_detected?'var(--warning)':'var(--accent3)',fontFamily:'var(--font-mono)',fontSize:12}}>{log.drift_detected?'YES':'NO'}</td>
                    <td style={{padding:'10px 12px',color:'var(--text-dim)',fontSize:12}}>{log.created_at?new Date(log.created_at).toLocaleString():'-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        modelLogs.length === 0 ? (
          <div className="card" style={{textAlign:'center',padding:48,color:'var(--text-muted)'}}>
            <Database size={32} style={{margin:'0 auto 12px',opacity:0.3}}/>
            No model evaluations yet. Evaluate a model to see history here.
          </div>
        ) : (
          <div className="card" style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{borderBottom:'1px solid var(--border)'}}>
                  {['Version','Task','Key Metric','Health','Time'].map(h=>(
                    <th key={h} style={{padding:'8px 12px',textAlign:'left',color:'var(--text-dim)',fontFamily:'var(--font-mono)',fontSize:11,fontWeight:400,textTransform:'uppercase',letterSpacing:1}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modelLogs.map((log,i)=>(
                  <tr key={log.id||i} style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    <td style={{padding:'10px 12px',fontFamily:'var(--font-mono)',color:'var(--accent)'}}>{log.model_version}</td>
                    <td style={{padding:'10px 12px',textTransform:'capitalize'}}>{log.task_type}</td>
                    <td style={{padding:'10px 12px',fontFamily:'var(--font-mono)',fontSize:12}}>
                      {log.task_type==='classification'?`Acc: ${log.metrics?.accuracy}`:`R²: ${log.metrics?.r2_score}`}
                    </td>
                    <td style={{padding:'10px 12px'}}><HealthBadge h={log.model_health}/></td>
                    <td style={{padding:'10px 12px',color:'var(--text-dim)',fontSize:12}}>{log.created_at?new Date(log.created_at).toLocaleString():'-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}
