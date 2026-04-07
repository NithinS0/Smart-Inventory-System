import React, { useEffect, useState, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { Scan, Package, ArrowLeft, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'
import { useInventory, Item } from '../hooks/useInventory'

export const QRScanner: React.FC = () => {
  const { currentModule } = useAppStore()
  const { logScan } = useInventory()
  const [scannedItem, setScannedItem] = useState<Item | null>(null)
  const [scanning, setScanning] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    if (scanning) {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scannerRef.current.render(onScanSuccess, onScanError);
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear", err));
      }
    };
  }, [scanning]);

  async function onScanSuccess(decodedText: string) {
    if (!scanning) return;
    setScanning(false);
    setLoading(true);
    setError(null);
    if (scannerRef.current) await scannerRef.current.clear();

    try {
      const tableName = decodedText.startsWith('IM') ? 'inventory_items' : 'spare_items'
      const { data, error: fetchError } = await supabase.from(tableName).select('*').eq('id', decodedText).single()
      if (fetchError) throw new Error('Asset registry ID invalid or not found.')
      setScannedItem(data)
      await logScan(decodedText)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function onScanError(error?: any) {
  console.error('QR Scan error:', error);
  setError(error?.message || 'Scanning failed. Please try again.');
  setScanning(false);
  // Ensure scanner is cleared to allow restart
  if (scannerRef.current) {
    scannerRef.current.clear().catch(err => console.error('Failed to clear scanner on error', err));
  }
}

  const restartScan = () => {
    // Reset all states and reinitialize scanner
    setScannedItem(null);
    setError(null);
    setTakeoutQuantity('');
    setRemarks('');
    setScanning(true);
  }

  const [takeoutQuantity, setTakeoutQuantity] = useState<number | ''>('')
  const [remarks, setRemarks] = useState('')
  const { updateItem } = useInventory()
  const [submitting, setSubmitting] = useState(false)

  const handleTakeOut = async () => {
    if (!scannedItem || takeoutQuantity === '' || takeoutQuantity <= 0) return
    const deduction = Number(takeoutQuantity)
    if (deduction > scannedItem.quantity) {
      setError('Insufficient stock for this deduction.')
      return
    }
    setSubmitting(true)
    try {
      await updateItem(scannedItem.id, { quantity: scannedItem.quantity - deduction }, remarks)
      restartScan()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '60vh', justifyContent: 'center' }}>
      {scanning && (
        <div className="card" style={{ width: '100%', maxWidth: 500, padding: '1rem', background: 'white' }}>
          <div id="reader" style={{ borderRadius: '8px', overflow: 'hidden' }}></div>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
             <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1.5s infinite' }}></div>
             <span style={{ fontSize: '0.8125rem', fontWeight: 800, textTransform: 'uppercase' }}>Waiting for capture...</span>
          </div>
          <style>{`@keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0.5; } }`}</style>
        </div>
      )}

      {loading && (
        <div className="card" style={{ width: '100%', maxWidth: 400, padding: '4rem', textAlign: 'center' }}>
          <RefreshCw size={32} style={{ animation: 'spin 2s linear infinite', color: 'var(--primary)' }} />
          <p style={{ marginTop: '1rem', fontWeight: 800, fontSize: '0.875rem' }}>Synchronizing with registry...</p>
        </div>
      )}

      {error && !loading && (
        <div className="card" style={{ width: '100%', maxWidth: 400, padding: '3rem', textAlign: 'center' }}>
          <div style={{ color: 'var(--danger)', marginBottom: '1.5rem' }}><AlertCircle size={48} style={{ margin: '0 auto' }} /></div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 900, marginBottom: '0.5rem' }}>Sync Failed</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.875rem' }}>{error}</p>
          <button className="btn btn-primary" onClick={restartScan} style={{ width: '100%', justifyContent: 'center' }}>
            <Scan size={16} /> Re-initialize Scanner
          </button>
        </div>
      )}

      {scannedItem && !loading && (
        <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 500, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '2rem', background: 'var(--primary)', color: 'white' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.8, textTransform: 'uppercase' }}>Registry: {scannedItem.id}</div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '0.25rem' }}>{scannedItem.name}</h2>
               </div>
               <Package size={40} style={{ opacity: 0.3 }} />
             </div>
             <div style={{ marginTop: '1rem' }}>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>{scannedItem.category}</span>
             </div>
          </div>

          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="grid grid-cols-2">
               <div>
                 <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Available Stock</p>
                 <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '0.2rem' }}>{scannedItem.quantity}</div>
               </div>
               <div>
                 <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</p>
                 <div style={{ fontSize: '1.125rem', fontWeight: 800, marginTop: '0.2rem', color: scannedItem.quantity > 0 ? 'var(--success)' : 'var(--danger)' }}>
                   {scannedItem.quantity > 0 ? 'AVAILABLE' : 'DEPLETED'}
                 </div>
               </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
               <h3 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '1rem', color: '#0f172a' }}>Take Out / Deduct Item</h3>
               
               <div style={{ marginBottom: '1rem' }}>
                 <label className="input-label">Quantity to Take</label>
                 <input 
                   type="number" min="1" max={scannedItem.quantity}
                   className="input-field" 
                   value={takeoutQuantity} 
                   onChange={e => setTakeoutQuantity(parseInt(e.target.value) || '')}
                   placeholder="e.g. 2"
                 />
               </div>

               <div style={{ marginBottom: '1rem' }}>
                 <label className="input-label">Admin Remarks (Required if applicable)</label>
                 <textarea 
                   className="input-field" 
                   rows={2}
                   value={remarks} 
                   onChange={e => setRemarks(e.target.value)}
                   placeholder="Enter remarks for the admin notification center..."
                 />
               </div>

               <button 
                 className="btn btn-primary" 
                 style={{ width: '100%', justifyContent: 'center', height: 44 }}
                 disabled={!takeoutQuantity || takeoutQuantity <= 0 || submitting}
                 onClick={handleTakeOut}
               >
                 {submitting ? 'Processing...' : 'Confirm Deduction'}
               </button>
            </div>

            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={restartScan} style={{ flex: 1, justifyContent: 'center' }}>
                <ArrowLeft size={16} /> Cancel Scan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
