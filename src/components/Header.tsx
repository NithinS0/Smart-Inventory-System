import React, { useState, useEffect, useRef } from 'react'
import { 
  Bell, Search, RefreshCw, User, Settings, 
  ChevronDown, LogOut, Shield, AlertTriangle, MessageSquare, CheckCircle2, Package,
  Menu, X
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface HeaderProps {
  title: string
  onMenuClick: () => void
}

export const Header: React.FC<HeaderProps> = ({ title, onMenuClick }) => {
  const { user, currentModule, setModule } = useAppStore()
  const navigate = useNavigate()
  
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [alerts, setAlerts] = useState<{ id: string; type: 'low_stock' | 'remark'; title: string; body: string; time: Date; read: boolean }[]>([])
  const alertChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const fetchAlerts = async () => {
    const newAlerts: typeof alerts = []

    // 1. Low stock alerts (all roles see their module's)
    const { data: stockAlerts } = await supabase
      .from('low_stock_alerts')
      .select('*')
      .eq('resolved', false)
      .eq('module', currentModule || 'inventory')
      .order('created_at', { ascending: false })
      .limit(10)

    stockAlerts?.forEach(a => newAlerts.push({
      id: a.id, type: 'low_stock',
      title: `Low Stock: ${a.item_name}`,
      body: `Only ${a.quantity} units remaining (threshold: ${a.threshold})`,
      time: new Date(a.created_at), read: false
    }))

    // 2. Staff remarks — only admins see these
    if (user?.role === 'admin') {
      const { data: remarks } = await supabase
        .from('stock_transactions')
        .select('id, item_id, remarks, timestamp, profiles(name)')
        .eq('action', 'remark')
        .order('timestamp', { ascending: false })
        .limit(10)

      remarks?.forEach((r: any) => newAlerts.push({
        id: r.id, type: 'remark',
        title: `Remark from ${r.profiles?.name || 'Staff'}`,
        body: `Item ${r.item_id}: ${r.remarks}`,
        time: new Date(r.timestamp), read: false
      }))
    }

    // Sort by time descending
    newAlerts.sort((a, b) => b.time.getTime() - a.time.getTime())
    setAlerts(newAlerts)
  }

  useEffect(() => {
    if (!user) return
    fetchAlerts()

    // Real-time subscription for low stock
    const channel = supabase.channel('header-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'low_stock_alerts' }, () => fetchAlerts())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stock_transactions', filter: 'action=eq.remark' }, () => {
        if (user?.role === 'admin') fetchAlerts()
      })
      .subscribe()

    alertChannelRef.current = channel
    return () => { channel.unsubscribe() }
  }, [user, currentModule])

  const unreadCount = alerts.filter(a => !a.read).length
  const markAllRead = () => setAlerts(prev => prev.map(a => ({ ...a, read: true })))

  const sendLowStockEmail = async (alert: typeof alerts[0]) => {
    // Trigger Supabase Edge Function for email (if configured)
    await supabase.functions.invoke('send-low-stock-email', {
      body: { item: alert.title, details: alert.body }
    }).catch(() => {}) // graceful fail if edge fn not deployed
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <header className="header" style={{ position: 'relative', zIndex: 100 }}>
      {/* LEFT SIDE - TITLE & MODULE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <button 
          className="btn-icon-md mobile-menu-btn" 
          onClick={onMenuClick}
          style={{ display: 'none' }}
        >
          <Menu size={20} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{title}</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-app)', padding: '0.4rem 0.8rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Active Core:</span>
          <span className={`badge ${currentModule === 'inventory' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '0.65rem', padding: '0.2rem 0.6rem', fontWeight: 900 }}>{currentModule?.toUpperCase()}</span>
          <button 
            onClick={() => setModule(null)}
            className="btn-icon-sm"
            title="Switch Workspace Module"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* RIGHT SIDE - ACTIONS & PROFILE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        
        {/* Global Search & Notifications */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
           <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
             <Search 
              size={18} 
              style={{ position: 'absolute', left: 12, color: 'var(--text-muted)', zIndex: 1 }} 
             />
             <input 
              type="text" 
              placeholder="Global Intelligence Search..." 
              className="global-search-input"
              style={{ 
                padding: '0.6rem 1rem 0.6rem 2.75rem', 
                borderRadius: '12px', 
                border: '1px solid var(--border-color)', 
                fontSize: '0.8125rem',
                width: '180px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: '#f8fafc'
              }}
              onFocus={(e) => e.currentTarget.style.width = '300px'}
              onBlur={(e) => e.currentTarget.style.width = '180px'}
             />
           </div>
           
           <div style={{ position: 'relative' }}>
             <button 
              className="btn-icon-md" 
              onClick={() => { setShowNotifications(!showNotifications); markAllRead(); }}
              title="System Alerts"
             >
               <Bell size={18} />
               {unreadCount > 0 && (
                 <div style={{ position: 'absolute', top: 6, right: 6, minWidth: 16, height: 16, background: 'var(--danger)', borderRadius: '8px', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 900, color: 'white', padding: '0 2px' }}>
                   {unreadCount > 9 ? '9+' : unreadCount}
                 </div>
               )}
             </button>

             {showNotifications && (
               <>
                 <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setShowNotifications(false)} />
                 <div className="card shadow-lg animate-fade-in" style={{ position: 'absolute', top: '120%', right: 0, width: 360, padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)', zIndex: 999 }}>
                   <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                     <span style={{ fontWeight: 800, fontSize: '0.8125rem' }}>Live Alerts</span>
                     <button onClick={fetchAlerts} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                       <RefreshCw size={13} />
                     </button>
                   </div>
                   <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                     {alerts.length === 0 ? (
                       <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                         <CheckCircle2 size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                         <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>All systems nominal</p>
                       </div>
                     ) : alerts.map(alert => (
                       <div key={alert.id} style={{ padding: '0.875rem 1.25rem', display: 'flex', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', background: alert.read ? 'transparent' : '#fefce8' }}>
                         {alert.type === 'low_stock'
                           ? <AlertTriangle size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
                           : <MessageSquare size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                         }
                         <div style={{ flex: 1, minWidth: 0 }}>
                           <div style={{ fontSize: '0.75rem', fontWeight: 800, color: alert.type === 'low_stock' ? 'var(--danger)' : 'var(--primary)' }}>{alert.title}</div>
                           <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.body}</div>
                           <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.25rem' }}>{alert.time.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
                         </div>
                         {alert.type === 'low_stock' && (
                           <Package size={14} color="var(--danger)" style={{ flexShrink: 0, opacity: 0.5 }} />
                         )}
                       </div>
                     ))}
                   </div>
                   <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem' }}>
                     <button onClick={() => { navigate('/remarks'); setShowNotifications(false); }} style={{ flex: 1, padding: '0.5rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                       View Remarks Hub
                     </button>
                   </div>
                 </div>
               </>
             )}
           </div>
        </div>
        
        <div style={{ width: 1, height: 28, background: 'var(--border-color)', margin: '0 0.25rem' }}></div>
        
        {/* User Identity Profile */}
        <div style={{ position: 'relative' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.2 }}>{user?.name || 'Personnel'}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'capitalize' }}>
                Role: <span style={{ color: user?.role === 'admin' ? 'var(--danger)' : 'var(--primary)' }}>{user?.role}</span> • ID: {user?.employee_id || 'MUR-XXXX'}
              </div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: '14px', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', color: 'var(--text-muted)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <User size={22} />
            </div>
            <ChevronDown size={14} color="var(--text-muted)" style={{ transform: showUserMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>

          {showUserMenu && (
            <>
              <div 
                style={{ position: 'fixed', inset: 0, zIndex: 998 }} 
                onClick={() => setShowUserMenu(false)}
              ></div>
              <div className="card shadow-lg animate-fade-in" style={{ position: 'absolute', top: '120%', right: 0, width: 220, padding: '0.5rem', border: '1px solid var(--border-color)', zIndex: 999 }}>
                <button 
                  className="menu-item" 
                  onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                >
                  <Settings size={16} /> Identity Settings
                </button>
                {user?.role === 'admin' && (
                  <button 
                    className="menu-item" 
                    onClick={() => { navigate('/personnel'); setShowUserMenu(false); }}
                  >
                    <Shield size={16} /> Personnel Hub
                  </button>
                )}
                <div style={{ height: 1, background: '#f1f5f9', margin: '0.5rem 0' }}></div>
                <button 
                  className="menu-item" 
                  onClick={handleLogout}
                  style={{ color: 'var(--danger)' }}
                >
                  <LogOut size={16} /> Terminate Session
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .btn-icon-md {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          background: white;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-icon-md:hover {
          background: #f8fafc;
          border-color: var(--primary);
          color: var(--primary);
          transform: translateY(-1px);
        }
        .btn-icon-sm {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 0.25rem 0.4rem;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-icon-sm:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
        .menu-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border: none;
          background: transparent;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        }
        .menu-item:hover {
          background: #f1f5f9;
          color: var(--primary);
        }
        @media (max-width: 1024px) {
          .mobile-menu-btn { display: flex !important; border: none; background: transparent; padding: 0.5rem; }
          .global-search-input { display: none; }
        }
      `}</style>
    </header>
  )
}
