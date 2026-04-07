import React, { useState, useEffect } from 'react'
import {
  LogIn, Box, ShieldCheck, Mail, Key, User,
  Briefcase, UserPlus, ArrowLeft, Layers,
  ShieldAlert, Settings2, Globe
} from 'lucide-react'
import { supabase } from '../lib/supabase'

export const Login: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [isRegister, setIsRegister] = useState(false)
  const [showEmailLogin, setShowEmailLogin] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [employeeId, setEmployeeId] = useState('')

  // Post-OAuth UI flags
  const [showPostOAuthForm, setShowPostOAuthForm] = useState(false);
  const [oauthInitiated, setOauthInitiated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Detect existing session after redirect and check for profile completeness
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        // If user is logged in but missing employee_id or has the 'MUR-NEW' placeholder, show the post-OAuth form
        const metadataId = user?.user_metadata?.employee_id;
        if (user && (!metadataId || metadataId === 'MUR-NEW' || metadataId === '')) {
          setShowPostOAuthForm(true);
        }
      } catch (e) {
        console.error('Session check failed:', e);
      } finally {
        setCheckingSession(false);
      }
    };
    checkSession();
  }, []);

  // New Choice Fields
  const [selectedRole, setSelectedRole] = useState<'admin' | 'staff'>('staff')
  const [selectedModule, setSelectedModule] = useState<'inventory' | 'spare' | 'both'>('inventory')

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      })
      if (error) throw error
      // Mark that OAuth flow was initiated
      setOauthInitiated(true)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

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
          alert('Signup Successful! You can now log in.')
          setIsRegister(false)
        }
      } else {
        console.log('Signing in user:', email)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err: any) {
      console.error('Auth Error:', err)
      setError(err.message || 'An unexpected failure occurred during authentication.')
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
          width: 340px;              /* ⬅️ Bigger */
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

        .divider {
          margin: 1.25rem 0;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }

        .divider-text {
          font-size: 0.7rem;
          color: #94a3b8;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
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

        .google-btn {
          width: 100%;
          height: 52px;
          border: 1.5px solid #e2e8f0;
          background: white;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          color: #1e293b;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          margin-bottom: 0.5rem;
        }

        .google-btn:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #cbd5e1;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }

        .google-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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
        <p className="branding-tagline">Integrated Security & Asset Intelligence.
        </p>
      </div>

      {/* RIGHT SIDE - LOGIN/REGISTER */}
      <div className="login-section">
        <div className="login-card">
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a' }}>
              {showPostOAuthForm ? 'Registry Finalization' : (isRegister ? 'Personnel Registry' : 'Welcome Portal')}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
              {showPostOAuthForm ? 'Link your corporate credentials' : (isRegister ? 'Authorize your workspace access' : 'Enter your credentials to proceed')}
            </p>
          </div>

          {error && <div className="error-p"><ShieldAlert size={16} />{error}</div>}

          {checkingSession && (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 700 }}>Synchronizing Security Protocols...</p>
            </div>
          )}

          {/* Google OAuth button */}
          {!isRegister && !showEmailLogin && !showPostOAuthForm && !checkingSession && (
            <>
              <button className="google-btn" onClick={handleGoogleLogin} disabled={loading}>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" alt="Google" />
                {loading ? 'Authenticating...' : 'Sign in with Google OAuth'}
              </button>
              <div className="divider">
                <div className="divider-line"></div>
                <span className="divider-text">Or</span>
                <div className="divider-line"></div>
              </div>
            </>
          )}

          {/* Post-OAuth data collection form */}
          {showPostOAuthForm && (
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                const user = (await supabase.auth.getUser()).data.user;
                if (!user) throw new Error('User not found after OAuth');
                await supabase.auth.updateUser({
                  data: {
                    employee_id: employeeId,
                    role: selectedRole,
                    preferred_module: selectedModule,
                  },
                });

                // Also update the public profiles table for persistence and App.tsx sync
                const { error: profileError } = await supabase
                  .from('profiles')
                  .update({
                    employee_id: employeeId,
                    role: selectedRole,
                    preferred_module: selectedModule,
                  })
                  .eq('id', user.id);

                if (profileError) throw profileError;

                // Reset flags and update local app store/state
                setShowPostOAuthForm(false);
                alert('Profile updated successfully! Welcome to the hub.');
                // Trigger a page reload or state update to let App.tsx re-fetch
                window.location.reload(); 
              } catch (err: any) {
                setError(err.message);
              } finally {
                setLoading(false);
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-in">
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Registry ID</label>
                  <input type="text" className="input-field" placeholder="MUR-XXX" value={employeeId} onChange={e => setEmployeeId(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Identify Authorization Level</label>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button type="button" className={`choice-btn ${selectedRole === 'admin' ? 'active' : ''}`} onClick={() => setSelectedRole('admin')}>
                      <Globe size={18} /> <span>Admin</span>
                    </button>
                    <button type="button" className={`choice-btn ${selectedRole === 'staff' ? 'active' : ''}`} onClick={() => setSelectedRole('staff')}>
                      <Briefcase size={18} /> <span>Staff</span>
                    </button>
                  </div>
                </div>
              </div>
              {/* Module selection for staff */}
              {selectedRole === 'staff' && (
                <div className="animate-fade-in" style={{ marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.6rem', display: 'block' }}>Select Domain Allocation</label>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button type="button" className={`choice-btn ${selectedModule === 'inventory' ? 'active' : ''}`} onClick={() => setSelectedModule('inventory')}>
                      <Box size={18} /> <span>Inventory</span>
                    </button>
                    <button type="button" className={`choice-btn ${selectedModule === 'spare' ? 'active' : ''}`} onClick={() => setSelectedModule('spare')}>
                      <Layers size={18} /> <span>Spare</span>
                    </button>
                    <button type="button" className={`choice-btn ${selectedModule === 'both' ? 'active' : ''}`} onClick={() => setSelectedModule('both')}>
                      <Box size={18} /> <span>Both Areas</span>
                    </button>
                  </div>
                </div>
              )}
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', height: 44, justifyContent: 'center' }}>
                {loading ? 'Saving...' : 'Complete Profile'}
              </button>
            </form>
          )}

          {(!showEmailLogin && !isRegister && !showPostOAuthForm && !checkingSession) ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button onClick={() => setShowEmailLogin(true)} className="btn btn-secondary" style={{ width: '100%', height: 48, justifyContent: 'center' }}>
                <Key size={18} /> Password Authorization
              </button>
              <button onClick={() => setIsRegister(true)} style={{ background: 'none', border: 'none', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', cursor: 'pointer', marginTop: '1rem' }}>
                New Personnel? Initiate Registry Access
              </button>
            </div>
          ) : (
            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', textAlign: 'left' }} className="animate-fade-in">
              <button onClick={() => { setIsRegister(false); setShowEmailLogin(false); }} type="button" style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 700, marginBottom: '0.5rem' }}>
                <ArrowLeft size={14} /> Back to portal options
              </button>

              {isRegister && (
                <>
                  <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '0.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Name</label>
                      <input type="text" className="input-field" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Registry ID</label>
                      <input type="text" className="input-field" placeholder="MUR-XXX" value={employeeId} onChange={e => setEmployeeId(e.target.value)} required />
                    </div>
                  </div>

                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.6rem', display: 'block' }}>Identify Authorization Level</label>
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
                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.6rem', display: 'block' }}>Select Domain Allocation</label>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button type="button" className={`choice-btn ${selectedModule === 'inventory' ? 'active' : ''}`} onClick={() => setSelectedModule('inventory')}>
                          <Box size={18} /> <span>Inventory</span>
                        </button>
                        <button type="button" className={`choice-btn ${selectedModule === 'spare' ? 'active' : ''}`} onClick={() => setSelectedModule('spare')}>
                          <Layers size={18} /> <span>Spare</span>
                        </button>
                        <button type="button" className={`choice-btn ${selectedModule === 'both' ? 'active' : ''}`} onClick={() => setSelectedModule('both')}>
                          <Box size={18} /> <span>Both Areas</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Corporate Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
                  <input type="email" className="input-field" placeholder="email@murugappa.com" value={email} onChange={e => setEmail(e.target.value)} style={{ paddingLeft: '2.5rem' }} required />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Secure Password</label>
                <div style={{ position: 'relative' }}>
                  <Key size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
                  <input type="password" className="input-field" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingLeft: '2.5rem' }} required />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', height: 50, justifyContent: 'center', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                {loading ? 'Processing...' : isRegister ? <><UserPlus size={18} /> Complete Registry</> : <><LogIn size={18} /> Authorize Session</>}
              </button>

              {isRegister && (
                <p style={{ textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>
                  *Admin registration grants global dashboard intelligence.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
