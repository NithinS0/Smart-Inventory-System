import React, { useState } from 'react'
import { X, Package, ShoppingCart, Save, MessageSquare } from 'lucide-react'
import { Item } from '../hooks/useInventory'

interface Props {
  item: Item
  onClose: () => void
  onSubmit: (newQty: number, remarks: string) => Promise<void>
}

export const StockUpdateModal: React.FC<Props> = ({ item, onClose, onSubmit }) => {
  const [qty, setQty] = useState<number>(item.quantity)
  const [remarks, setRemarks] = useState('')
  const [loading, setLoading] = useState(false)

  const diff = qty - item.quantity
  const isIncrease = diff > 0
  const isDecrease = diff < 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (qty < 0) return
    setLoading(true)
    try {
      await onSubmit(qty, remarks)
      onClose()
    } catch {
      alert('Failed to update stock. Check connectivity.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <form className="card animate-fade-in" onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 460, padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'white' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 900, color: '#0f172a' }}>Update Stock</h2>
              <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Adjust quantity for this asset only</p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {/* Item Identity Card */}
        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1.25rem', border: '1px solid #e2e8f0', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Package size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#0f172a' }}>{item.name}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace', marginTop: '0.15rem' }}>{item.id} · {item.category}</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Current</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: item.quantity < 5 ? 'var(--danger)' : '#0f172a' }}>{item.quantity}</div>
          </div>
        </div>

        {/* Quantity Adjuster */}
        <div>
          <label className="input-label">New Stock Quantity</label>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button type="button" onClick={() => setQty(Math.max(0, qty - 1))}
              style={{ width: 44, height: 44, borderRadius: '10px', border: '1px solid var(--border-color)', background: 'white', fontSize: '1.25rem', fontWeight: 900, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
            <input
              type="number" min="0"
              className="input-field"
              value={qty}
              onChange={e => setQty(parseInt(e.target.value) || 0)}
              style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 900, flex: 1 }}
              required
            />
            <button type="button" onClick={() => setQty(qty + 1)}
              style={{ width: 44, height: 44, borderRadius: '10px', border: '1px solid var(--border-color)', background: 'white', fontSize: '1.25rem', fontWeight: 900, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          </div>
          {/* Change preview */}
          {diff !== 0 && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: isIncrease ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {isIncrease ? '▲' : '▼'} {Math.abs(diff)} units {isIncrease ? 'added' : 'removed'} from registry
            </div>
          )}
        </div>

        {/* Remarks */}
        <div>
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MessageSquare size={13} /> Reason / Remarks <span style={{ color: '#94a3b8', fontWeight: 500 }}>(optional)</span>
          </label>
          <textarea
            className="input-field" rows={2}
            placeholder="e.g. Damaged units disposed, received new shipment..."
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            style={{ resize: 'none' }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1, height: 44, justifyContent: 'center' }}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading || qty === item.quantity} style={{ flex: 2, height: 44, justifyContent: 'center' }}>
            <Save size={16} /> {loading ? 'Saving...' : 'Confirm Update'}
          </button>
        </div>
      </form>
    </div>
  )
}
