import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, FileBarChart, Settings,
  LogOut, ChevronRight, Users, Bell, Scan, X
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { supabase } from '../lib/supabase'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentModule, user } = useAppStore()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const navItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/' },
    { label: 'Asset Catalog', icon: <Package size={18} />, path: '/items' },
    { label: 'Live QR Scanner', icon: <Scan size={18} />, path: '/scan' },
    { label: 'Personnel Hub', icon: <Users size={18} />, path: '/personnel', adminOnly: true },
    { label: 'Remarks Hub', icon: <Bell size={18} />, path: '/remarks' },
    { label: 'Reports & Analytics', icon: <FileBarChart size={18} />, path: '/reports', adminOnly: true },
    { label: 'Settings', icon: <Settings size={18} />, path: '/settings' },
  ].filter(item => !item.adminOnly || user?.role === 'admin')

  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`} 
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 999,
          display: isOpen ? 'block' : 'none',
          backdropFilter: 'blur(4px)'
        }}
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>

      {/* 🔥 Top Section (Updated UI) */}
      <div
        style={{
          padding: '1.25rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.875rem',
          borderBottom: '1px solid var(--border-color)',
          position: 'relative'
        }}
      >
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.5rem',
            display: 'none'
          }}
          className="sidebar-close-btn"
        >
          <X size={20} />
        </button>

        {/* Brand Logo */}
        <img
          src="/logo.png"
          alt="Smart Invento System"
          style={{
            width: 44,
            height: 44,
            objectFit: 'contain',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.08))',
            flexShrink: 0
          }}
        />

        {/* Brand Title & Module */}
        <div style={{ overflow: 'hidden' }}>
          <h2
            style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              letterSpacing: '-0.02em',
              margin: 0,
              lineHeight: 1.2
            }}
          >
            Smart Invento
          </h2>

          <p
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: '0.2rem 0 0 0'
            }}
          >
            {currentModule} Hub
          </p>
        </div>
      </div>

      {/* 🔹 Navigation */}
      <nav
        style={{
          padding: '2rem 1.5rem',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => { if (window.innerWidth <= 1024) onClose(); }}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.875rem 1.25rem',
              borderRadius: '12px',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: isActive ? 800 : 600,
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              background: isActive ? 'var(--primary-light)' : 'transparent',
              transition: 'all 0.2s',
              border: isActive ? '1px solid var(--primary-light)' : '1px solid transparent'
            })}
          >
            {({ isActive }) => (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)', display: 'flex' }}>
                    {item.icon}
                  </span>
                  {item.label}
                </div>
                {isActive && <ChevronRight size={14} strokeWidth={3} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* 🔻 Logout */}
      <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
        <button
          onClick={handleSignOut}
          className="btn btn-secondary"
          style={{
            width: '100%',
            justifyContent: 'center',
            fontSize: '0.8125rem',
            color: 'var(--danger)',
            borderColor: 'transparent',
            gap: '0.75rem',
            fontWeight: 700
          }}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .sidebar-close-btn { display: flex !important; }
        }
      `}</style>
      </aside>
    </>
  )
}