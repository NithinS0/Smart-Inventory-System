import React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Share2 } from 'lucide-react'

interface Props {
  value: string
  title: string
}

export const QRGenerator: React.FC<Props> = ({ value, title }) => {
  const downloadQR = () => {
    const svg = document.getElementById('item-qr-svg') as unknown as SVGElement
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width + 40
      canvas.height = img.height + 80
      if (ctx) {
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 20, 20)
        ctx.fillStyle = '#0f172a'
        ctx.font = 'bold 16px Inter'
        ctx.textAlign = 'center'
        ctx.fillText(value, canvas.width / 2, canvas.height - 40)
        ctx.font = '14px Inter'
        ctx.fillText(title, canvas.width / 2, canvas.height - 20)
        
        const pngFile = canvas.toDataURL('image/png')
        const downloadLink = document.createElement('a')
        downloadLink.download = `QR_${value}.png`
        downloadLink.href = pngFile
        downloadLink.click()
      }
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
      <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <QRCodeSVG 
          id="item-qr-svg"
          value={value} 
          size={160}
          level="H"
          includeMargin={true}
        />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontWeight: 900, fontSize: '1rem', color: '#0f172a', letterSpacing: '0.025em', fontFamily: 'monospace' }}>{value}</p>
        <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.25rem' }}>{title}</p>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '0.5rem' }}>
        <button className="btn btn-primary" onClick={downloadQR} style={{ flex: 1, justifyContent: 'center', height: 40, fontSize: '0.8125rem' }}>
          <Download size={14} /> Download Identity
        </button>
        <button className="btn btn-secondary" style={{ height: 40, width: 40, padding: 0, justifyContent: 'center' }}>
          <Share2 size={14} />
        </button>
      </div>
    </div>
  )
}
