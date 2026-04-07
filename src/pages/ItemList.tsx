import React, { useState, useMemo } from 'react'
import { 
  Plus, Search, Filter, Edit2, Trash2, QrCode, 
  X, CheckCircle2, ChevronLeft, ChevronRight,
  LayoutGrid
} from 'lucide-react'
import { useInventory, Item } from '../hooks/useInventory'
import { useAppStore } from '../store/useAppStore'
import { QRGenerator } from '../components/QRGenerator'
import { AddItemModal } from '../components/AddItemModal'
import { StockUpdateModal } from '../components/StockUpdateModal'

export const ItemList: React.FC = () => {
  const { currentModule, user } = useAppStore()
  const { items, loading, addItem, updateItem, deleteItem } = useInventory()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState<Item | null>(null)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [successItem, setSuccessItem] = useState<{ id: string, name: string } | null>(null)
  
  const [page, setPage] = useState(1)
  const itemsPerPage = 8

  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category))
    return ['All', ...Array.from(cats)]
  }, [items])

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           item.id.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [items, searchTerm, categoryFilter])

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage
    return filteredItems.slice(start, start + itemsPerPage)
  }, [filteredItems, page])

  const handleAddSubmit = async (data: any) => {
    const newId = await addItem(data)
    if (newId) {
      setSuccessItem({ id: newId as string, name: data.name })
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('MISSION CRITICAL: Are you sure you want to permanently delete this asset registry entry? This action cannot be reversed.')) {
      await deleteItem(id)
    }
  }

  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff'
  const isAdmin = user?.role === 'admin'

  if (loading) return <div style={{ padding: '8rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.875rem' }}>Synchronizing local asset registry...</div>

  return (
    <div className="animate-fade-in">
      {/* GLOBAL ACTION BAR */}
      <div className="action-bar-container" style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '3rem', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: 640 }} className="search-filter-stack">
          <div style={{ flex: 2 }}>
            <label className="input-label" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>Registry Quick-Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: 14, color: '#94a3b8' }} />
              <input 
                type="text" className="input-field" placeholder="Identify by ID, model or category..." 
                value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                style={{ paddingLeft: '2.75rem', height: 44 }}
              />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label className="input-label" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>Classification</label>
            <div style={{ position: 'relative' }}>
              <Filter size={16} style={{ position: 'absolute', left: 14, top: 14, color: '#94a3b8' }} />
              <select 
                className="input-field" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                style={{ paddingLeft: '2.75rem', height: 44 }}
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>
        </div>
        
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ height: 44, padding: '0 1.5rem' }}>
            <Plus size={18} /> <span className="mobile-hide">+ Add Item</span>
          </button>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .action-bar-container { flex-direction: column; align-items: stretch !important; gap: 1rem !important; }
          .search-filter-stack { flex-direction: column; width: 100%; max-width: none !important; }
          .mobile-hide { display: none; }
          .btn-primary { justify-content: center; width: 100%; }
        }
      `}</style>

      {/* ENTERPRISE DATA TABLE */}
      <div className="table-container shadow-sm">
        <table>
          <thead>
            <tr>
              <th style={{ width: '180px' }}>Registry ID</th>
              <th>Asset Specification</th>
              <th style={{ width: '150px' }}>Classification</th>
              <th style={{ width: '120px' }}>Current Stock</th>
              <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Management</th>
            </tr>
          </thead>
          <tbody>
            {(paginatedItems.length > 0) ? paginatedItems.map((item) => (
              <tr key={item.id}>
                <td style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace', letterSpacing: '0.05em', fontSize: '0.75rem' }}>{item.id}</td>
                <td>
                  <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#0f172a' }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300, marginTop: '0.2rem' }}>{item.description || 'No specialized description provided.'}</div>
                </td>
                <td>
                  <span className={`badge ${currentModule === 'inventory' ? 'badge-info' : 'badge-warning'}`} style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>{item.category}</span>
                </td>
                <td>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: item.quantity < 5 ? 'var(--danger)' : '#0f172a' }}>{item.quantity}</div>
                </td>
                <td style={{ textAlign: 'right', paddingRight: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                     <button className="btn btn-ghost" onClick={() => setShowQRModal(item)} style={{ padding: '8px' }} title="Generate Identity">
                       <QrCode size={16} />
                     </button>
                    {isAdmin && (
                      <button className="btn btn-ghost" onClick={() => setEditingItem(item)} style={{ padding: '8px' }} title="Configure Specifications">
                        <Edit2 size={16} />
                      </button>
                    )}
                    {isAdmin && (
                      <button className="btn btn-danger" onClick={() => handleDelete(item.id)} style={{ padding: '8px', border: 'none' }} title="Terminate Registry">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} style={{ padding: '8rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <LayoutGrid size={48} style={{ opacity: 0.1, margin: '0 auto 1.5rem' }} />
                  <p style={{ fontWeight: 800, fontSize: '0.875rem' }}>Zero results found in current registry stream.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* REFINED PAGINATION HUB */}
        <div style={{ padding: '1.25rem 2rem', display: 'flex', borderTop: '1px solid var(--border-color)', justifyContent: 'space-between', alignItems: 'center', background: '#fcfcfd' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            Active Personnel Oversight: {Math.min(filteredItems.length, (page-1)*itemsPerPage + 1)}-{Math.min(filteredItems.length, page*itemsPerPage)} of {filteredItems.length}
          </span>
          <div className="pagination">
            <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button>
            <div style={{ width: 40, textAlign: 'center', fontSize: '0.75rem', fontWeight: 900 }}>{page}</div>
            <button className="pagination-btn" disabled={page * itemsPerPage >= filteredItems.length} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      <AddItemModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onSubmit={handleAddSubmit}
        title={`New ${currentModule} Registry`}
      />

      {editingItem && (
        <StockUpdateModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSubmit={async (newQty, remarks) => {
            await updateItem(editingItem.id, { quantity: newQty }, remarks || 'Stock quantity adjustment')
            setEditingItem(null)
          }}
        />
      )}

      {successItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 420, textAlign: 'center', padding: '3.5rem' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
               <CheckCircle2 size={32} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem', color: '#0f172a' }}>Digital Entry Complete</h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '2.5rem' }}>Identity authorized for {successItem.name}</p>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
              <QRGenerator value={successItem.id} title={successItem.name} />
            </div>
            <button className="btn btn-primary" onClick={() => setSuccessItem(null)} style={{ width: '100%', marginTop: '2.5rem', height: 48, justifyContent: 'center' }}>Synchronize Workspace</button>
          </div>
        </div>
      )}

      {showQRModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 420, padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 900, color: '#0f172a' }}>Digital Asset ID</h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Enterprise Verification Registry</p>
              </div>
              <button onClick={() => setShowQRModal(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <QRGenerator value={showQRModal.id} title={showQRModal.name} />
            <p style={{ marginTop: '2rem', fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Asset • Secure Identity</p>
          </div>
        </div>
      )}
    </div>
  )
}
