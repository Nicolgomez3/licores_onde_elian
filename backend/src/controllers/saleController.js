const Sale = require('../models/saleModel');

// Registrar una nueva venta en el POS
const createSale = async (req, res) => {
    try {
        let { usuario_id, total, items, metodo_pago } = req.body;

        // Si el frontend no manda usuario_id, le asignamos 1 por defecto para evitar el error 500
        if (!usuario_id) {
            req.body.usuario_id = 1;
        }

        // Validaciones básicas de total y carrito
        if (!total || !items || items.length === 0) {
            return res.status(400).json({ message: 'Datos de venta incompletos o carrito vacío.' });
        }

        const saleId = await Sale.createSale(req.body);

        res.status(201).json({
            message: '¡Venta registrada con éxito y stock actualizado! 🍻',
            saleId
        });
    } catch (error) {
        console.error('Error al procesar la venta:', error);
        res.status(500).json({ message: 'Error interno del servidor al procesar la venta.', error: error.message });
    }
};

// Obtener todas las ventas (Historial)
const getSales = async (req, res) => {
    try {
        const sales = await Sale.getAllSales();
        res.json(sales);
    } catch (error) {
        console.error('Error al obtener ventas:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el historial de ventas.' });
    }
};

// Obtener una venta específica con su detalle (para factura formal / reimpresión)
const getSaleById = async (req, res) => {
    try {
        const { id } = req.params;
        const sale = await Sale.getSaleById(id);

        if (!sale) {
            return res.status(404).json({ message: 'Venta no encontrada.' });
        }

        res.json(sale);
    } catch (error) {
        console.error('Error al obtener el detalle de la venta:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener la factura.' });
    }
};

module.exports = {
    createSale,
    getSales,
    getSaleById
};