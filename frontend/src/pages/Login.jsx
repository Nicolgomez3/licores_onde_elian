import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { styles } from '../styles/Login.styles';
import logoOriginal from '../assets/logo.png'; // Importamos tu logo real desde assets


export default function Login() {
  const [email, setEmail] = useState('admin@licores.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      localStorage.setItem('token', 'fake-jwt-token-demo');
      localStorage.setItem('user', JSON.stringify({ nombre: 'Administrador Elian', correo: email }));
      navigate('/pos');
    }, 500);
  };

  return (
    <div style={styles.container}>
      <div style={styles.glow1} />

      <div style={styles.card}>
        <div style={styles.header}>
          {/* Logo Original Cargado */}
          <div style={styles.logoContainer}>
            <img 
              src={logoOriginal} 
              alt="Licores Donde Elian Logo" 
              style={styles.logoImage} 
            />
          </div>

          <span style={styles.badge}>PIQUETEADERÍA & LICORERÍA 24H</span>
          <h1 style={styles.title}>Licores Donde Elian</h1>
          <p style={styles.subtitle}>Acceso al Sistema POS e Inventario</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Correo Electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="admin@licores.com"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'INGRESANDO...' : 'INGRESAR AL SISTEMA'}
          </button>
        </form>

        <div style={styles.footer}>
          <span>🔒 Acceso seguro cifrado para gestión comercial</span>
        </div>
      </div>
    </div>
  );
}