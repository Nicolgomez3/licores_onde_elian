const db = require('../config/db');

const Product = {
    // Obtener todos los productos activos con su respectiva categoría
    getAll: async () => {
        const [rows] = await db.query(`
            SELECT p.*, c.nombre AS categoria_nombre 
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.estado = 'activo'
        `);
        return rows;
    },

    // Buscar producto por código de barras (ideal para el escáner del POS)
    findByBarcode: async (codigo_barras) => {
        const [rows] = await db.query(`
            SELECT p.*, c.nombre AS categoria_nombre 
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.codigo_barras = ? AND p.estado = 'activo'
        `, [codigo_barras]);
        return rows[0];
    },

    // Buscar producto por ID
    findById: async (id) => {
        const [rows] = await db.query(`
            SELECT p.*, c.nombre AS categoria_nombre 
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.id = ?
        `, [id]);
        return rows[0];
    },

    // Crear un nuevo producto
    create: async (productData) => {
        const {
            codigo_barras, nombre, descripcion, categoria_id,
            marca, proveedor_id, precio_compra, precio_venta,
            stock_actual, stock_minimo, unidades_por_caja
        } = productData;

        const [result] = await db.query(`
            SELECT p.*, c.nombre AS categoria_nombre 
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.codigo_barras = ? AND p.estado = 'activo'
        `, [codigo_barras]); // Espera, esta es la consulta de inserción de abajo:
        
        // Reemplazando con la inserción correcta:
        const [resultInsert] = await db.query(`
            INSERT INTO productos 
            (codigo_barras, nombre, descripcion, categoria_id, marca, proveedor_id, precio_compra, precio_venta, stock_actual, stock_minimo, unidades_por_caja) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            codigo_barras, nombre, descripcion || null, categoria_id,
            marca || null, proveedor_id || null, precio_compra, precio_venta,
            stock_actual || 0, stock_minimo || 5, unidades_por_caja || 1
        ]);

        return resultInsert.insertId;
    },

    // Actualizar stock (clave para restar existencias en las ventas)
    updateStock: async (id, nuevoStock) => {
        await db.query(
            'UPDATE productos SET stock_actual = ? WHERE id = ?',
            [nuevoStock, id]
        );
    }
};

module.exports = Product;