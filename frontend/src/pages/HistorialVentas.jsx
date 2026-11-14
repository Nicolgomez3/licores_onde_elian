import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function HistorialVentas() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ventaExpandida, setVentaExpandida] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/sales');
      setVentas(response.data);
    } catch (error) {
      console.error('Error al cargar historial de ventas:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setVentaExpandida(ventaExpandida === id ? null : id);
  };

  return (
    <div style={{ padding: '30px', color: '#fff', backgroundColor: '#09090e', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <button 
          onClick={() => navigate('/pos')}
          style={{ background: '#1e293b', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
        >
          ← Volver al POS
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Historial de Facturas - Licores Donde Elian</h1>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', marginTop: '50px', color: '#94a3b8' }}>Cargando facturas...</p>
      ) : ventas.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '100px', padding: '40px', background: '#121826', borderRadius: '12px' }}>
          <p style={{ fontSize: '18px', color: '#94a3b8' }}>No hay ventas registradas todavía</p>
          <p style={{ fontSize: '14px', color: '#64748b' }}>Las ventas que realices en el POS aparecerán aquí automáticamente.</p>
        </div>
      ) : (
        <div style={{ background: '#121826', borderRadius: '12px', overflow: 'hidden', padding: '20px', border: '1px solid #1e293b' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e293b', color: '#94a3b8', fontSize: '14px' }}>
                <th style={{ padding: '12px' }}>N° Venta</th>
                <th style={{ padding: '12px' }}>Fecha</th>
                <th style={{ padding: '12px' }}>Total</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((venta) => {
                const isExpanded = ventaExpandida === venta.id;
                return (
                  <React.Fragment key={venta.id}>
                    <tr 
                      onClick={() => toggleExpand(venta.id)}
                      style={{ 
                        borderBottom: '1px solid #1e293b', 
                        cursor: 'pointer', 
                        backgroundColor: isExpanded ? '#1b2333' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td style={{ padding: '14px 12px', fontWeight: 'bold', color: '#38bdf8' }}>#{venta.id}</td>
                      <td style={{ padding: '14px 12px', color: '#cbd5e1' }}>{new Date(venta.fecha || venta.created_at).toLocaleString()}</td>
                      <td style={{ padding: '14px 12px', color: '#22c55e', fontWeight: 'bold' }}>
                        ${Number(venta.total).toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'right', color: '#38bdf8', fontSize: '13px', fontWeight: '600' }}>
                        {isExpanded ? '▲ Ocultar detalle' : '▼ Ver detalle'}
                      </td>
                    </tr>

                    {/* Fila desplegable con el detalle completo de los productos */}
                    {isExpanded && (
                      <tr>
                        <td colSpan="4" style={{ padding: '20px', backgroundColor: '#0d1322', borderBottom: '1px solid #1e293b' }}>
                          <div style={{ margin: '0 10px' }}>
                            <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '10px' }}>
                              📦 Detalle de Productos Vendidos:
                            </p>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', background: '#121826', borderRadius: '8px', overflow: 'hidden' }}>
                              <thead>
                                <tr style={{ background: '#1e293b', color: '#94a3b8' }}>
                                  <th style={{ padding: '8px 12px' }}>Producto</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>Cantidad</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Precio Unit.</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {venta.items && venta.items.length > 0 ? (
                                  venta.items.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                                      <td style={{ padding: '8px 12px', color: '#fff' }}>{item.producto_nombre || `Producto #${item.producto_id}`}</td>
                                      <td style={{ padding: '8px 12px', textAlign: 'center', color: '#cbd5e1' }}>{item.cantidad}</td>
                                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#cbd5e1' }}>${Number(item.precio_unitario || item.precio || 0).toLocaleString()}</td>
                                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#22c55e', fontWeight: 'bold' }}>${Number(item.subtotal || 0).toLocaleString()}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="4" style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>No hay detalles registrados para esta venta.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}