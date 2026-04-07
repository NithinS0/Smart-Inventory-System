import React, { useEffect, useState, useMemo } from 'react'
import { 
  FileText, Download, Filter, Search, User, Clock, Package, 
  ArrowLeft, Calendar, Tag, ChevronLeft, ChevronRight, BarChart2, TrendingUp 
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import * as XLSX from 'xlsx'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

interface Transaction {
  id: string
  item_id: string
  module: string
  action: 'add' | 'remove' | 'update' | 'scan'
  quantity: number
  timestamp: string
  remarks: string
  profile: { email: string, name: string }
}

interface ItemSummary {
  item_id: string
  name: string
  created_at: string
  total_added: number
  total_removed: number
  balance: number
  last_inflow_date: string | null
  last_outflow_date: string | null
}

export const Reports: React.FC = () => {
  const { currentModule } = useAppStore()
  const [activeTab, setActiveTab] = useState<'audit' | 'summary'>('audit')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [itemSummaries, setItemSummaries] = useState<ItemSummary[]>([])
  const [loading, setLoading] = useState(true)
  
  const [dateRange, setDateRange] = useState({ 
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  })
  const [actionFilter, setActionFilter] = useState('All')
  const [searchId, setSearchId] = useState('')
  const [searchUser, setSearchUser] = useState('')
  const [page, setPage] = useState(1)
  const itemsPerPage = 8

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        let query = supabase.from('stock_transactions').select('*, profile:profiles(email, name)')
          .eq('module', currentModule)
          .gte('timestamp', startOfDay(new Date(dateRange.start)).toISOString())
          .lte('timestamp', endOfDay(new Date(dateRange.end)).toISOString())
          .order('timestamp', { ascending: false })

        if (actionFilter !== 'All') query = query.eq('action', actionFilter.toLowerCase())
        const { data: txData } = await query
        setTransactions(txData || [])

        const itemsTable = currentModule === 'inventory' ? 'inventory_items' : 'spare_items'
        const { data: itemsData } = await supabase.from(itemsTable).select('id, name, created_at')
        
        if (itemsData) {
          const summaries: ItemSummary[] = itemsData.map(item => {
            const itemTxs = (txData || []).filter(tx => tx.item_id === item.id)
            const addTxs = itemTxs.filter(tx => tx.action === 'add')
            const removeTxs = itemTxs.filter(tx => tx.action === 'remove')
            const added = addTxs.reduce((sum, tx) => sum + Math.abs(tx.quantity), 0)
            const removed = removeTxs.reduce((sum, tx) => sum + Math.abs(tx.quantity), 0)
            // Latest timestamp among add/remove transactions
            const lastInflow = addTxs.length > 0
              ? addTxs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].timestamp
              : null
            const lastOutflow = removeTxs.length > 0
              ? removeTxs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].timestamp
              : null
            return {
              item_id: item.id, name: item.name, created_at: item.created_at,
              total_added: added, total_removed: removed, balance: added - removed,
              last_inflow_date: lastInflow,
              last_outflow_date: lastOutflow
            }
          })
          setItemSummaries(summaries)
        }
      } catch (err) { console.error(err) } finally { setLoading(false) }
    }
    fetchData()
  }, [currentModule, dateRange, actionFilter])

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => 
      tx.item_id.toLowerCase().includes(searchId.toLowerCase()) &&
      (tx.profile?.email.toLowerCase().includes(searchUser.toLowerCase()) || 
       tx.profile?.name?.toLowerCase().includes(searchUser.toLowerCase()))
    )
  }, [transactions, searchId, searchUser])

  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * itemsPerPage
    return filteredTransactions.slice(start, start + itemsPerPage)
  }, [filteredTransactions, page])

  const chartData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(new Date(), i)
      const dateStr = format(d, 'MMM dd')
      const dayTxs = transactions.filter(tx => format(new Date(tx.timestamp), 'MMM dd') === dateStr)
      return {
        name: dateStr,
        added: dayTxs.filter(tx => tx.action === 'add').reduce((sum, tx) => sum + tx.quantity, 0),
        removed: Math.abs(dayTxs.filter(tx => tx.action === 'remove').reduce((sum, tx) => sum + tx.quantity, 0))
      }
    }).reverse()
  }, [transactions])

  const exportToExcel = (type: 'audit' | 'summary') => {
    const data = type === 'audit' ? filteredTransactions.map(tx => ({
      Timestamp: format(new Date(tx.timestamp), 'yyyy-MM-dd HH:mm'),
      ID: tx.item_id, Operation: tx.action.toUpperCase(), Qty: tx.quantity, User: tx.profile?.email
    })) : itemSummaries.map(s => ({
      'Registry ID': s.item_id,
      'Asset Name': s.name,
      'Total Inflow (Units)': s.total_added,
      'Last Inflow Date': s.last_inflow_date ? format(new Date(s.last_inflow_date), 'yyyy-MM-dd HH:mm') : 'No inflow recorded',
      'Total Outflow (Units)': s.total_removed,
      'Last Outflow Date': s.last_outflow_date ? format(new Date(s.last_outflow_date), 'yyyy-MM-dd HH:mm') : 'No outflow recorded',
      'Current Balance': s.balance
    }))
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Report'); XLSX.writeFile(wb, `${type}_report.xlsx`)
  }

  return (
    <div className="animate-fade-in">
      {/* TAB SWITCHER & HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', background: 'var(--bg-sidebar)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <button 
            className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveTab('audit'); setPage(1); }}
            style={{ borderRadius: '8px', border: 'none', background: activeTab === 'audit' ? 'var(--primary)' : 'transparent', color: activeTab === 'audit' ? 'white' : 'var(--text-muted)' }}
          >Full Audit Stream</button>
          <button 
            className={`btn ${activeTab === 'summary' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveTab('summary'); setPage(1); }}
            style={{ borderRadius: '8px', border: 'none', background: activeTab === 'summary' ? 'var(--primary)' : 'transparent', color: activeTab === 'summary' ? 'white' : 'var(--text-muted)' }}
          >Asset Summary</button>
        </div>
        <button className="btn btn-secondary" onClick={() => exportToExcel(activeTab)}>
           <Download size={16} /> Export {activeTab === 'audit' ? 'Logs' : 'Summary'} (.xlsx)
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-4" style={{ marginBottom: '2.5rem' }}>
        {[
          { label: 'Net Stock In', val: itemSummaries.reduce((s, x) => s + x.total_added, 0), color: 'var(--success)' },
          { label: 'Net Stock Out', val: itemSummaries.reduce((s, x) => s + x.total_removed, 0), color: 'var(--danger)' },
          { label: 'Module Balance', val: itemSummaries.reduce((s, x) => s + x.balance, 0), color: 'var(--primary)' },
          { label: 'Compliance Index', val: '100%', color: 'var(--info)' },
        ].map((kpi, i) => (
          <div key={i} className="card" style={{ borderLeft: `4px solid ${kpi.color}` }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{kpi.label}</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{kpi.val}</h3>
          </div>
        ))}
      </div>

      {activeTab === 'audit' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* CHART */}
          <div className="card">
            <h3 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={16} color="var(--primary)" /> Movement Velocity (7-Day Rolling)
            </h3>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)' }} cursor={{ fill: '#f8fafc' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '0.75rem', paddingTop: '1rem' }} />
                  <Bar dataKey="added" fill="var(--success)" radius={[4, 4, 0, 0]} name="Inflow" />
                  <Bar dataKey="removed" fill="var(--danger)" radius={[4, 4, 0, 0]} name="Outflow" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* FILTERS */}
          <div className="card" style={{ padding: '1.25rem' }}>
             <div className="grid grid-cols-4">
               <div>
                 <label className="input-label" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>Time Range</label>
                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                   <input type="date" className="input-field" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} style={{ padding: '0.4rem', fontSize: '0.75rem' }} />
                   <input type="date" className="input-field" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} style={{ padding: '0.4rem', fontSize: '0.75rem' }} />
                 </div>
               </div>
               <div>
                 <label className="input-label" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>Operation</label>
                 <select className="input-field" value={actionFilter} onChange={e => setActionFilter(e.target.value)} style={{ padding: '0.4rem', fontSize: '0.75rem' }}>
                   <option>All</option><option>Add</option><option>Remove</option><option>Update</option><option>Scan</option>
                 </select>
               </div>
               <div>
                 <label className="input-label" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>Registry Search</label>
                 <input type="text" className="input-field" placeholder="ID..." value={searchId} onChange={e => setSearchId(e.target.value)} style={{ padding: '0.4rem', fontSize: '0.75rem' }} />
               </div>
               <div>
                 <label className="input-label" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>Member Search</label>
                 <input type="text" className="input-field" placeholder="User..." value={searchUser} onChange={e => setSearchUser(e.target.value)} style={{ padding: '0.4rem', fontSize: '0.75rem' }} />
               </div>
             </div>
          </div>

          {/* AUDIT TABLE */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Registry ID</th>
                  <th>Authorized Member</th>
                  <th>Operation</th>
                  <th>Quantity</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '4rem' }}>Synchronizing analytical stream...</td></tr>
                ) : paginatedTransactions.map(tx => (
                  <tr key={tx.id}>
                    <td style={{ fontSize: '0.75rem', fontWeight: 600 }}>{format(new Date(tx.timestamp), 'MMM dd, HH:mm:ss')}</td>
                    <td style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace' }}>{tx.item_id}</td>
                    <td>{tx.profile?.name || tx.profile?.email.split('@')[0]}</td>
                    <td><span className={`badge ${tx.action === 'add' ? 'badge-success' : tx.action === 'remove' ? 'badge-danger' : 'badge-info'}`} style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>{tx.action}</span></td>
                    <td style={{ fontWeight: 800, color: tx.quantity > 0 ? 'var(--success)' : tx.quantity < 0 ? 'var(--danger)' : 'inherit' }}>{tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '1rem 1.5rem', display: 'flex', borderTop: '1px solid var(--border-color)', justifyContent: 'space-between', alignItems: 'center', background: '#fcfcfd' }}>
               <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Records found: {filteredTransactions.length}</span>
               <div className="pagination">
                 <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(page-1)}><ChevronLeft size={16} /></button>
                 <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{page}</span>
                 <button className="pagination-btn" disabled={page * itemsPerPage >= filteredTransactions.length} onClick={() => setPage(page+1)}><ChevronRight size={16} /></button>
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Registry ID</th>
                <th>Asset Identity</th>
                <th>Total Inflow</th>
                <th>Last Inflow Date</th>
                <th>Total Outflow</th>
                <th>Last Outflow Date</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {itemSummaries.map(s => (
                <tr key={s.item_id}>
                  <td style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace' }}>{s.item_id}</td>
                  <td style={{ fontWeight: 700 }}>{s.name}</td>
                  <td style={{ fontWeight: 800, color: 'var(--success)' }}>{s.total_added}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {s.last_inflow_date ? format(new Date(s.last_inflow_date), 'dd MMM yyyy, HH:mm') : <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ fontWeight: 800, color: 'var(--danger)' }}>{s.total_removed}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {s.last_outflow_date ? format(new Date(s.last_outflow_date), 'dd MMM yyyy, HH:mm') : <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td><div className={`badge ${s.balance < 5 ? 'badge-danger' : 'badge-success'}`} style={{ fontWeight: 900, minWidth: 40, justifyContent: 'center' }}>{s.balance}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
