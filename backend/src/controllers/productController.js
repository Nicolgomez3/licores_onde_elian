const Product = require('../models/productModel');

// Listar todos los productos activos
const getProducts = async (req, res) => {
    try {
        const products = await Product.getAll();
        res.json(products);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener productos.' });
    }
};

// Buscar producto por código de barras
const getProductByBarcode = async (req, res) => {
    try {
        const { barcode } = req.params;
        const product = await Product.findByBarcode(barcode);
        
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado con ese código de barras.' });
        }

        res.json(product);
    } catch (error) {
        console.error('Error al buscar producto:', error);
        res.status(500).json({ message: 'Error interno del servidor al buscar el producto.' });
    }
};

// Registrar un nuevo producto
const createProduct = async (req, res) => {
    try {
        const { codigo_barras, nombre, precio_compra, precio_venta, categoria_id } = req.body;

        // Validar campos obligatorios básicos
        if (!codigo_barras || !nombre || !precio_compra || !precio_venta || !categoria_id) {
            return res.status(400).json({ message: 'Faltan campos obligatorios para registrar el producto.' });
        }

        // Verificar si ya existe un producto con el mismo código de barras
        const existingProduct = await Product.findByBarcode(codigo_barras);
        if (existingProduct) {
            return res.status(400).json({ message: 'Ya existe un producto registrado con este código de barras.' });
        }

        const productId = await Product.create(req.body);

        res.status(201).json({
            message: 'Producto registrado exitosamente 📦',
            productId
        });
    } catch (error) {
        console.error('Error al registrar producto:', error);
        res.status(500).json({ message: 'Error interno del servidor al registrar el producto.' });
    }
};

module.exports = {
    getProducts,
    getProductByBarcode,
    createProduct
};