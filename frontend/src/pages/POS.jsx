import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { posStyles as styles } from '../styles/POS.styles';
import logoOriginal from '../assets/logo.png';
import FacturaModal from '../components/FacturaModal';
import api from '../services/api';
import { ShoppingCart, Search, Plus, Minus, Trash2, LogOut, PackagePlus, Barcode, AlertTriangle, DollarSign, Smartphone, CreditCard, Wallet, FileText } from 'lucide-react';

export default function POS() {
  const [productos, setProductos] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [efectivoRecibido, setEfectivoRecibido] = useState('');
  const [ultimaVenta, setUltimaVenta] = useState(null);
  
  // Estados para el Modal moderno de Producto No Encontrado
  const [modalNoEncontradoAbierto, setModalNoEncontradoAbierto] = useState(false);
  const [codigoNoRegistrado, setCodigoNoRegistrado] = useState('');

  const navigate = useNavigate();

  // Variables de buffer para la lectura ultra rápida del lector USB
  const barcodeBufferRef = useRef('');
  const lastKeyTimeRef = useRef(Date.now());

  // Cargar productos reales desde el backend (MySQL) al montar el componente
  useEffect(() => {
    fetchProductos();
  }, []);

  // Detector global para el lector de códigos de barras (simula tipeo muy rápido + Enter)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Ignorar si estamos escribiendo activamente dentro de un input o textarea para no interferir
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        // Permitir que el formulario manual de código de barras siga funcionando si está enfocado
        return;
      }

      const currentTime = Date.now();
      const timeElapsed = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Si pasa mucho tiempo entre tecla y tecla, reiniciamos el buffer (es humano escribiendo, no el escáner)
      if (timeElapsed > 100) {
        barcodeBufferRef.current = '';
      }

      if (e.key === 'Enter') {
        const codigoLeido = barcodeBufferRef.current.trim();
        if (codigoLeido.length > 2) {
          e.preventDefault();
          procesarCodigoEscaneado(codigoLeido);
        }
        barcodeBufferRef.current = '';
      } else if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [productos]);

  const procesarCodigoEscaneado = (codigo) => {
    const codigoLimpio = String(codigo).trim();
    
    // Búsqueda precisa limpiando espacios y comparando ambos lados como texto
    const encontrado = productos.find(p => String(p.codigoBarras).trim() === codigoLimpio);
    
    if (encontrado) {
      addToCart(encontrado);
    } else {
      // Refrescamos los productos del servidor por si acaso se registró recientemente
      api.get('/products').then(response => {
        const actualizados = response.data.map(p => ({
          id: p.id,
          codigoBarras: p.codigo_barras || p.codigoBarras,
          nombre: p.nombre,
          precioVenta: Number(p.precio_venta),
          precio_compra: Number(p.precio_compra || 0),
          stock: p.stock_actual,
          categoria: (p.categoria_id === 2 || p.nombre.toLowerCase().includes('picada')) ? 'Piqueteadero y Comidas' : 'Licores y Cervezas'
        }));
        
        const reintento = actualizados.find(p => String(p.codigoBarras).trim() === codigoLimpio);
        if (reintento) {
          setProductos(actualizados);
          addToCart(reintento);
        } else {
          // Si definitivamente no está en la base de datos, abrimos el modal moderno
          setCodigoNoRegistrado(codigoLimpio);
          setModalNoEncontradoAbierto(true);
        }
      }).catch(err => {
        console.error('Error al reintentar búsqueda:', err);
        setCodigoNoRegistrado(codigoLimpio);
        setModalNoEncontradoAbierto(true);
      });
    }
  };

  const fetchProductos = async () => {
    try {
      const response = await api.get('/products');
      const productosFormateados = response.data.map(p => {
        let nombreCategoria = 'Licores y Cervezas';
        const nombreLower = p.nombre.toLowerCase();
        
        if (p.categoria_id === 2 || nombreLower.includes('picada') || nombreLower.includes('papas')) {
          nombreCategoria = 'Piqueteadero y Comidas';
        } else if (nombreLower.includes('margarita') || nombreLower.includes('mecato')) {
          nombreCategoria = 'Mecato';
        } else {
          nombreCategoria = 'Licores y Cervezas';
        }

        return {
          id: p.id,
          codigoBarras: p.codigo_barras || p.codigoBarras,
          nombre: p.nombre,
          precioVenta: Number(p.precio_venta),
          precio_compra: Number(p.precio_compra || 0),
          stock: p.stock_actual,
          categoria: nombreCategoria
        };
      });
      setProductos(productosFormateados);
    } catch (error) {
      console.error('Error al cargar productos del servidor:', error);
    }
  };

  const addToCart = (prod) => {
    if (prod.stock <= 0) {
      alert('¡Producto sin stock disponible!');
      return;
    }

    setCart((prev) => {
      const itemExistente = prev.find((item) => item.id === prod.id);
      if (itemExistente) {
        if (itemExistente.cantidad >= prod.stock) {
          alert('No hay más unidades disponibles en el stock.');
          return prev;
        }
        return prev.map((item) =>
          item.id === prod.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prev, { ...prod, cantidad: 1 }];
    });
  };

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    const codigoBuscado = barcodeInput.trim();
    procesarCodigoEscaneado(codigoBuscado);
    setBarcodeInput('');
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nuevaCant = item.cantidad + delta;
            const prodOriginal = productos.find(p => p.id === id);
            if (delta > 0 && prodOriginal && nuevaCant > prodOriginal.stock) {
              alert('Supera el stock disponible.');
              return item;
            }
            return nuevaCant > 0 ? { ...item, cantidad: nuevaCant } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter(item => item.id !== id));
  };

  const total = cart.reduce((acc, item) => acc + item.precioVenta * item.cantidad, 0);
  const cambioVueltas = metodoPago === 'Efectivo' && efectivoRecibido ? Number(efectivoRecibido) - total : 0;

  const handleCheckout = async () => {
    if (metodoPago === 'Efectivo' && Number(efectivoRecibido) < total) {
      alert('El dinero recibido en efectivo es menor al total a pagar.');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user')) || { id: 1 };

    const saleData = {
      usuario_id: user.id,
      total: total,
      metodo_pago: metodoPago,
      items: cart.map(item => ({
        producto_id: item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precioVenta,
        precio_compra: item.precio_compra
      }))
    };

    try {
      const response = await api.post('/sales', saleData);
      alert(response.data.message || '¡Venta registrada con éxito en el servidor! 🍻');

      const nuevaVenta = {
        id: response.data.saleId || Math.floor(100000 + Math.random() * 900000),
        items: [...cart],
        total: total,
        metodoPago: metodoPago,
        efectivoRecibido: metodoPago === 'Efectivo' ? Number(efectivoRecibido) : total,
        cambio: cambioVueltas,
        fecha: new Date().toISOString()
      };

      setUltimaVenta(nuevaVenta);
      setCart([]);
      setEfectivoRecibido('');
      fetchProductos();

      // Disparar la impresión automática hacia la impresora térmica HOIN
      setTimeout(() => {
        window.print();
      }, 300);

    } catch (error) {
      console.error('Error al procesar la venta:', error);
      alert(error.response?.data?.message || 'Error al procesar la venta en el servidor.');
    }
  };

  const productosFiltrados = productos.filter((p) => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(search.toLowerCase()) || p.codigoBarras.includes(search);
    const coincideCategoria = categoriaActiva === 'Todos' || p.categoria === categoriaActiva;
    return coincideBusqueda && coincideCategoria;
  });

  return (
    <div style={styles.container}>
      
      <FacturaModal venta={ultimaVenta} onClose={() => setUltimaVenta(null)} />

      {/* MODAL MODERNO DE PRODUCTO NO ENCONTRADO */}
      {modalNoEncontradoAbierto && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(2, 6, 23, 0.85)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '1.5px solid #3b82f6',
            borderRadius: '24px',
            padding: '30px',
            width: '400px',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: '#60a5fa'
            }}>
              <AlertTriangle size={24} />
            </div>

            <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>
              ¡Código no registrado!
            </h3>
            
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5' }}>
              El código de barras <strong style={{ color: '#60a5fa' }}>{codigoNoRegistrado}</strong> no se encuentra en la base de datos de Licores Donde Elian.
            </p>

            <div style={{ backgroundColor: '#020617', padding: '10px', borderRadius: '12px', border: '1px solid #1e293b', marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>¿Qué deseas hacer?</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={() => setModalNoEncontradoAbierto(false)}
                style={{
                  backgroundColor: '#1e293b',
                  border: 'none',
                  color: '#94a3b8',
                  padding: '12px',
                  borderRadius: '14px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              
              <button
                onClick={() => {
                  setModalNoEncontradoAbierto(false);
                  navigate('/inventario', { state: { codigoNuevo: codigoNoRegistrado } });
                }}
                style={{
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  color: '#fff',
                  padding: '12px',
                  borderRadius: '14px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                }}
              >
                Registrar Producto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TICKET TÉRMICO OCULTO (Se activa exclusivamente al imprimir en la HOIN 58mm) */}
      <div id="ticket-factura" style={{ display: 'none' }}>
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', marginBottom: '2px' }}>LICORES DONDE ELIAN</div>
        <div style={{ textAlign: 'center', fontSize: '10px', marginBottom: '4px' }}>Punto de Venta & Inventario</div>
        <div style={{ textAlign: 'center', fontSize: '10px', marginBottom: '6px' }}>Anserma, Caldas</div>
        <div style={{ textAlign: 'center', fontSize: '10px', marginBottom: '6px' }}>--------------------------------</div>
        
        <div style={{ fontSize: '10px', marginBottom: '6px' }}>
          <div><strong>Fecha:</strong> {new Date().toLocaleString()}</div>
          <div><strong>Cajero:</strong> Administrador</div>
        </div>
        
        <div style={{ textAlign: 'center', fontSize: '10px', marginBottom: '6px' }}>--------------------------------</div>
        
        <div style={{ fontSize: '11px' }}>
          {ultimaVenta && ultimaVenta.items.map((item, index) => (
            <div key={index} style={{ marginBottom: '4px' }}>
              <div style={{ fontWeight: 'bold' }}>{item.nombre}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{item.cantidad} x ${Number(item.precioVenta || 0).toLocaleString()}</span>
                <span>${(item.cantidad * Number(item.precioVenta || 0)).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', fontSize: '10px', margin: '6px 0' }}>--------------------------------</div>
        
        <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>TOTAL:</span>
            <span>${Number(ultimaVenta?.total || 0).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'normal', marginTop: '2px' }}>
            <span>Método de Pago:</span>
            <span>{ultimaVenta?.metodoPago}</span>
          </div>
          {ultimaVenta?.metodoPago === 'Efectivo' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'normal' }}>
                <span>Recibido:</span>
                <span>${Number(ultimaVenta?.efectivoRecibido || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'normal' }}>
                <span>Cambio:</span>
                <span>${Number(ultimaVenta?.cambio || 0).toLocaleString()}</span>
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', fontSize: '10px', margin: '8px 0' }}>--------------------------------</div>
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11px' }}>¡GRACIAS POR SU COMPRA! 🍻</div>
        <div style={{ textAlign: 'center', fontSize: '9px', marginTop: '4px' }}>Conserve este tiquete</div>
      </div>

      {/* ESTILOS CSS DE IMPRESIÓN DIRECTA PARA LA HOIN HOP-H58 (58mm) */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #ticket-factura, #ticket-factura * {
            visibility: visible !important;
          }
          #ticket-factura {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 58mm !important;
            margin: 0 !important;
            padding: 2mm !important;
            background: white !important;
            color: black !important;
            font-family: 'Courier New', Courier, monospace !important;
          }
        }
      `}</style>

      {/* SECCIÓN IZQUIERDA */}
      <div style={styles.leftPanel}>
        
        <div style={styles.header}>
          <div style={styles.brandBox}>
            <div style={styles.logoMini}>
              <img src={logoOriginal} alt="Logo" style={styles.logoImage} />
            </div>
            <div>
              <h1 style={styles.title}>Licores Donde Elian</h1>
              <p style={styles.subtitle}>Punto de Venta & Inventario</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <form onSubmit={handleBarcodeSubmit}>
              <div style={{ position: 'relative' }}>
                <Barcode size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#60a5fa' }} />
                <input
                  type="text"
                  placeholder="Escanear Código de Barras..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  style={{ backgroundColor: '#020617', border: '1.5px solid #3b82f6', borderRadius: '16px', padding: '10px 12px 10px 38px', fontSize: '12px', color: '#fff', outline: 'none', width: '180px' }}
                />
              </div>
            </form>

            <button 
              onClick={() => navigate('/historial')}
              style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', border: '1.5px solid #a855f7', padding: '10px 16px', borderRadius: '16px', cursor: 'pointer', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '12px' }}
            >
              <FileText size={16} /> Historial
            </button>

            <button 
              onClick={() => navigate('/caja')}
              style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', border: '1.5px solid #34d399', padding: '10px 16px', borderRadius: '16px', cursor: 'pointer', color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '12px' }}
            >
              <Wallet size={16} /> Caja
            </button>

            <button 
              onClick={() => navigate('/inventario')}
              style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1.5px solid #3b82f6', padding: '10px 16px', borderRadius: '16px', cursor: 'pointer', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '12px' }}
            >
              <PackagePlus size={16} /> Inventario
            </button>

            <button 
              onClick={() => { localStorage.clear(); navigate('/login'); }}
              style={{ backgroundColor: '#0f172a', border: '1.5px solid #1e293b', padding: '10px', borderRadius: '16px', cursor: 'pointer', color: '#94a3b8' }}
              title="Cerrar Sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Categorías */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['Todos', 'Licores y Cervezas', 'Piqueteadero y Comidas', 'Mecato'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                style={styles.categoryBtn(categoriaActiva === cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '250px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        {/* Grilla */}
        <div style={styles.grid}>
          {productosFiltrados.map((prod) => {
            const esStockBajo = prod.stock <= 5 && prod.stock > 0;
            const esAgotado = prod.stock === 0;

            return (
              <div
                key={prod.id}
                onClick={() => addToCart(prod)}
                style={{
                  ...styles.productCard,
                  borderColor: esStockBajo ? 'rgba(245, 158, 11, 0.6)' : esAgotado ? 'rgba(239, 68, 68, 0.4)' : '#1e293b',
                  opacity: esAgotado ? 0.5 : 1
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={styles.productCategoryTag}>{prod.categoria}</span>
                    {esStockBajo && (
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={12} /> Poco Stock
                      </span>
                    )}
                  </div>
                  <h3 style={styles.productName}>{prod.nombre}</h3>
                </div>
                <div style={styles.productFooter}>
                  <span style={styles.productPrice}>${prod.precioVenta.toLocaleString()}</span>
                  <span style={{
                    ...styles.productStock,
                    color: esStockBajo ? '#fbbf24' : esAgotado ? '#f87171' : '#94a3b8'
                  }}>
                    Stock: {prod.stock}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN DERECHA */}
      <div style={styles.rightPanel}>
        <div>
          <div style={styles.cartHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShoppingCart size={20} color="#60a5fa" />
              <span style={styles.cartTitle}>Orden Actual</span>
            </div>
            <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '4px 10px', borderRadius: '10px' }}>
              {cart.reduce((acc, i) => acc + i.cantidad, 0)} ítems
            </span>

          </div>

          <div style={styles.cartItemsList}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                <ShoppingCart size={40} style={{ margin: '0 auto 12px auto', opacity: '0.3' }} />
                <p style={{ fontSize: '13px', fontWeight: '600' }}>El carrito está vacío</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} style={styles.cartItemRow}>
                  <div style={{ flex: 1, paddingRight: '8px' }}>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nombre}</p>
                    <p style={{ fontSize: '12px', fontWeight: '900', color: '#34d399', margin: 0 }}>
                      ${(item.precioVenta * item.cantidad).toLocaleString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: '10px', border: '1px solid #1e293b', padding: '2px' }}>
                      <button onClick={() => updateQuantity(item.id, -1)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8' }}>
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: '12px', fontWeight: '900', color: '#ffffff', width: '20px', textAlign: 'center' }}>{item.cantidad}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8' }}>
                        <Plus size={12} />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: '#f87171' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={styles.totalSection}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Método de Pago</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {[
                { id: 'Efectivo', icon: <DollarSign size={14} /> },
                { id: 'Nequi', icon: <Smartphone size={14} /> },
                { id: 'Tarjeta', icon: <CreditCard size={14} /> }
              ].map((met) => (
                <button
                  key={met.id}
                  onClick={() => setMetodoPago(met.id)}
                  style={{
                    backgroundColor: metodoPago === met.id ? 'rgba(59, 130, 246, 0.25)' : '#020617',
                    border: metodoPago === met.id ? '1.5px solid #3b82f6' : '1.5px solid #1e293b',
                    color: metodoPago === met.id ? '#60a5fa' : '#94a3b8',
                    padding: '8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  {met.icon} {met.id}
                </button>
              ))}
            </div>
          </div>

          {metodoPago === 'Efectivo' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', backgroundColor: '#020617', padding: '10px', borderRadius: '14px', border: '1px solid #1e293b' }}>
              <div>
                <label style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>Efectivo Recibido</label>
                <input
                  type="number"
                  placeholder="$ 0"
                  value={efectivoRecibido}
                  onChange={(e) => setEfectivoRecibido(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #3b82f6', borderRadius: '8px', padding: '6px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box', marginTop: '4px' }}
                />
              </div>
              <div style={{ textAlign: 'right' }}>
                <label style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>Cambio (Vueltas)</label>
                <p style={{ fontSize: '15px', fontWeight: '900', color: cambioVueltas >= 0 ? '#34d399' : '#f87171', margin: '6px 0 0 0' }}>
                  ${cambioVueltas >= 0 ? cambioVueltas.toLocaleString() : '0'}
                </p>
              </div>
            </div>
          )}

          <div style={styles.totalBox}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8' }}>Total a Pagar:</span>
            <span style={{ fontSize: '20px', fontWeight: '900', color: '#34d399' }}>${total.toLocaleString()}</span>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={handleCheckout}
            style={{
              ...styles.checkoutBtn,
              opacity: cart.length === 0 ? 0.5 : 1,
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            COMPLETAR VENTA & FACTURAR
          </button>
        </div>

      </div>

    </div>
  );
}