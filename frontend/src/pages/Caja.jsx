import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cajaStyles as styles } from '../styles/Caja.styles';
import { ArrowLeft, DollarSign, Wallet, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import api from '../services/api';

export default function Caja() {
  const [baseInicial, setBaseInicial] = useState(() => {
    return Number(localStorage.getItem('elian_base_caja')) || 50000;
  });
  
  const [ventas, setVentas] = useState([]);
  const [vistaActiva, setVistaActiva] = useState('hoy'); // 'hoy' | 'dias' | 'meses'
  const [fechaFiltroDia, setFechaFiltroDia] = useState(new Date().toISOString().split('T')[0]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchVentas();
  }, []);

  const fetchVentas = async () => {
    try {
      const response = await api.get('/sales');
      const dataVentas = Array.isArray(response.data) ? response.data : (response.data.sales || []);
      setVentas(dataVentas);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
    }
  };

  const handleGuardarBase = (e) => {
    e.preventDefault();
    localStorage.setItem('elian_base_caja', baseInicial);
    alert('¡Base de caja actualizada con éxito! 🍻');
  };

  // 1. Filtrar ventas para el día seleccionado en el Arqueo Diario
  const ventasHoy = ventas.filter(v => {
    const fechaVenta = v.fecha || v.created_at || '';
    return fechaVenta.startsWith(fechaFiltroDia);
  });

  let totalEfectivoHoy = 0;
  let totalNequiHoy = 0;
  let totalTarjetaHoy = 0;
  let gananciaNetaHoy = 0;

  ventasHoy.forEach(v => {
    const metodo = v.metodo_pago || v.metodoPago;
    const totalVenta = Number(v.total || 0);

    if (metodo === 'Efectivo') totalEfectivoHoy += totalVenta;
    if (metodo === 'Nequi') totalNequiHoy += totalVenta;
    if (metodo === 'Tarjeta') totalTarjetaHoy += totalVenta;

    if (v.items && Array.isArray(v.items)) {
      v.items.forEach(item => {
        const precioVenta = Number(item.precio_unitario || item.precioVenta || 0);
        const costoCompra = Number(item.precio_compra || 0);
        const cantidad = Number(item.cantidad || 0);
        gananciaNetaHoy += (precioVenta - costoCompra) * cantidad;
      });
    }
  });

  const totalVentasHoy = totalEfectivoHoy + totalNequiHoy + totalTarjetaHoy;
  const efectivoEnCaja = baseInicial + totalEfectivoHoy;

  // 2. Agrupar ventas POR DÍA para la tabla histórica
  const ventasPorDiaMap = {};
  ventas.forEach(v => {
    const fechaVenta = (v.fecha || v.created_at || '').split('T')[0] || 'Desconocida';
    if (!ventasPorDiaMap[fechaVenta]) {
      ventasPorDiaMap[fechaVenta] = { fecha: fechaVenta, total: 0, efectivo: 0, nequi: 0, tarjeta: 0, ganancia: 0, cantidadVentas: 0 };
    }
    const totalVenta = Number(v.total || 0);
    const metodo = v.metodo_pago || v.metodoPago;
    ventasPorDiaMap[fechaVenta].total += totalVenta;
    ventasPorDiaMap[fechaVenta].cantidadVentas += 1;
    if (metodo === 'Efectivo') ventasPorDiaMap[fechaVenta].efectivo += totalVenta;
    if (metodo === 'Nequi') ventasPorDiaMap[fechaVenta].nequi += totalVenta;
    if (metodo === 'Tarjeta') ventasPorDiaMap[fechaVenta].tarjeta += totalVenta;

    if (v.items && Array.isArray(v.items)) {
      v.items.forEach(item => {
        const pVenta = Number(item.precio_unitario || item.precioVenta || 0);
        const pCompra = Number(item.precio_compra || 0);
        const cant = Number(item.cantidad || 0);
        ventasPorDiaMap[fechaVenta].ganancia += (pVenta - pCompra) * cant;
      });
    }
  });
  const listaVentasPorDia = Object.values(ventasPorDiaMap).sort((a, b) => b.fecha.localeCompare(a.fecha));

  // 3. Agrupar ventas POR MES para la tabla mensual
  const ventasPorMesMap = {};
  ventas.forEach(v => {
    const fechaVenta = v.fecha || v.created_at || '';
    const mesAnio = fechaVenta.length >= 7 ? fechaVenta.substring(0, 7) : 'Desconocido';
    if (!ventasPorMesMap[mesAnio]) {
      ventasPorMesMap[mesAnio] = { mes: mesAnio, total: 0, efectivo: 0, nequi: 0, tarjeta: 0, ganancia: 0, cantidadVentas: 0 };
    }
    const totalVenta = Number(v.total || 0);
    const metodo = v.metodo_pago || v.metodoPago;
    ventasPorMesMap[mesAnio].total += totalVenta;
    ventasPorMesMap[mesAnio].cantidadVentas += 1;
    if (metodo === 'Efectivo') ventasPorMesMap[mesAnio].efectivo += totalVenta;
    if (metodo === 'Nequi') ventasPorMesMap[mesAnio].nequi += totalVenta;
    if (metodo === 'Tarjeta') ventasPorMesMap[mesAnio].tarjeta += totalVenta;

    if (v.items && Array.isArray(v.items)) {
      v.items.forEach(item => {
        const pVenta = Number(item.precio_unitario || item.precioVenta || 0);
        const pCompra = Number(item.precio_compra || 0);
        const cant = Number(item.cantidad || 0);
        ventasPorMesMap[mesAnio].ganancia += (pVenta - pCompra) * cant;
      });
    }
  });
  const listaVentasPorMes = Object.values(ventasPorMesMap).sort((a, b) => b.mes.localeCompare(a.mes));

  const cerrarCaja = () => {
    if (window.confirm('¿Deseas realizar el cierre de caja de este día?')) {
      alert('¡Cierre de caja registrado con éxito! 🍻');
    }
  };

  return (
    <div style={styles.container}>
      
      {/* Cabecera con Pestañas de Reportes */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate('/pos')} style={styles.btnNav}>
            <ArrowLeft size={18} /> Volver al POS
          </button>
          <h1 style={styles.title}>Arqueo y Cierre de Caja - Licores Donde Elian</h1>
        </div>

        <div style={{ display: 'flex', gap: '8px', backgroundColor: '#0f172a', padding: '6px', borderRadius: '14px', border: '1px solid #1e293b' }}>
          <button
            onClick={() => setVistaActiva('hoy')}
            style={{
              backgroundColor: vistaActiva === 'hoy' ? '#3b82f6' : 'transparent',
              color: vistaActiva === 'hoy' ? '#fff' : '#94a3b8',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '10px',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Cierre Diario (Arqueo)
          </button>
          <button
            onClick={() => setVistaActiva('dias')}
            style={{
              backgroundColor: vistaActiva === 'dias' ? '#3b82f6' : 'transparent',
              color: vistaActiva === 'dias' ? '#fff' : '#94a3b8',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '10px',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Ventas por Día
          </button>
          <button
            onClick={() => setVistaActiva('meses')}
            style={{
              backgroundColor: vistaActiva === 'meses' ? '#3b82f6' : 'transparent',
              color: vistaActiva === 'meses' ? '#fff' : '#94a3b8',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '10px',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Ventas por Mes
          </button>
        </div>
      </div>

      {/* VISTA 1: CIERRE DIARIO / ARQUEO */}
      {vistaActiva === 'hoy' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', backgroundColor: '#0f172a', padding: '14px 20px', borderRadius: '16px', border: '1px solid #1e293b', width: 'fit-content' }}>
            <Calendar size={18} color="#60a5fa" />
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#94a3b8' }}>Seleccionar Fecha de Arqueo:</span>
            <input 
              type="date" 
              value={fechaFiltroDia}
              onChange={e => setFechaFiltroDia(e.target.value)}
              style={{ backgroundColor: '#020617', border: '1px solid #3b82f6', borderRadius: '8px', padding: '6px 12px', color: '#fff', fontSize: '13px', outline: 'none' }}
            />
          </div>

          <div style={styles.grid}>
            {/* Panel Izquierdo */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>
                <Wallet size={22} /> Control de Base Inicial
              </h2>

              <form onSubmit={handleGuardarBase}>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Dinero base en caja (Cambio inicial)
                </label>
                <input 
                  type="number" 
                  value={baseInicial} 
                  onChange={e => setBaseInicial(Number(e.target.value))}
                  style={styles.input}
                  required
                />
                <button type="submit" style={styles.btnAction}>
                  GUARDAR BASE DE CAJA
                </button>
              </form>

              <div style={{ marginTop: '36px', borderTop: '1.5px solid #1e293b', paddingTop: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff', marginBottom: '16px' }}>
                  Dinero Esperado en gaveta:
                </h3>
                <div style={{ ...styles.statRow, backgroundColor: 'rgba(52, 211, 153, 0.1)', borderColor: 'rgba(52, 211, 153, 0.3)' }}>
                  <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#34d399' }}>Efectivo Total (Base + Ventas):</span>
                  <span style={{ fontSize: '20px', fontWeight: '900', color: '#34d399' }}>${(baseInicial + totalEfectivoHoy).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Panel Derecho */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>
                <DollarSign size={22} /> Resumen Financiero ({fechaFiltroDia})
              </h2>

              <div style={styles.statRow}>
                <span style={styles.statLabel}>Ventas en Efectivo:</span>
                <span style={styles.statValue}>${totalEfectivoHoy.toLocaleString()}</span>
              </div>

              <div style={styles.statRow}>
                <span style={styles.statLabel}>Ventas por Nequi / Daviplata:</span>
                <span style={styles.statValue}>${totalNequiHoy.toLocaleString()}</span>
              </div>

              <div style={styles.statRow}>
                <span style={styles.statLabel}>Ventas por Tarjeta:</span>
                <span style={styles.statValue}>${totalTarjetaHoy.toLocaleString()}</span>
              </div>

              <div style={{ ...styles.statRow, backgroundColor: '#0f172a', borderColor: '#3b82f6', marginTop: '16px' }}>
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#ffffff' }}>TOTAL VENTAS DÍA:</span>
                <span style={{ fontSize: '22px', fontWeight: '900', color: '#60a5fa' }}>${totalVentasHoy.toLocaleString()}</span>
              </div>

              <div style={{ ...styles.statRow, backgroundColor: 'rgba(168, 85, 247, 0.15)', borderColor: '#a855f7', marginTop: '12px' }}>
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#e9d5ff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={16} /> GANANCIA NETA:
                </span>
                <span style={{ fontSize: '22px', fontWeight: '900', color: '#c084fc' }}>${gananciaNetaHoy.toLocaleString()}</span>
              </div>

              <button 
                onClick={cerrarCaja}
                style={{ ...styles.btnAction, background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', marginTop: '20px', boxShadow: '0 10px 25px rgba(239, 68, 68, 0.4)' }}
              >
                REALIZAR CIERRE DE CAJA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: VENTAS POR DÍA */}
      {vistaActiva === 'dias' && (
        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', border: '1.5px solid #1e293b', borderRadius: '24px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#60a5fa' }}>
            <Calendar size={20} /> Historial de Ventas Desglosado por Día
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                  <th style={{ padding: '12px' }}>Fecha</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>N° Ventas</th>
                  <th style={{ padding: '12px' }}>Efectivo</th>
                  <th style={{ padding: '12px' }}>Nequi</th>
                  <th style={{ padding: '12px' }}>Tarjeta</th>
                  <th style={{ padding: '12px', color: '#60a5fa' }}>Total Día</th>
                  <th style={{ padding: '12px', color: '#c084fc' }}>Ganancia Neta</th>
                </tr>
              </thead>
              <tbody>
                {listaVentasPorDia.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No hay registros de ventas aún.</td>
                  </tr>
                ) : (
                  listaVentasPorDia.map((fila, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid rgba(30, 41, 59, 0.5)' }}>
                      <td style={{ padding: '14px', fontWeight: '700', color: '#fff' }}>{fila.fecha}</td>
                      <td style={{ padding: '14px', textAlign: 'center' }}>
                        <span style={{ backgroundColor: '#020617', padding: '4px 10px', borderRadius: '8px', border: '1px solid #1e293b', fontWeight: 'bold' }}>
                          {fila.cantidadVentas}
                        </span>
                      </td>
                      <td style={{ padding: '14px' }}>${fila.efectivo.toLocaleString()}</td>
                      <td style={{ padding: '14px' }}>${fila.nequi.toLocaleString()}</td>
                      <td style={{ padding: '14px' }}>${fila.tarjeta.toLocaleString()}</td>
                      <td style={{ padding: '14px', fontWeight: '900', color: '#34d399' }}>${fila.total.toLocaleString()}</td>
                      <td style={{ padding: '14px', fontWeight: '900', color: '#c084fc' }}>${fila.ganancia.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA 3: VENTAS POR MES */}
      {vistaActiva === 'meses' && (
        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', border: '1.5px solid #1e293b', borderRadius: '24px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#a855f7' }}>
            <BarChart3 size={20} /> Historial de Ventas Agrupado por Mes
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                  <th style={{ padding: '12px' }}>Mes (Año-Mes)</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Total Transacciones</th>
                  <th style={{ padding: '12px' }}>Efectivo</th>
                  <th style={{ padding: '12px' }}>Nequi</th>
                  <th style={{ padding: '12px' }}>Tarjeta</th>
                  <th style={{ padding: '12px', color: '#60a5fa' }}>Total Mes</th>
                  <th style={{ padding: '12px', color: '#c084fc' }}>Ganancia Neta Mensual</th>
                </tr>
              </thead>
              <tbody>
                {listaVentasPorMes.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No hay registros de ventas aún.</td>
                  </tr>
                ) : (
                  listaVentasPorMes.map((fila, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid rgba(30, 41, 59, 0.5)' }}>
                      <td style={{ padding: '14px', fontWeight: '700', color: '#fff' }}>{fila.mes}</td>
                      <td style={{ padding: '14px', textAlign: 'center' }}>
                        <span style={{ backgroundColor: '#020617', padding: '4px 10px', borderRadius: '8px', border: '1px solid #1e293b', fontWeight: 'bold' }}>
                          {fila.cantidadVentas}
                        </span>
                      </td>
                      <td style={{ padding: '14px' }}>${fila.efectivo.toLocaleString()}</td>
                      <td style={{ padding: '14px' }}>${fila.nequi.toLocaleString()}</td>
                      <td style={{ padding: '14px' }}>${fila.tarjeta.toLocaleString()}</td>
                      <td style={{ padding: '14px', fontWeight: '900', color: '#34d399' }}>${fila.total.toLocaleString()}</td>
                      <td style={{ padding: '14px', fontWeight: '900', color: '#c084fc' }}>${fila.ganancia.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}