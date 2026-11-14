import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login'; // <--- 1. Asegúrate de importar tu componente Login
import POS from './pages/POS';
import Inventario from './pages/Inventario';
import Caja from './pages/Caja';
import HistorialVentas from './pages/HistorialVentas';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 2. Registra la ruta de login aquí */}
        <Route path="/login" element={<Login />} />
        
        {/* Tus otras rutas existentes */}
        <Route path="/" element={<POS />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/caja" element={<Caja />} />
        <Route path="/historial" element={<HistorialVentas />} />
        <Route path="/inventario" element={<Inventario />} />
      </Routes>
    </BrowserRouter>
  );
}