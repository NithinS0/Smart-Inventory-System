import React, { useState } from 'react'
import { X, Package, ShieldCheck, Tag, ShoppingCart, Type, Save } from 'lucide-react'

interface FormData {
  name: string
  category: string
  quantity: number
  description: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: FormData) => Promise<void>
  initialData?: FormData
  title: string
}

export const AddItemModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, initialData, title }) => {
  const [formData, setFormData] = useState<FormData>(initialData || { name: '', category: '', quantity: 0, description: '' })
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (err) {
      alert("Error saving record. Check database connectivity.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <form className="card animate-fade-in" onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 520, padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>{title}</h2>
          </div>
          <button type="button" onClick={onClose} style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        
        <div>
          <label className="input-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b' }}>Asset Name / Model</label>
          <div style={{ position: 'relative' }}>
            <Tag size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
            <input 
              type="text" className="input-field" placeholder="e.g. Server Rack A-12" 
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              style={{ paddingLeft: '2.5rem' }} required 
            />
          </div>
        </div>

        <div className="grid grid-cols-2">
          <div>
            <label className="input-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b' }}>Technical Category</label>
            <div style={{ position: 'relative' }}>
              <ShieldCheck size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
              <input 
                type="text" className="input-field" placeholder="Hardware / Component" 
                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                style={{ paddingLeft: '2.5rem' }} required 
              />
            </div>
          </div>
          <div>
            <label className="input-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b' }}>Opening Stock</label>
            <div style={{ position: 'relative' }}>
              <ShoppingCart size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
              <input 
                type="number" className="input-field" value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                style={{ paddingLeft: '2.5rem' }} min="0" required 
              />
            </div>
          </div>
        </div>

        <div>
          <label className="input-label" style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b' }}>Registry Description</label>
          <div style={{ position: 'relative' }}>
            <Type size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
            <textarea 
              className="input-field" rows={3} placeholder="Functional overview, specifications or maintenance instructions..." 
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
              style={{ paddingLeft: '2.5rem', resize: 'none', paddingTop: '10px' }}
            />
          </div>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1, height: 44, justifyContent: 'center' }}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2, height: 44, justifyContent: 'center' }}>
            <Save size={16} /> {loading ? 'Processing...' : initialData ? 'Save Changes' : 'Save Record'}
          </button>
        </div>
      </form>
    </div>
  )
}
