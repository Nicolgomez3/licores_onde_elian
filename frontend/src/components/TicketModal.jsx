import React from 'react';
import { Printer, X } from 'lucide-react';
import logoOriginal from '../assets/logo.png';

export default function TicketModal({ venta, onClose }) {
  if (!venta) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.container}>
        <div style={modalStyles.actions}>
          <button onClick={handlePrint} style={modalStyles.btnPrint}>
            <Printer size={16} /> Imprimir Recibo
          </button>
          <button onClick={onClose} style={modalStyles.btnClose}>
            <X size={18} />
          </button>
        </div>

        <div style={modalStyles.ticket}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <img src={logoOriginal} alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
            <h2 style={{ fontSize: '16px', fontWeight: '900', margin: '8px 0 2px 0', color: '#000' }}>LICORES DONDE ELIAN</h2>
            <p style={{ fontSize: '10px', margin: 0, color: '#475569' }}>Piqueteadería & Licorería 24H</p>
          </div>

          <div style={{ borderTop: '1px dashed #cbd5e1', borderBottom: '1px dashed #cbd5e1', padding: '8px 0', margin: '12px 0', fontSize: '11px', color: '#334155' }}>
            <p style={{ margin: '2px 0' }}><strong>Fecha:</strong> {new Date().toLocaleString()}</p>
            <p style={{ margin: '2px 0' }}><strong>Ticket #:</strong> {venta.id}</p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', color: '#0f172a', marginBottom: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ paddingBottom: '6px' }}>Cant.</th>
                <th style={{ paddingBottom: '6px' }}>Producto</th>
                <th style={{ paddingBottom: '6px', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {venta.items.map((item) => (
                <tr key={item.id}>
                  <td style={{ padding: '4px 0', fontWeight: 'bold' }}>{item.cantidad}x</td>
                  <td style={{ padding: '4px 0' }}>{item.nombre}</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 'bold' }}>
                    ${(item.precioVenta * item.cantidad).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px', textAlign: 'right' }}>
            <p style={{ fontSize: '14px', fontWeight: '900', margin: 0, color: '#000' }}>
              TOTAL: ${venta.total.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const modalStyles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  container: {
    backgroundColor: '#0f172a', border: '1.5px solid rgba(59, 130, 246, 0.4)',
    borderRadius: '24px', padding: '24px', maxWidth: '380px', width: '90%',
  },
  actions: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px',
  },
  btnPrint: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100% )', color: '#fff',
    border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', gap: '6px',
  },
  btnClose: { background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' },
  ticket: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', fontFamily: 'monospace' }
};