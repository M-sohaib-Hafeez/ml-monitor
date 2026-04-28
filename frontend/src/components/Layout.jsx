import React, { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, GitBranch, BarChart2,
  Brain, RefreshCw, Database, Menu, X, Activity
} from 'lucide-react'

const navItems = [
  { to: '/',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/drift',   icon: GitBranch,       label: 'Drift Detection' },
  { to: '/model',   icon: BarChart2,       label: 'Model Evaluator' },
  { to: '/insights',icon: Brain,           label: 'AI Insights' },
  { to: '/retrain', icon: RefreshCw,       label: 'Retrain Planner' },
  { to: '/history', icon: Database,       label: 'History (DB)' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: sidebarOpen ? 0 : '-240px',
        height: '100vh',
        zIndex: 100,
        transition: 'left 0.25s ease',
        '@media(min-width:768px)': { left: 0 },
      }}
        className="sidebar"
      >
        {/* Logo */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{
            width: 32, height: 32,
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={16} color="#000" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
              ML Monitor
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              Health Dashboard
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', display: 'none' }}
            className="close-sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: isActive ? 500 : 400,
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                background: isActive ? 'rgba(0,229,255,0.08)' : 'transparent',
                border: isActive ? '1px solid rgba(0,229,255,0.18)' : '1px solid transparent',
                transition: 'all 0.15s',
              })}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border)',
          fontSize: 11,
          color: 'var(--text-dim)',
          fontFamily: 'var(--font-mono)',
        }}>
          SE Project · BSCS-85/70/71
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
          }}
        />
      )}

      {/* Main */}
      <main style={{
        flex: 1,
        marginLeft: 240,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Top bar */}
        <header style={{
          padding: '14px 28px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: 'var(--bg-card)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-muted)',
              display: 'none',
            }}
            className="menu-btn"
          >
            <Menu size={20} />
          </button>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>
            {navItems.find(n => n.to === location.pathname)?.label || 'Dashboard'}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--accent3)',
              boxShadow: '0 0 8px var(--accent3)',
              animation: 'pulse 2s infinite',
            }} />
            <span style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              System Active
            </span>
          </div>
        </header>

        <div style={{ flex: 1, padding: '28px', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (max-width: 768px) {
          main { margin-left: 0 !important; }
          .menu-btn { display: flex !important; }
          .close-sidebar { display: flex !important; }
          .sidebar { left: -240px !important; }
          .sidebar.open { left: 0 !important; }
        }
      `}</style>
    </div>
  )
}
