import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, Barcode, Plus, ArrowLeft, Trash2, Tag, DollarSign, Layers } from 'lucide-react';
import api from '../services/api';

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState({
    codigoBarras: '',
    nombre: '',
    categoria_id: '1',
    precioCompra: '',
    precioVenta: '',
    stock: ''
  });

  const navigate = useNavigate();
  const location = useLocation();

  // Cargar productos reales desde MySQL al montar el componente
  useEffect(() => {
    fetchProductos();
  }, []);

  // Capturar automáticamente el código si viene redirigido desde el POS
  useEffect(() => {
    if (location.state?.codigoNuevo && productos.length > 0) {
      manejarBusquedaCodigo(location.state.codigoNuevo, productos);
    }
  }, [location.state, productos]);

  const fetchProductos = async () => {
    try {
      const response = await api.get('/products');
      const dataFormateada = response.data.map(p => ({
        id: p.id,
        codigoBarras: p.codigo_barras || p.codigoBarras,
        nombre: p.nombre,
        categoria_id: p.categoria_id || 1,
        categoria: p.categoria_id === 2 ? 'Piqueteadero' : 'Licores y Cervezas',
        precioCompra: Number(p.precio_compra || p.precioCompra || 0),
        precioVenta: Number(p.precio_venta || p.precioVenta || 0),
        stock: p.stock_actual !== undefined ? p.stock_actual : p.stock
      }));
      setProductos(dataFormateada);
    } catch (error) {
      console.error('Error al cargar inventario:', error);
    }
  };

  const manejarBusquedaCodigo = (codigo, listaProductos) => {
    const codigoLimpio = String(codigo).trim();
    const productoExistente = listaProductos.find(p => String(p.codigoBarras).trim() === codigoLimpio);
    
    if (productoExistente) {
      setForm({
        codigoBarras: productoExistente.codigoBarras,
        nombre: productoExistente.nombre,
        categoria_id: String(productoExistente.categoria_id),
        precioCompra: productoExistente.precioCompra,
        precioVenta: productoExistente.precioVenta,
        stock: ''
      });
    } else {
      setForm(prev => ({
        ...prev,
        codigoBarras: codigoLimpio
      }));
    }
  };

  const handleCodigoChange = (e) => {
    const valor = e.target.value;
    setForm(prev => ({ ...prev, codigoBarras: valor }));
    manejarBusquedaCodigo(valor, productos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.codigoBarras || !form.nombre || !form.precioVenta || !form.stock) {
      alert('Por favor completa los campos obligatorios.');
      return;
    }

    try {
      const nuevoProductoBackend = {
        codigo_barras: form.codigoBarras,
        nombre: form.nombre,
        categoria_id: Number(form.categoria_id),
        precio_compra: Number(form.precioCompra) || 0,
        precio_venta: Number(form.precioVenta),
        stock_actual: Number(form.stock),
        stock_minimo: 5
      };

      await api.post('/products', nuevoProductoBackend);
      alert('¡Inventario actualizado / registrado con éxito en MySQL! 🍻');
      
      setForm({ codigoBarras: '', nombre: '', categoria_id: '1', precioCompra: '', precioVenta: '', stock: '' });
      fetchProductos();
    } catch (error) {
      console.error('Error al registrar producto:', error);
      alert(error.response?.data?.message || 'Error al guardar el producto en el servidor.');
    }
  };

  // FUNCIÓN DE ELIMINACIÓN CON ID NUMÉRICO ASEGURADO
  const eliminarProducto = async (id) => {
    if (window.confirm('¿Estás segura de eliminar este producto de la base de datos?')) {
      try {
        const idNumerico = Number(id);
        await api.delete(`/products/${idNumerico}`);
        
        // Actualizamos el estado local quitando el producto eliminado
        setProductos((prev) => prev.filter(p => p.id !== id));
        alert('¡Producto eliminado con éxito de la base de datos! 🍻');
      } catch (error) {
        console.error('Error al eliminar el producto:', error);
        alert(error.response?.data?.message || 'No se pudo eliminar el producto en el servidor.');
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#07090e', color: '#ffffff', padding: '30px', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #1e293b', paddingBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => navigate('/pos')} style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '10px 16px', borderRadius: '12px', color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <ArrowLeft size={16} /> Ir al POS (Ventas)
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>Gestión e Inventario - Licores Donde Elian</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '30px' }}>
        
        {/* Formulario de Registro / Autocompletado */}
        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', border: '1.5px solid rgba(59, 130, 246, 0.3)', borderRadius: '24px', padding: '24px', height: 'fit-content' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Registrar o Actualizar Producto
          </h2>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8' }}>Código de Barras</label>
              <div style={{ position: 'relative', marginTop: '6px' }}>
                <Barcode size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input 
                  type="text" 
                  placeholder="Escanea o escribe código..." 
                  value={form.codigoBarras} 
                  onChange={handleCodigoChange}
                  style={{ width: '100%', backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', padding: '12px 12px 12px 38px', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8' }}>Nombre del Producto</label>
              <input 
                type="text" 
                placeholder="Ej. Aguardiente, Cerveza, Picada..." 
                value={form.nombre} 
                onChange={e => setForm({...form, nombre: e.target.value})}
                style={{ width: '100%', backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', padding: '12px', color: '#fff', outline: 'none', boxSizing: 'border-box', marginTop: '6px' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8' }}>Categoría</label>
              <select 
                value={form.categoria_id} 
                onChange={e => setForm({...form, categoria_id: e.target.value})}
                style={{ width: '100%', backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', padding: '12px', color: '#fff', outline: 'none', boxSizing: 'border-box', marginTop: '6px' }}
              >
                <option value="1">Licores y Cervezas</option>
                <option value="2">Piqueteadero y Comidas</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8' }}>Precio Compra</label>
                <input 
                  type="number" 
                  placeholder="$ 0" 
                  value={form.precioCompra} 
                  onChange={e => setForm({...form, precioCompra: e.target.value})}
                  style={{ width: '100%', backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', padding: '12px', color: '#fff', outline: 'none', boxSizing: 'border-box', marginTop: '6px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8' }}>Precio Venta *</label>
                <input 
                  type="number" 
                  placeholder="$ 0" 
                  value={form.precioVenta} 
                  onChange={e => setForm({...form, precioVenta: e.target.value})}
                  style={{ width: '100%', backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', padding: '12px', color: '#fff', outline: 'none', boxSizing: 'border-box', marginTop: '6px' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8' }}>Stock Inicial / Cantidad *</label>
              <input 
                type="number" 
                placeholder="Cantidad a ingresar" 
                value={form.stock} 
                onChange={e => setForm({...form, stock: e.target.value})}
                style={{ width: '100%', backgroundColor: '#020617', border: '1.5px solid #3b82f6', borderRadius: '12px', padding: '12px', color: '#fff', outline: 'none', boxSizing: 'border-box', marginTop: '6px' }}
                required
              />
            </div>

            <button type="submit" style={{ width: '100%', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#fff', fontWeight: '900', padding: '14px', borderRadius: '14px', border: 'none', cursor: 'pointer', marginTop: '10px', boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4)' }}>
              GUARDAR EN INVENTARIO
            </button>
          </form>
        </div>

        {/* Tabla de Productos Registrados */}
        <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', border: '1.5px solid #1e293b', borderRadius: '24px', padding: '24px', overflowX: 'auto' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="#60a5fa" /> Inventario Actual Registrado ({productos.length})
          </h2>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                <th style={{ padding: '12px' }}>Código Barras</th>
                <th style={{ padding: '12px' }}>Producto</th>
                <th style={{ padding: '12px' }}>Categoría</th>
                <th style={{ padding: '12px' }}>P. Venta</th>
                <th style={{ padding: '12px' }}>Stock</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(30, 41, 59, 0.5)' }}>
                  <td style={{ padding: '14px', fontFamily: 'monospace', color: '#60a5fa' }}>{p.codigoBarras}</td>
                  <td style={{ padding: '14px', fontWeight: '700' }}>{p.nombre}</td>
                  <td style={{ padding: '14px' }}>
                    <span style={{ fontSize: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                      {p.categoria}
                    </span>
                  </td>
                  <td style={{ padding: '14px', fontWeight: '900', color: '#34d399' }}>${p.precioVenta.toLocaleString()}</td>
                  <td style={{ padding: '14px', fontWeight: '900' }}>
                    <span style={{ backgroundColor: p.stock > 5 ? '#020617' : 'rgba(239, 68, 68, 0.2)', color: p.stock > 5 ? '#fff' : '#f87171', padding: '4px 8px', borderRadius: '6px' }}>
                      {p.stock} un.
                    </span>
                  </td>
                  <td style={{ padding: '14px', textAlign: 'center' }}>
                    <button 
                      onClick={() => eliminarProducto(p.id)} 
                      style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }} 
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}