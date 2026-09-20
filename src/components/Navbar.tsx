import React from 'react'
import { LogOut, LayoutGrid, User, Shield } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { supabase } from '../lib/supabase'

export const Navbar: React.FC = () => {
  const { currentModule, user, setModule, logout } = useAppStore()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
  }

  return (
    <nav className="glass-card" style={{ 
      margin: '1rem', 
      padding: '0.75rem 1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: '1rem',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <img src="/logo.png" alt="Smart Invento" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)' }}>
            SMART <span style={{ fontWeight: 300, color: 'var(--text-main)' }}>INVENTO</span>
          </div>
        </div>
        
        {currentModule && (
          <button 
            className="btn-outline" 
            onClick={() => setModule(null)}
            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <LayoutGrid size={18} />
            Switch Module
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-color)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.email.split('@')[0]}</span>
              <span className={`badge badge-${user.role === 'admin' ? 'blue' : 'gray'}`} style={{ fontSize: '0.7rem' }}>
                {user.role}
              </span>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} />
            </div>
          </div>
        )}
        
        <button className="btn-outline" onClick={handleLogout} style={{ color: '#ef4444', borderColor: '#fee2e2' }}>
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  )
}
