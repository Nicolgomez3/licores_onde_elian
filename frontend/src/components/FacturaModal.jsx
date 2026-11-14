import React from 'react';
import { Printer, X, CheckCircle2 } from 'lucide-react';
import logoOriginal from '../assets/logo.png';

export default function FacturaModal({ venta, onClose }) {
  if (!venta) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.container}>
        
        {/* Acciones flotantes */}
        <div style={modalStyles.actions}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: '800', fontSize: '14px' }}>
            <CheckCircle2 size={20} /> Detalle de Factura
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handlePrint} style={modalStyles.btnPrint}>
              <Printer size={16} /> Imprimir Factura
            </button>
            <button onClick={onClose} style={modalStyles.btnClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Contenido de la Factura Imprimible */}
        <div style={modalStyles.facturaBox} id="factura-imprimible">
          
          <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px' }}>
            <img src={logoOriginal} alt="Logo" style={{ width: '70px', height: '70px', objectFit: 'contain', marginBottom: '8px' }} />
            <h2 style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 4px 0', color: '#0f172a' }}>LICORES DONDE ELIAN</h2>
            <p style={{ fontSize: '11px', color: '#475569', margin: 0, fontWeight: '600' }}>Licorería & Piqueteadero Tradicional</p>
            <p style={{ fontSize: '11px', color: '#475569', margin: '2px 0 0 0' }}>NIT: 123456789-0 • Régimen Simplificado</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#334155', marginBottom: '20px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div>
              <p style={{ margin: '0 0 4px 0' }}><strong>Factura N°:</strong> #{venta.id}</p>
              <p style={{ margin: 0 }}><strong>Fecha:</strong> {new Date(venta.fecha || Date.now()).toLocaleString()}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 4px 0' }}><strong>Método de Pago:</strong> <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{venta.metodoPago || 'Efectivo'}</span></p>
              <p style={{ margin: 0 }}><strong>Cajero:</strong> Administrador</p>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#0f172a', marginBottom: '20px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                <th style={{ paddingBottom: '8px' }}>CANT.</th>
                <th style={{ paddingBottom: '8px' }}>DESCRIPCIÓN</th>
                <th style={{ paddingBottom: '8px', textAlign: 'right' }}>VR. UNITARIO</th>
                <th style={{ paddingBottom: '8px', textAlign: 'right' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {venta.items && venta.items.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 0', fontWeight: 'bold' }}>{item.cantidad}</td>
                  <td style={{ padding: '10px 0', fontWeight: '600' }}>{item.nombre}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', color: '#475569' }}>${item.precioVenta.toLocaleString()}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>
                    ${(item.precioVenta * item.cantidad).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
            <div style={{ width: '250px', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569', marginBottom: '6px' }}>
                <span>Total a Pagar:</span>
                <span style={{ fontWeight: 'bold' }}>${venta.total.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '900', color: '#0f172a', borderTop: '1px solid #cbd5e1', paddingTop: '6px', marginTop: '4px' }}>
                <span>TOTAL:</span>
                <span style={{ color: '#059669' }}>${venta.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '16px', fontSize: '11px', color: '#64748b' }}>
            <p style={{ margin: '0 0 4px 0', fontWeight: '700' }}>¡Gracias por preferirnos! Disfruta con responsabilidad.</p>
            <p style={{ margin: 0 }}>Licores Donde Elian • POS Profesional</p>
          </div>

        </div>

      </div>
    </div>
  );
}

const modalStyles = {
  overlay: {
    position: 'fixed', 
    top: 0, 
    left: 0, 
    width: '100vw', 
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.75)', 
    backdropFilter: 'blur(5px)',
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 9999, // Asegura que esté por encima de todo
  },
  container: {
    backgroundColor: '#0f172a', 
    border: '2px solid rgba(59, 130, 246, 0.5)',
    borderRadius: '28px', 
    padding: '28px', 
    maxWidth: '540px', 
    width: '95%',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
  },
  actions: {
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '20px',
  },
  btnPrint: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
    color: '#fff',
    border: 'none', 
    padding: '10px 18px', 
    borderRadius: '14px', 
    fontWeight: '800', 
    fontSize: '13px', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px',
  },
  btnClose: { 
    background: 'transparent', 
    border: 'none', 
    color: '#94a3b8', 
    cursor: 'pointer' 
  },
  facturaBox: {
    backgroundColor: '#ffffff', 
    borderRadius: '20px', 
    padding: '28px',
    fontFamily: 'system-ui, -apple-system, sans-serif', 
    maxHeight: '70vh', 
    overflowY: 'auto',
    color: '#0f172a'
  }
};