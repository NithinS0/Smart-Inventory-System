import React, { useEffect, useState } from 'react'
import { 
  Plus, Download, TrendingUp, Package, AlertTriangle, 
  Activity, FileText, CheckCircle2, MoreVertical, 
  ArrowUpRight, ArrowDownRight, Layers, Scan
} from 'lucide-react'
import { useInventory } from '../hooks/useInventory'
import { useAppStore } from '../store/useAppStore'
import { supabase } from '../lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts'
import { subDays, eachDayOfInterval, format, formatDistanceToNow } from 'date-fns'
import { AddItemModal } from '../components/AddItemModal'
import { QRGenerator } from '../components/QRGenerator'

const COLORS = ['#2563eb', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

interface ActivityLog {
  id: string
  action: string
  item_id: string
  module: string
  timestamp: string
  profile_email?: string
}

export const Dashboard: React.FC = () => {
  const { currentModule, user } = useAppStore()
  const { items, loading, addItem } = useInventory()
  const [showAddModal, setShowAddModal] = useState(false)
  const [successItem, setSuccessItem] = useState<{ id: string, name: string } | null>(null)
  
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([])
  const [stats, setStats] = useState({ totalItems: 0, lowStock: 0, totalAdded: 0, totalRemoved: 0 })
  const [trendData, setTrendData] = useState<any[]>([])
  const [movementData, setMovementData] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [chartsLoading, setChartsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setChartsLoading(true)
      try {
        const thirtyDaysAgo = subDays(new Date(), 30)

        // 1. Logs
        const { data: logResults } = await supabase
          .from('stock_transactions')
          .select('*, profile:profiles(email)')
          .eq('module', currentModule)
          .order('timestamp', { ascending: false })
          .limit(8)
        setRecentLogs(logResults?.map((l: any) => ({ ...l, profile_email: l.profile?.email })) || [])

        // 2. Transactions
        const { data: txData } = await supabase
          .from('stock_transactions')
          .select('*')
          .eq('module', currentModule)
          .gte('timestamp', thirtyDaysAgo.toISOString())
          .order('timestamp', { ascending: true })

        if (txData && items) {
          const interval = eachDayOfInterval({ start: thirtyDaysAgo, end: new Date() })
          let cumulative = items.reduce((sum, i) => sum + i.quantity, 0)
          
          const processed = interval.map(day => {
            const dateStr = format(day, 'MMM dd')
            const dayTxs = txData.filter(tx => format(new Date(tx.timestamp), 'MMM dd') === dateStr)
            const added = dayTxs.filter(tx => tx.action === 'add').reduce((sum, tx) => sum + tx.quantity, 0)
            const removed = Math.abs(dayTxs.filter(tx => tx.action === 'remove').reduce((sum, tx) => sum + tx.quantity, 0))
            return { name: dateStr, added, removed, trend: (cumulative += (added - removed)) }
          })
          
          setTrendData(processed)
          setMovementData(processed)
          setStats({
            totalItems: items.length,
            lowStock: items.filter(i => i.quantity < 5).length,
            totalAdded: txData.filter(t => t.action === 'add').reduce((s, t) => s + t.quantity, 0),
            totalRemoved: Math.abs(txData.filter(t => t.action === 'remove').reduce((s, t) => s + t.quantity, 0))
          })
        }

        // 3. Categories
        if (items) {
          const catGroups = items.reduce((acc: any, item: any) => {
            acc[item.category] = (acc[item.category] || 0) + item.quantity
            return acc
          }, {})
          setCategoryData(Object.keys(catGroups).map(key => ({ name: key, value: catGroups[key] })))
        }
      } catch (err) {
        console.error('Fetch error:', err)
      } finally {
        setChartsLoading(false)
      }
    }
    fetchDashboardData()
  }, [currentModule, items])

  const handleDownloadAudit = async () => {
    try {
      const { data: logsData } = await supabase
        .from('stock_transactions').select('*, profile:profiles(email)').eq('module', currentModule)
      if (!logsData) return
      const headers = ['Timestamp', 'Member', 'Action', 'Item ID']
      const csv = [headers.join(','), ...logsData.map(log => [format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm'), (log as any).profile?.email, log.action, log.item_id].join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'audit_log.csv'; a.click()
    } catch (err) { alert('Download failed') }
  }

  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff'

  if (loading || chartsLoading) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Preparing environment...</div>

  return (
    <div className="animate-fade-in">
      {/* ACTION BAR */}
      <div className="dashboard-action-bar" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '2rem' }}>
        {user?.role === 'admin' && (
          <button className="btn btn-secondary" onClick={handleDownloadAudit}>
            <Download size={16} /> Export Audit
          </button>
        )}
        {user?.role === 'admin' ? (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Register New Asset
          </button>
        ) : (
          <a href="/scan" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            <Scan size={16} /> Scan Asset QR
          </a>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .dashboard-action-bar { flex-direction: column-reverse; width: 100%; }
          .dashboard-action-bar .btn { width: 100%; justify-content: center; }
          .dashboard-action-bar a { width: 100%; justify-content: center; }
        }
      `}</style>

      {/* KPI GRID */}
      <div className="grid grid-cols-4" style={{ marginBottom: '2.5rem' }}>
        {[
          { label: 'Total Assets', val: stats.totalItems, icon: <Package size={20} />, color: 'var(--primary)' },
          { label: 'Low Stock Alerts', val: stats.lowStock, icon: <AlertTriangle size={20} />, color: 'var(--danger)' },
          { label: 'Recent Inbound', val: stats.totalAdded, icon: <ArrowUpRight size={20} />, color: 'var(--success)' },
          { label: 'Recent Outbound', val: stats.totalRemoved, icon: <ArrowDownRight size={20} />, color: 'var(--warning)' },
        ].map((kpi, idx) => (
          <div key={idx} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '12px', background: `${kpi.color}10`, color: kpi.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {kpi.icon}
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{kpi.label}</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{kpi.val}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* MAIN CHART */}
      <div className="card" style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={18} color="var(--primary)" /> Rolling Stock Inventory (30 Days)
        </h3>
        <div style={{ height: 320, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)', fontSize: '0.8rem' }} />
              <Area type="monotone" dataKey="trend" stroke="var(--primary)" strokeWidth={3} fill="url(#trendGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ marginBottom: '2.5rem' }}>
         <div className="card">
           <h3 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '1.5rem' }}>Stock Movement Comparison</h3>
           <div style={{ height: 280 }}>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={movementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                 <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                 <Legend iconType="circle" wrapperStyle={{ fontSize: '0.75rem', paddingTop: '1rem' }} />
                 <Bar dataKey="added" fill="var(--success)" radius={[4, 4, 0, 0]} name="Inflow" />
                 <Bar dataKey="removed" fill="var(--danger)" radius={[4, 4, 0, 0]} name="Outflow" />
               </BarChart>
             </ResponsiveContainer>
           </div>
         </div>

         <div className="card">
           <h3 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '1.5rem' }}>Category Composition</h3>
           <div style={{ height: 280 }}>
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={categoryData} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                   {categoryData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                 </Pie>
                 <Tooltip />
                 <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" wrapperStyle={{ fontSize: '0.75rem' }} />
               </PieChart>
             </ResponsiveContainer>
           </div>
         </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className="grid grid-cols-2">
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Recent Transactions</h3>
            <Activity size={20} style={{ opacity: 0.2 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recentLogs.map((log, i) => (
              <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 2rem', borderBottom: i === recentLogs.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} color="var(--text-muted)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>{log.profile_email?.split('@')[0]}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.action} item {log.item_id}</div>
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>{formatDistanceToNow(new Date(log.timestamp))} ago</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Supply Shortfalls</h3>
            <Layers size={20} color="var(--danger)" style={{ opacity: 0.4 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {items?.filter(i => i.quantity < 5).slice(0, 5).map((item, i) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 2rem', borderBottom: i === 4 ? 'none' : '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 800 }}>{item.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 700 }}>Registry: {item.id}</div>
                </div>
                <div className="badge badge-danger" style={{ fontWeight: 900, padding: '0.5rem 1rem' }}>{item.quantity} Left</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AddItemModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onSubmit={async (data) => {
          const id = await addItem(data)
          if (id) setSuccessItem({ id, name: data.name })
        }} 
        title={`New ${currentModule === 'inventory' ? 'Inventory' : 'Spare'} Asset`} 
      />
      
      {successItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="card animate-fade-in" style={{ maxWidth: 400, textAlign: 'center', padding: '3rem' }}>
            <CheckCircle2 size={48} color="var(--success)" style={{ margin: '0 auto 1.5rem' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem' }}>Asset Registered</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>Identity generated for {successItem.name}</p>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <QRGenerator value={successItem.id} title={successItem.name} />
            </div>
            <button className="btn btn-primary" onClick={() => setSuccessItem(null)} style={{ width: '100%', marginTop: '2rem', justifyContent: 'center' }}>Dismiss</button>
          </div>
        </div>
      )}
    </div>
  )
}
