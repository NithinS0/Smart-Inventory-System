import React from 'react'
import { Package, Recycle, ArrowRight, Boxes } from 'lucide-react'
import { useAppStore, Module } from '../store/useAppStore'

export const ModuleSelection: React.FC = () => {
  const { setModule, user } = useAppStore()

  React.useEffect(() => {
    if (user?.role === 'staff' && user.preferred_module && user.preferred_module !== 'both') {
      setModule(user.preferred_module as Module)
    }
  }, [user, setModule])

  const handleModuleSelect = (module: Module) => {
    setModule(module)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem'
      }}
    >
      {/* Platform Header */}
      <div style={{ textAlign: 'center', maxWidth: 640, marginBottom: '3.5rem' }}>

        {/* Brand Logo */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <img
            src="/logo.png"
            alt="Smart Invento System Logo"
            style={{
              width: 96,
              height: 96,
              objectFit: 'contain',
              filter: 'drop-shadow(0 12px 24px rgba(37, 99, 235, 0.25))'
            }}
          />
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '2.25rem',
            fontWeight: 900,
            marginBottom: '0.75rem',
            color: '#0f172a',
            letterSpacing: '-0.02em'
          }}
        >
          Smart Invento Asset Hub
        </h1>

        {/* Subtitle */}
        <p
          style={{
            color: '#64748b',
            fontSize: '1.05rem',
            fontWeight: 500,
            lineHeight: 1.5
          }}
        >
          Welcome authorized personnel. Please select a specialized inventory workspace to begin your session.
        </p>
      </div>

      {/* 🔹 Module Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem',
          width: '100%',
          maxWidth: 1000
        }}
      >
        {[
          {
            id: 'inventory' as Module,
            title: 'Inventory Center',
            desc: 'General assets, operational supplies, and equipment tracking.',
            icon: <Package size={48} />,
            color: '#2563eb'
          },
          {
            id: 'spare' as Module,
            title: 'Spare Parts Hub',
            desc: 'Machine components, specialized tools, and maintenance stock.',
            icon: <Recycle size={48} />,
            color: '#f97316'
          }
        ].map((module) => (
          <button
            key={module.id}
            onClick={() => handleModuleSelect(module.id)}
            style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '24px',
              padding: '3rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)'
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
              e.currentTarget.style.borderColor = module.color
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0,0,0,0.1)'
              e.currentTarget.style.borderColor = '#e2e8f0'
            }}
          >
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: `${module.color}10`,
                color: module.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '2rem'
              }}
            >
              {module.icon}
            </div>

            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: '0.75rem'
              }}
            >
              {module.title}
            </h2>

            <p
              style={{
                color: '#64748b',
                fontSize: '0.875rem',
                lineHeight: 1.6,
                marginBottom: '2.5rem'
              }}
            >
              {module.desc}
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 700,
                color: module.color,
                fontSize: '0.875rem'
              }}
            >
              Launch Workspace <ArrowRight size={18} />
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <p
        style={{
          marginTop: '5rem',
          fontSize: '0.75rem',
          color: '#94a3b8',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em'
        }}
      >
        Enterprise Security • Authorized Personnel Only
      </p>
    </div>
  )
}