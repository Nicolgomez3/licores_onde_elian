const express = require('express');
const router = express.Router();
const db = require('../config/db');

const parseNumber = (val) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  return Number(String(val).replace(/[^0-9.-]+/g, '')) || 0;
};

// Registrar venta alineada con el esquema real de Licores Donde Elian
router.post('/', async (req, res) => {
  const connection = await db.getConnection();
  try {
    const items = req.body.items || req.body.productos || req.body.carrito;
    const total = parseNumber(req.body.total);
    const subtotal = parseNumber(req.body.subtotal) || total;
    const descuento = parseNumber(req.body.descuento) || 0;
    const montoRecibido = parseNumber(req.body.monto_recibido || req.body.montoRecibido) || total;
    const cambio = parseNumber(req.body.cambio) || Math.max(0, montoRecibido - total);
    const metodoPago = req.body.metodo_pago || req.body.metodoPago || 'Efectivo';

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Carrito vacío.' });
    }

    await connection.beginTransaction();

    // 1. Obtener un usuario válido existente (o usar el enviado)
    let usuarioId = parseNumber(req.body.usuario_id);
    if (!usuarioId) {
      const [users] = await connection.query('SELECT id FROM usuarios LIMIT 1');
      if (users && users.length > 0) {
        usuarioId = users[0].id;
      } else {
        throw new Error('No existe ningún usuario registrado en la tabla usuarios para asociar la venta.');
      }
    }

    // 2. Inserción completa en la tabla ventas (incluyendo subtotal, monto_recibido y cambio)
    let ventaId;
    try {
      const [res1] = await connection.query(
        `INSERT INTO ventas 
         (usuario_id, subtotal, descuento, total, monto_recibido, cambio, metodo_pago, estado) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'completada')`,
        [usuarioId, subtotal, descuento, total, montoRecibido, cambio, metodoPago]
      );
      ventaId = res1.insertId;
    } catch (e1) {
      // Respaldo por si la tabla ventas tiene estructura simplificada
      const [res2] = await connection.query(
        'INSERT INTO ventas (usuario_id, subtotal, total, metodo_pago) VALUES (?, ?, ?, ?)',
        [usuarioId, subtotal, total, metodoPago]
      );
      ventaId = res2.insertId;
    }

    // 3. Inserción de detalles de venta y actualización de stock
    for (const item of items) {
      const productoId = item.producto_id || item.id;
      const cantidad = parseNumber(item.cantidad) || 1;
      const precioUnitario = parseNumber(item.precio_unitario || item.precio || item.precioVenta || item.valor || 0);
      const precioCompra = parseNumber(item.precio_compra || 0);
      const itemSubtotal = precioUnitario * cantidad;

      try {
        await connection.query(
          `INSERT INTO detalle_ventas 
           (venta_id, producto_id, cantidad, precio_compra, precio_unitario, subtotal) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [ventaId, productoId, cantidad, precioCompra, precioUnitario, itemSubtotal]
        );
      } catch (errDetalle) {
        await connection.query(
          'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
          [ventaId, productoId, cantidad, precioUnitario, itemSubtotal]
        );
      }

      // Descontar stock actual
      await connection.query(
        'UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?',
        [cantidad, productoId]
      );
    }

    await connection.commit();
    res.status(201).json({ message: '¡Venta registrada con éxito!', ventaId });
  } catch (error) {
    await connection.rollback();
    console.error('ERROR CRÍTICO AL REGISTRAR VENTA:', error);
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
});

// Obtener historial de ventas
router.get('/', async (req, res) => {
  try {
    const [ventas] = await db.query(`
      SELECT v.*, u.nombre_completo AS cajero 
      FROM ventas v
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      ORDER BY v.id DESC
    `);
    const ventasConDetalles = [];

    for (const venta of ventas) {
      const [detalles] = await db.query(`
        SELECT dv.*, 
               COALESCE(dv.precio_unitario, 0) AS precio_unitario,
               COALESCE(dv.subtotal, (dv.cantidad * COALESCE(dv.precio_unitario, 0)), 0) AS subtotal,
               COALESCE(p.nombre, 'Producto') AS producto_nombre
        FROM detalle_ventas dv 
        LEFT JOIN productos p ON dv.producto_id = p.id
        WHERE dv.venta_id = ?
      `, [venta.id]).catch(() => [[]]);

      ventasConDetalles.push({
        ...venta,
        items: detalles
      });
    }

    res.json(ventasConDetalles);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ message: 'Error al obtener historial' });
  }
});

module.exports = router;