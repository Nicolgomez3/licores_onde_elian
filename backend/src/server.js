const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const saleRoutes = require('./routes/saleRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Registrar rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/products', productRoutes);

// Endpoint de verificación (Health Check)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API REST de Licores Donde Elian funcionando correctamente 🍻' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});