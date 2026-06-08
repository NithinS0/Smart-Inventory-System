import React, { useState } from 'react'
import {
  LogIn, Box, ShieldCheck, Mail, Key, User,
  Briefcase, UserPlus, Layers,
  ShieldAlert, Globe
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export const Login: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [isRegister, setIsRegister] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [employeeId, setEmployeeId] = useState('')

  // Selected Options
  const [selectedRole, setSelectedRole] = useState<'admin' | 'staff'>('staff')
  const [selectedModule, setSelectedModule] = useState<'inventory' | 'spare' | 'both'>('inventory')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isRegister) {
        console.log('Registering user:', email)
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              employee_id: employeeId,
              role: selectedRole,
              preferred_module: selectedModule
            }
          }
        })

        if (error) throw error
        if (data?.user?.identities?.length === 0) {
          setError("User already exists. Try logging in.")
        } else {
          alert('Registration successful! You can now log in.')
          setIsRegister(false)
          // Reset form fields
          setEmail('')
          setPassword('')
          setName('')
          setEmployeeId('')
        }
      } else {
        console.log('Signing in user:', email)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err: any) {
      console.error('Auth Error:', err)
      setError(err.message || 'An unexpected error occurred during authentication.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page-wrapper">
      <style>{`
        .login-page-wrapper {
          min-height: 100vh;
          display: flex;
          background: #ffffff;
        }

        .branding-section {
          flex: 1.2;
          background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem;
          position: relative;
          overflow: hidden;
        }

        .branding-illustration {
          position: absolute;
          inset: 0;
          opacity: 0.15;
          object-fit: cover;
          width: 100%;
          height: 100%;
          filter: grayscale(100%) brightness(1.2);
        }

        .branding-content {
          position: relative;
          z-index: 10;
          text-align: center;
          max-width: 500px;
          text-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .branding-logo-box {
          width: 340px;              
          height: 160px;
          background: white;
          border-radius: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2.5rem;
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.25);
          border: 1px solid rgba(255, 255, 255, 0.4);
          padding: 1rem;
        }

        .branding-title {
          font-size: 2.5rem;
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 1rem;
          letter-spacing: -0.02em;
        }

        .branding-tagline {
          font-size: 1.125rem;
          font-weight: 500;
          opacity: 0.8;
          max-width: 400px;
          margin: 0 auto;
        }

        .login-section {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          padding: 2rem;
          overflow-y: auto;
        }

        .login-card {
          width: 100%;
          max-width: 480px;
          background: white;
          padding: 3rem;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.08);
          border: 1px solid #e2e8f0;
          text-align: center;
        }

        .choice-btn {
          flex: 1;
          padding: 0.75rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          background: white;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          color: #64748b;
        }

        .choice-btn.active {
          border-color: var(--primary);
          background: #eff6ff;
          color: var(--primary);
        }

        .error-p {
          padding: 0.75rem 1rem;
          background: #fff1f2;
          color: #e11d48;
          border-radius: 10px;
          font-size: 0.8125rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        @media (max-width: 960px) {
          .login-page-wrapper { flex-direction: column; }
          .branding-section { flex: 0; padding: 2.5rem; }
          .login-card { padding: 2rem; border: none; box-shadow: none; background: transparent; }
        }
      `}</style>

      {/* LEFT SIDE - BRANDING */}
      <div className="branding-section">
        <img src="/inventory_illustration.png" alt="Illustration" className="branding-illustration" />
        <div className="branding-logo-box">
          <img src="/murugappa_logo.png" alt="Murugappa" style={{ width: '100%', height: '120%', objectFit: 'contain' }} />
        </div>
        <h1 className="branding-title">Murugappa Smart Inventory</h1>
        <p className="branding-tagline">Smart Inventory & Spare Parts Management.</p>
      </div>

      {/* RIGHT SIDE - LOGIN/REGISTER */}
      <div className="login-section">
        <div className="login-card">
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a' }}>
              {isRegister ? 'Register' : 'Sign In'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
              {isRegister ? 'Create your employee account' : 'Enter your email and password to log in'}
            </p>
          </div>

          {error && <div className="error-p"><ShieldAlert size={16} />{error}</div>}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', textAlign: 'left' }} className="animate-fade-in">
            {isRegister && (
              <>
                <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Name</label>
                    <input type="text" className="input-field" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Employee ID</label>
                    <input type="text" className="input-field" placeholder="MUR-XXX" value={employeeId} onChange={e => setEmployeeId(e.target.value)} required />
                  </div>
                </div>

                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.6rem', display: 'block' }}>Select Role</label>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button type="button" className={`choice-btn ${selectedRole === 'admin' ? 'active' : ''}`} onClick={() => setSelectedRole('admin')}>
                      <Globe size={18} /> <span>Admin</span>
                    </button>
                    <button type="button" className={`choice-btn ${selectedRole === 'staff' ? 'active' : ''}`} onClick={() => setSelectedRole('staff')}>
                      <Briefcase size={18} /> <span>Staff</span>
                    </button>
                  </div>
                </div>

                {selectedRole === 'staff' && (
                  <div className="animate-fade-in" style={{ marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.6rem', display: 'block' }}>Select Workspace</label>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button type="button" className={`choice-btn ${selectedModule === 'inventory' ? 'active' : ''}`} onClick={() => setSelectedModule('inventory')}>
                        <Box size={18} /> <span>Inventory</span>
                      </button>
                      <button type="button" className={`choice-btn ${selectedModule === 'spare' ? 'active' : ''}`} onClick={() => setSelectedModule('spare')}>
                        <Layers size={18} /> <span>Spare</span>
                      </button>
                      <button type="button" className={`choice-btn ${selectedModule === 'both' ? 'active' : ''}`} onClick={() => setSelectedModule('both')}>
                        <Box size={18} /> <span>Both</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
                <input type="email" className="input-field" placeholder="email@murugappa.com" value={email} onChange={e => setEmail(e.target.value)} style={{ paddingLeft: '2.5rem' }} required />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Key size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
                <input type="password" className="input-field" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingLeft: '2.5rem' }} required />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', height: 50, justifyContent: 'center', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              {loading ? 'Processing...' : isRegister ? <><UserPlus size={18} /> Create Account</> : <><LogIn size={18} /> Sign In</>}
            </button>

            {isRegister && (
              <p style={{ textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>
                *Admin role provides full access to the dashboard and analytics.
              </p>
            )}
          </form>

          <div style={{ marginTop: '2rem' }}>
            <button 
              onClick={() => { setIsRegister(!isRegister); setError(null); }} 
              style={{ background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', cursor: 'pointer' }}
            >
              {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
