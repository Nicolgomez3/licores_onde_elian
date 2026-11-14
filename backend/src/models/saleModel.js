const db = require('../config/db');

const Sale = {
    // Registrar una venta completa con su detalle, métodos de pago y descuento de stock
    createSale: async (saleData) => {
        const connection = await db.getConnection(); // Conexión exclusiva para la transacción
        
        try {
            await connection.beginTransaction();

            let { 
                usuario_id, 
                subtotal, 
                descuento, 
                total, 
                monto_recibido, 
                cambio, 
                metodo_pago, // <-- Soporte para Efectivo, Nequi, Tarjeta
                items 
            } = saleData;

            // 🛡️ Blindaje: Si no viene usuario_id o es inválido, asignamos 1 por defecto
            usuario_id = usuario_id || 1;

            // 🛡️ Blindaje por si el subtotal no se envió pero tenemos el total
            subtotal = subtotal || total || 0;
            monto_recibido = monto_recibido || total || 0;
            cambio = cambio || 0;

            // 1. Insertar la cabecera de la venta
            const [saleResult] = await connection.query(`
                INSERT INTO ventas 
                (usuario_id, subtotal, descuento, total, monto_recibido, cambio, metodo_pago, estado) 
                VALUES (?, ?, ?, ?, ?, ?, ?, 'completada')
            `, [
                usuario_id, 
                subtotal, 
                descuento || 0, 
                total, 
                monto_recibido, 
                cambio, 
                metodo_pago || 'Efectivo'
            ]);

            const ventaId = saleResult.insertId;

            // 2. Iterar sobre cada producto comprado para guardar detalle y actualizar stock
            for (const item of items) {
                const productoId = item.producto_id || item.id;
                const cantidad = Number(item.cantidad) || 1;
                const precioUnitario = Number(item.precio_unitario || item.precio || 0);
                const precioCompra = Number(item.precio_compra || 0);
                const itemSubtotal = cantidad * precioUnitario;

                // Insertar detalle de venta
                await connection.query(`
                    INSERT INTO detalle_ventas 
                    (venta_id, producto_id, cantidad, precio_compra, precio_unitario, subtotal) 
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [ventaId, productoId, cantidad, precioCompra, precioUnitario, itemSubtotal]);

                // Actualizar (restar) el stock actual del producto
                await connection.query(`
                    UPDATE productos 
                    SET stock_actual = stock_actual - ? 
                    WHERE id = ?
                `, [cantidad, productoId]);

                // Registrar el movimiento en el kárdex / auditoría de inventario (con manejo seguro por si falla la tabla kárdex)
                try {
                    const [prodRows] = await connection.query('SELECT stock_actual FROM productos WHERE id = ?', [productoId]);
                    if (prodRows && prodRows.length > 0) {
                        const stockNuevo = prodRows[0].stock_actual;
                        const stockAnterior = stockNuevo + cantidad;

                        await connection.query(`
                            INSERT INTO movimientos_inventario 
                            (producto_id, usuario_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo)
                            VALUES (?, ?, 'salida_venta', ?, ?, ?, ?)
                        `, [productoId, usuario_id, -cantidad, stockAnterior, stockNuevo, `Venta #${ventaId}`]);
                    }
                } catch (errKardex) {
                    // Si la tabla movimientos_inventario no existe o tiene otra estructura, la venta no se detiene
                }
            }

            // Confirmar transacción en la base de datos
            await connection.commit();
            return ventaId;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            // Se asegura de liberar la conexión de vuelta al pool
            connection.release();
        }
    },

    // Obtener historial de ventas general
    getAllSales: async () => {
        const [rows] = await db.query(`
            SELECT v.*, u.nombre AS cajero 
            FROM ventas v
            LEFT JOIN usuarios u ON v.usuario_id = u.id
            ORDER BY v.created_at DESC
        `);
        return rows;
    },

    // Obtener una venta específica con todos sus productos (para reimpresión de factura)
    getSaleById: async (id) => {
        const [sale] = await db.query(`
            SELECT v.*, u.nombre AS cajero 
            FROM ventas v
            LEFT JOIN usuarios u ON v.usuario_id = u.id
            WHERE v.id = ?
        `, [id]);

        if (sale.length === 0) return null;

        const [items] = await db.query(`
            SELECT dv.*, p.nombre, p.codigo_barras 
            FROM detalle_ventas dv
            JOIN productos p ON dv.producto_id = p.id
            WHERE dv.venta_id = ?
        `, [id]);

        return {
            ...sale[0],
            items
        };
    }
};

module.exports = Sale;