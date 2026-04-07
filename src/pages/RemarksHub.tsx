import React, { useEffect, useState } from 'react'
import { Bell, MessageSquare, AlertCircle, RefreshCw, Box, Send, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'

export const RemarksHub: React.FC = () => {
  const { user, currentModule } = useAppStore()
  
  // Admin State
  const [remarksList, setRemarksList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Staff Form State
  const [formItemId, setFormItemId] = useState('')
  const [formRemarks, setFormRemarks] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const fetchRemarks = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('stock_transactions')
      .select(`
        id, item_id, module, action, quantity, remarks, timestamp, 
        profiles!inner(name, employee_id)
      `)
      .not('remarks', 'is', null)
      .neq('remarks', '')
      .neq('remarks', 'Item metadata update')
      .neq('remarks', 'Quantity manual adjustment')
      .neq('remarks', 'QR Scan verification')
      .neq('remarks', 'Initial stock registry')
      .order('timestamp', { ascending: false })
      .limit(50)

    if (data && !error) setRemarksList(data)
    setLoading(false)
  }

  useEffect(() => { 
    if (user?.role === 'admin') {
      fetchRemarks() 
    } else {
      setLoading(false)
    }
  }, [user])

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formItemId || !formRemarks || !user) return
    setSubmitting(true)
    // Insert a purely observational remark transaction with 0 quantity
    await supabase.from('stock_transactions').insert([{
      item_id: formItemId,
      module: currentModule || 'inventory',
      action: 'remark',
      quantity: 0,
      user_id: user.id,
      remarks: formRemarks
    }])
    setSubmitting(false)
    setSuccess(true)
    setFormItemId('')
    setFormRemarks('')
    setTimeout(() => setSuccess(false), 4000)
  }

  if (user?.role !== 'admin') {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '2rem' }}>
         <div style={{ marginBottom: '2rem' }}>
           <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)' }}>Transmit Remark to Admin</h2>
           <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Directly file an operational note, request, or alert to the Admin Notification Center.</p>
         </div>

         {success && (
           <div className="card animate-fade-in" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
              <CheckCircle2 color="var(--success)" size={24} />
              <div>
                <h4 style={{ color: '#166534', fontWeight: 800, fontSize: '0.875rem' }}>Successfully Transmitted</h4>
                <p style={{ color: '#15803d', fontSize: '0.8125rem' }}>The admin notification center has received your report.</p>
              </div>
           </div>
         )}

         <form onSubmit={handleStaffSubmit} className="card shadow-sm">
           <div style={{ marginBottom: '1.5rem' }}>
             <label className="input-label">Your Employee Identity</label>
             <input type="text" className="input-field" value={`${user?.name} (${user?.employee_id})`} disabled style={{ background: '#f8fafc', color: '#94a3b8' }} />
           </div>
           
           <div style={{ marginBottom: '1.5rem' }}>
             <label className="input-label">Asset / Item ID Record</label>
             <input 
               type="text" 
               className="input-field" 
               placeholder="e.g. INV-12345"
               value={formItemId}
               onChange={e => setFormItemId(e.target.value)}
               required
             />
           </div>

           <div style={{ marginBottom: '2rem' }}>
             <label className="input-label">Operational Remarks / Details</label>
             <textarea 
               className="input-field" 
               rows={4}
               placeholder="Detail your request or observation for this asset..."
               value={formRemarks}
               onChange={e => setFormRemarks(e.target.value)}
               required
             />
           </div>

           <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', justifyContent: 'center', height: 48 }}>
             {submitting ? <RefreshCw className="animate-spin" size={18} /> : <><Send size={18} /> Transmit to Notification Center</>}
           </button>
         </form>
      </div>
    )
  }

  // Admin View
  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)' }}>Operations Notification Center</h2>
           <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>View operational remarks drafted by personnel logic flows.</p>
        </div>
        <button onClick={fetchRemarks} className="btn btn-secondary">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Synchronize Stream
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
        </div>
      ) : remarksList.length === 0 ? (
        <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
          <Bell size={48} style={{ color: 'var(--border-color)', margin: '0 auto 1.5rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-muted)' }}>Inbox Empty</h3>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Zero operational requests transmitted by active personnel.</p>
        </div>
      ) : (
        <div className="table-container shadow-sm">
          <table>
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Timestamp</th>
                <th>Staff Operator</th>
                <th>Asset Identity</th>
                <th>Operation Executed</th>
                <th>Operator Remarks</th>
              </tr>
            </thead>
            <tbody>
              {remarksList.map((log: any) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {new Date(log.timestamp).toLocaleDateString()} <br/>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, fontSize: '0.875rem' }}>{log.profiles?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{log.profiles?.employee_id}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Box size={14} color="var(--primary)" />
                      <span className="badge" style={{ background: '#f1f5f9', color: '#334155' }}>{log.item_id}</span>
                    </div>
                  </td>
                  <td>
                     <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                       {log.action === 'remove' ? <AlertCircle size={14} color="var(--danger)" /> : <MessageSquare size={14} color="var(--success)" />}
                       <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', textTransform: 'capitalize' }}>
                         {log.action} {Math.abs(log.quantity)}x
                       </span>
                     </div>
                  </td>
                  <td>
                     <div style={{ padding: '0.75rem', background: '#f8fafc', borderLeft: '3px solid var(--primary)', borderRadius: '4px', fontSize: '0.8125rem', color: '#1e293b', fontWeight: 600 }}>
                        {log.remarks}
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
