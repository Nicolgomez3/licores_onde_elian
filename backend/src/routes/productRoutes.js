const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Obtener productos sin pedir token
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM productos');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener productos' });
  }
});

// Registrar productos sin pedir token
router.post('/', async (req, res) => {
  try {
    const {
      codigo_barras,
      nombre,
      categoria_id,
      precio_compra,
      precio_venta,
      stock_actual,
      stock_minimo
    } = req.body;

    const categoriaFinal = Number(categoria_id) || 1;

    // Si se registra con categoría 3 (Mecato), verificamos si existe tabla categorias y aseguramos el registro
    if (categoriaFinal === 3) {
      try {
        await db.query(
          'INSERT IGNORE INTO categorias (id, nombre) VALUES (?, ?)',
          [3, 'Mecato']
        );
      } catch (catError) {
        // Si la base de datos no usa tabla categorias separada, continuamos sin bloquear el registro
        if (catError.code !== 'ER_NO_SUCH_TABLE') {
          console.warn('Aviso al verificar categoría Mecato:', catError.message);
        }
      }
    }

    const [result] = await db.query(
      'INSERT INTO productos (codigo_barras, nombre, categoria_id, precio_compra, precio_venta, stock_actual, stock_minimo) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        codigo_barras,
        nombre,
        categoriaFinal,
        precio_compra,
        precio_venta,
        stock_actual,
        stock_minimo || 5
      ]
    );

    res.status(201).json({
      message: 'Producto registrado con éxito',
      productId: result.insertId
    });
  } catch (error) {
    console.error('Error al guardar producto:', error);
    res.status(500).json({ message: 'Error al registrar el producto' });
  }
});

// Eliminar un producto por ID con manejo seguro de restricciones
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Intentamos eliminar el producto
    const [result] = await db.query('DELETE FROM productos WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json({ message: '¡Producto eliminado con éxito de la base de datos! 🍻' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);

    // Si MySQL rechaza el borrado por tener ventas asociadas, le damos un mensaje claro a la interfaz
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({
        message: 'No se puede eliminar este producto porque ya tiene ventas registradas en el historial. Puedes dejar su stock en 0.'
      });
    }

    res.status(500).json({ message: 'Error en el servidor al intentar eliminar el producto' });
  }
});

module.exports = router;