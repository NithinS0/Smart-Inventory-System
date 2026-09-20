import React, { useState, useEffect } from 'react'
import { User, Mail, Phone, Briefcase, ShieldCheck, Save, Edit2, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'

export const Settings: React.FC = () => {
  const { user, setUser } = useAppStore()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    employee_id: user?.employee_id || ''
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        employee_id: user.employee_id || ''
      })
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setLoading(true)
    setMessage(null)
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          phone: formData.phone,
          employee_id: formData.employee_id
        })
        .eq('id', user.id)

      if (error) throw error

      setUser({ ...user, ...formData })
      setIsEditing(false)
      setMessage({ type: 'success', text: 'Professional profile synchronized successfully.' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  // Check if user is using Google OAuth
  const isGoogleUser = user?.email?.includes('@gmail.com') || false // Simplified check for demonstration

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Personnel Settings</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, marginTop: '0.5rem' }}>Manage your authorized registry identity and security protocols.</p>
        </div>
        {!isEditing ? (
          <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
            <Edit2 size={16} /> Edit My Identity
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
             <button className="btn btn-secondary" onClick={() => setIsEditing(false)} disabled={loading}>Cancel</button>
             <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
               <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
             </button>
          </div>
        )}
      </div>

      {message && (
        <div style={{ 
          padding: '1.25rem', 
          borderRadius: '12px', 
          background: message.type === 'success' ? '#f0fdf4' : '#fff1f2', 
          border: `1px solid ${message.type === 'success' ? '#dcfce7' : '#fecdd3'}`,
          color: message.type === 'success' ? '#16a34a' : '#e11d48',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.875rem',
          fontWeight: 700
        }}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1" style={{ gap: '2rem' }}>
        {/* PERSONAL INFORMATION */}
        <div className="card">
          <h3 style={{ fontSize: '0.875rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '2rem' }}>
             Personal Registry Data
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             <div className="grid grid-cols-2">
                <div>
                  <label className="input-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                    <input 
                      type="text" className="input-field" value={formData.name} readOnly={!isEditing}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      style={{ paddingLeft: '2.5rem', background: !isEditing ? 'var(--bg-app)' : 'white' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="input-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Authorized Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                    <input 
                      type="text" className="input-field" value={user?.email || ''} readOnly
                      style={{ paddingLeft: '2.5rem', background: 'var(--bg-app)', cursor: 'not-allowed' }}
                    />
                  </div>
                </div>
             </div>

             <div className="grid grid-cols-2">
                <div>
                  <label className="input-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Contact Pulse (Phone)</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                    <input 
                      type="text" className="input-field" value={formData.phone} readOnly={!isEditing}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      style={{ paddingLeft: '2.5rem', background: !isEditing ? 'var(--bg-app)' : 'white' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="input-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Registry ID (Employee ID)</label>
                  <div style={{ position: 'relative' }}>
                    <Briefcase size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                    <input 
                      type="text" className="input-field" value={formData.employee_id} readOnly={!isEditing}
                      onChange={e => setFormData({ ...formData, employee_id: e.target.value })}
                      style={{ paddingLeft: '2.5rem', background: !isEditing ? 'var(--bg-app)' : 'white' }}
                    />
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* SECURITY & AUTHENTICATION */}
        <div className="card">
           <h3 style={{ fontSize: '0.875rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '2rem' }}>
              Security & Credential Protocols
           </h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             <div style={{ padding: '1.5rem', borderRadius: '12px', background: '#f8fafc', border: '1px solid var(--border-color)', display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'white', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                   <ShieldCheck size={24} />
                </div>
                <div>
                   <h4 style={{ fontSize: '0.925rem', fontWeight: 800, marginBottom: '0.25rem' }}>Authentication Stream</h4>
                   {isGoogleUser ? (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                         Your identity and password protocols are currently managed via your <strong>Google Corporate Account</strong>. 
                         Security configurations must be adjusted within your Google Admin portal.
                      </p>
                   ) : (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                         You are currently utilizing a <strong>Standard System Password</strong>. Password rotation and specialized 
                         2FA protocols are enforced by the Enterprise Smart Registry Security Engine.
                      </p>
                   )}
                </div>
             </div>

             {!isGoogleUser && (
               <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                 <h4 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <Edit2 size={14} /> Rotate Security Credential (Change Password)
                 </h4>
                 <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                   <div>
                     <label className="input-label" style={{ fontSize: '0.65rem' }}>New Secure Password</label>
                     <input 
                       type="password" 
                       className="input-field" 
                       placeholder="••••••••"
                       id="new-password"
                     />
                   </div>
                   <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                     <button 
                       className="btn btn-secondary" 
                       style={{ width: '100%', justifyContent: 'center' }}
                       onClick={async () => {
                         const pwd = (document.getElementById('new-password') as HTMLInputElement).value;
                         if (!pwd || pwd.length < 6) {
                           setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
                           return;
                         }
                         setLoading(true);
                         try {
                           const { error } = await supabase.auth.updateUser({ password: pwd });
                           if (error) throw error;
                           setMessage({ type: 'success', text: 'Security credential rotated successfully.' });
                           (document.getElementById('new-password') as HTMLInputElement).value = '';
                         } catch (err: any) {
                           setMessage({ type: 'error', text: err.message });
                         } finally {
                           setLoading(false);
                         }
                       }}
                       disabled={loading}
                     >
                       Update Password
                     </button>
                   </div>
                 </div>
               </div>
             )}
           </div>
        </div>

        {/* SYSTEM STATUS */}
        <div className="card" style={{ background: 'var(--primary)', color: 'white', border: 'none' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                 <h4 style={{ fontWeight: 800, fontSize: '1.125rem' }}>Workspace Access Verified</h4>
                 <p style={{ opacity: 0.8, fontSize: '0.8125rem', marginTop: '0.25rem' }}>Authorized System Role: <span style={{ fontWeight: 900, textTransform: 'uppercase' }}>{user?.role}</span></p>
              </div>
              <ShieldCheck size={32} style={{ opacity: 0.4 }} />
           </div>
        </div>
      </div>
    </div>
  )
}
