import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Al recargar la página, revisamos de forma segura si hay token y datos
        try {
            const storedUser = localStorage.getItem('user');
            const token = localStorage.getItem('token');
            
            if (storedUser && storedUser !== "undefined" && token) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Error al leer localStorage:", error);
            localStorage.clear();
        } finally {
            setLoading(false);
        }
    }, []);

    const login = async (correo, password) => {
        try {
            const response = await api.post('/auth/login', { correo, password });
            const { token, usuario } = response.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(usuario));
            setUser(usuario);
            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                message: error.response?.data?.message || 'Error al iniciar sesión' 
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);