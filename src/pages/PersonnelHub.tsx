import React, { useEffect, useState } from 'react'
import { 
  Users, Search, ShieldCheck, Mail, Briefcase, 
  ChevronRight, Calendar, UserCheck, AlertCircle,
  Database, ArrowUpDown, MoreHorizontal, UserPlus, 
  Trash2, Filter, Key, CheckCircle2, X
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAppStore, UserRole } from '../store/useAppStore'
import { formatDistanceToNow, format } from 'date-fns'

interface Profile {
  id: string
  email: string
  name: string
  employee_id: string
  role: UserRole
  created_at: string
}

interface AllowedUser {
  email: string
  role: UserRole
}

interface AuditLog {
  id: string
  admin_id: string
  target_user_id: string
  action: string
  old_value: string
  new_value: string
  timestamp: string
  admin_email?: string
  target_email?: string
}

export const PersonnelHub: React.FC = () => {
  const { user } = useAppStore()
  const [activeTab, setActiveTab] = useState<'personnel' | 'whitelist'>('personnel')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [allowedUsers, setAllowedUsers] = useState<AllowedUser[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  
  // Whitelist Form State
  const [showAddWhitelist, setShowAddWhitelist] = useState(false)
  const [newWhitelistedEmail, setNewWhitelistedEmail] = useState('')
  const [newWhitelistedRole, setNewWhitelistedRole] = useState<UserRole>('staff')

  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Fetch all profiles
      const { data: profileEntries } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      setProfiles(profileEntries || [])

      // 2. Fetch whitelist
      const { data: whitelistData } = await supabase
        .from('allowed_users')
        .select('*')
        .order('email', { ascending: true })
      setAllowedUsers(whitelistData || [])

      // 3. Fetch admin audit logs with join (email)
      const { data: logEntries } = await supabase
        .from('admin_audit_logs')
        .select('*, admin:profiles!admin_id(email), target:profiles!target_user_id(email)')
        .order('timestamp', { ascending: false })
        .limit(10)
      
      setLogs(logEntries?.map((l: any) => ({
        ...l,
        admin_email: l.admin?.email,
        target_email: l.target?.email
      })) || [])

    } catch (err) {
      console.error('Personnel fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleUpdateRole = async (targetUserId: string, oldRole: string, newRole: UserRole) => {
    if (targetUserId === user?.id) {
       if (!window.confirm("You are changing your OWN role. This may revoke your admin privileges immediately. Proceed?")) return
    }
    
    setUpdatingId(targetUserId)
    try {
      const { error: profileError } = await supabase.from('profiles').update({ role: newRole }).eq('id', targetUserId)
      if (profileError) throw profileError

      // Log the change
      await supabase.from('admin_audit_logs').insert([{
        admin_id: user?.id,
        target_user_id: targetUserId,
        action: 'update_role',
        old_value: oldRole,
        new_value: newRole
      }])

      setProfiles(profiles.map(p => p.id === targetUserId ? { ...p, role: newRole } : p))
      fetchData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleAddWhitelist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWhitelistedEmail) return
    
    try {
      const { error } = await supabase.from('allowed_users').insert([{
        email: newWhitelistedEmail.toLowerCase().trim(),
        role: newWhitelistedRole
      }])
      
      if (error) {
        if (error.code === '23505') throw new Error('Personnel registry already contains this email.')
        throw error
      }
      
      alert(`Invitation protocol initiated for ${newWhitelistedEmail}.\n\nThe member can now securely register their unique identity or sign in using Google OAuth.`)
      
      setShowAddWhitelist(false)
      setNewWhitelistedEmail('')
      fetchData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDeleteWhitelist = async (email: string) => {
    if (!window.confirm(`Revoke authorization for ${email}?`)) return
    
    try {
      const { error } = await supabase.from('allowed_users').delete().eq('email', email)
      if (error) throw error
      fetchData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const filteredProfiles = profiles.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredWhitelist = allowedUsers.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.25rem', color: 'var(--text-main)' }}>Registry Hub</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Command center for biometric identity & authorization protocols.</p>
        </div>
        <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.35rem', borderRadius: '12px' }}>
             <button 
              className={`tab-btn ${activeTab === 'personnel' ? 'active' : ''}`}
              onClick={() => setActiveTab('personnel')}
             >
                <Users size={16} /> Active Personnel
             </button>
             <button 
              className={`tab-btn ${activeTab === 'whitelist' ? 'active' : ''}`}
              onClick={() => setActiveTab('whitelist')}
             >
                <Key size={16} /> Authorized Registry
             </button>
        </div>
      </header>

      <div className="grid grid-cols-1" style={{ gap: '2.5rem' }}>
        {/* MANAGEMENTHUB */}
        <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfcfd' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: 12, color: '#94a3b8' }} />
              <input 
                type="text" className="input-field" placeholder={`Search ${activeTab === 'personnel' ? 'personnel' : 'registry'}...`} 
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.75rem', height: 40, border: 'none', background: 'white', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}
              />
            </div>
            {activeTab === 'whitelist' && (
              <button className="btn btn-primary" onClick={() => setShowAddWhitelist(true)}>
                <UserPlus size={16} /> Authorize New Member
              </button>
            )}
          </div>

          <div className="table-container" style={{ border: 'none' }}>
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Identity Profile</th>
                  <th>{activeTab === 'personnel' ? 'Registry ID' : 'Pre-assigned Layer'}</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeTab === 'personnel' ? (
                  filteredProfiles.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: 44, height: 44, borderRadius: '14px', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                            <ShieldCheck size={20} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.875rem' }}>{p.name || 'Anonymous User'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--primary)', fontSize: '0.75rem' }}>{p.employee_id || 'MUR-PENDING'}</span>
                          <span className={`badge badge-${p.role === 'admin' ? 'danger' : p.role === 'staff' ? 'info' : 'secondary'}`} style={{ textTransform: 'uppercase', fontSize: '0.6rem', padding: '0.1rem 0.4rem', width: 'fit-content' }}>
                            {p.role}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          {(['staff', 'admin'] as UserRole[]).map(r => (
                            <button 
                              key={r} disabled={updatingId === p.id || p.role === r}
                              onClick={() => handleUpdateRole(p.id, p.role, r)}
                              className="btn btn-secondary-sm"
                              style={{ opacity: p.role === r ? 0.3 : 1 }}
                            >
                               {r}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  filteredWhitelist.map((u) => (
                    <tr key={u.email}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                            <Mail size={18} />
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{u.email}</div>
                        </div>
                      </td>
                      <td>
                         <span className={`badge badge-${u.role === 'admin' ? 'danger' : u.role === 'staff' ? 'info' : 'secondary'}`} style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                           {u.role}
                         </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-icon-danger" onClick={() => handleDeleteWhitelist(u.email)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                {loading && <tr><td colSpan={3} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Retrieving personnel records...</td></tr>}
                {!loading && (activeTab === 'personnel' ? filteredProfiles.length : filteredWhitelist.length) === 0 && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No records found in current domain.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* AUDIT LOGS - ONLY FOR PERSONNEL TAB */}
        {activeTab === 'personnel' && (
          <section>
             <h3 style={{ fontSize: '0.8125rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Database size={16} /> Identity Protocol Logs
             </h3>
             <div className="card" style={{ padding: 0 }}>
                {logs.length > 0 ? logs.map((log, i) => (
                  <div key={log.id} style={{ display: 'flex', gap: '1.5rem', padding: '1.25rem 2rem', borderBottom: i === logs.length - 1 ? 'none' : '1px solid #f1f5f9', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                         <div style={{ fontSize: '0.8125rem' }}>
                            <strong style={{ color: 'var(--text-main)' }}>{log.admin_email?.split('@')[0]}</strong> updated <strong style={{ color: 'var(--primary)' }}>{log.target_email?.split('@')[0]}'s</strong> authorization
                         </div>
                         <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            {log.old_value.toUpperCase()} <ArrowUpDown size={10} style={{ display: 'inline', margin: '0 0.4rem' }} /> {log.new_value.toUpperCase()}
                         </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                         <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>{formatDistanceToNow(new Date(log.timestamp))} ago</div>
                      </div>
                  </div>
                )) : (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Security log empty.</div>
                )}
             </div>
          </section>
        )}
      </div>

      {/* ADD WHITELIST MODAL */}
      {showAddWhitelist && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 460, padding: 0 }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ fontSize: '1.25rem', fontWeight: 900 }}>Authorize Registry Entry</h3>
               <button onClick={() => setShowAddWhitelist(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <form onSubmit={handleAddWhitelist} style={{ padding: '2rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="input-label">Personnel Corporate Email</label>
                  <input 
                    type="email" required className="input-field" placeholder="employee@company.com" 
                    value={newWhitelistedEmail} onChange={e => setNewWhitelistedEmail(e.target.value)}
                  />
                </div>
                <div style={{ marginBottom: '2.5rem' }}>
                  <label className="input-label">Authorization Layer (Initial Role)</label>
                  <select className="input-field" value={newWhitelistedRole} onChange={e => setNewWhitelistedRole(e.target.value as UserRole)}>
                    <option value="staff">Staff (Operational Access)</option>
                    <option value="admin">Admin (Full Control)</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: 48, fontSize: '0.9rem' }}>
                  <CheckCircle2 size={18} /> Confirm Authorization
                </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.6rem 1.25rem;
          border: none;
          background: transparent;
          border-radius: 10px;
          font-size: 0.8125rem;
          font-weight: 800;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab-btn.active {
          background: white;
          color: var(--primary);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }
        .btn-secondary-sm {
           padding: 0.4rem 0.6rem;
           font-size: 0.65rem;
           font-weight: 900;
           text-transform: uppercase;
           border: 1px solid var(--border-color);
           background: white;
           border-radius: 6px;
           color: var(--text-muted);
           cursor: pointer;
        }
        .btn-secondary-sm:hover:not(:disabled) {
           border-color: var(--primary);
           color: var(--primary);
        }
        .btn-icon-danger {
           width: 34px;
           height: 34px;
           display: flex;
           align-items: center;
           justify-content: center;
           border-radius: 8px;
           border: none;
           background: #fef2f2;
           color: #ef4444;
           cursor: pointer;
        }
        .btn-icon-danger:hover {
           background: #fee2e2;
        }
      `}</style>
    </div>
  )
}
