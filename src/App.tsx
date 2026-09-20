import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { supabase } from './lib/supabase'
import { useAppStore } from './store/useAppStore'

// Layout & Navigation
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'

// Core Functional Pages
import { Dashboard } from './pages/Dashboard'
import { ItemList } from './pages/ItemList'
import { QRScanner } from './pages/QRScanner'
import { Reports } from './pages/Reports'
import { Settings } from './pages/Settings'
import { PersonnelHub } from './pages/PersonnelHub'
import { RemarksHub } from './pages/RemarksHub'

// Auth Pages
import { Login } from './pages/Login'
import { ModuleSelection } from './pages/ModuleSelection'

const App: React.FC = () => {
  const { user, setUser, currentModule, setModule } = useAppStore()
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)
  const location = useLocation()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (error) {
              console.error('Profile fetch error during boot:', error);
              // Fallback to minimal identity if profile is currently unreachable
              setUser({ id: session.user.id, email: session.user.email!, name: 'Personnel', employee_id: '', phone: '', role: 'staff' });
            } else if (data) {
              setUser({
                id: session.user.id,
                email: session.user.email!,
                name: data.name,
                employee_id: data.employee_id,
                phone: data.phone,
                role: data.role,
                preferred_module: data.preferred_module || 'inventory'
              })
            }
          })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // On every fresh sign-in, force Module Selection screen
        if (event === 'SIGNED_IN') {
          setModule(null)
        }
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (error) {
              console.error('Profile fetch error after auth change:', error);
              setUser({ id: session.user.id, email: session.user.email!, name: 'Personnel', employee_id: '', phone: '', role: 'staff' });
            } else if (data) {
              setUser({
                id: session.user.id,
                email: session.user.email!,
                name: data.name,
                employee_id: data.employee_id,
                phone: data.phone,
                role: data.role,
                preferred_module: data.preferred_module || 'inventory'
              })
            }
          })
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard'
      case '/items': return 'Asset Catalog'
      case '/personnel': return 'Personnel Hub'
      case '/reports': return 'Reports & Analytics'
      case '/settings': return 'Profile Settings'
      case '/scan': return 'Scan QR Code'
      default: return 'Smart Invento Hub'
    }
  }

  // Logic: User must be authenticated AND have a valid registry ID (not the default 'MUR-NEW' from the trigger)
  // to pass beyond the login/onboarding phase.
  const isProfileIncomplete = user && (!user.employee_id || user.employee_id === 'MUR-NEW' || user.employee_id === '');
  
  if (!user || isProfileIncomplete) return <Login />

  if (!currentModule) return <ModuleSelection />

  return (
    <div className={`app-layout ${isSidebarOpen ? 'sidebar-open' : ''}`} data-module={currentModule}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="main-content">
        <Header title={getPageTitle()} onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="content-body animate-fade-in">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/items" element={<ItemList />} />
            <Route path="/scan" element={<QRScanner />} />
            {user?.role === 'admin' && <Route path="/reports" element={<Reports />} />}
            <Route path="/settings" element={<Settings />} />
            {user?.role === 'admin' && <Route path="/personnel" element={<PersonnelHub />} />}
            <Route path="/remarks" element={<RemarksHub />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
