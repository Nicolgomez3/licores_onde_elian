const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Registrar un usuario
const register = async (req, res) => {
    try {
        const { nombre_completo, correo, password, rol_id } = req.body;

        // Verificar si el usuario ya existe
        const existingUser = await User.findByEmail(correo);
        if (existingUser) {
            return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
        }

        // Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Rol por defecto: 2 (Empleado) si no se envía rol_id
        const userRolId = rol_id || 2; 

        // Guardar usuario en la base de datos
        const userId = await User.create(nombre_completo, correo, password_hash, userRolId);

        res.status(201).json({
            message: 'Usuario registrado exitosamente 🚀',
            userId
        });
    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ message: 'Error interno del servidor al registrar usuario.' });
    }
};

// Iniciar sesión (Login)
const login = async (req, res) => {
    try {
        const { correo, password } = req.body;

        // Buscar el usuario por correo
        const user = await User.findByEmail(correo);
        if (!user) {
            return res.status(400).json({ message: 'Credenciales inválidas (correo o contraseña incorrectos).' });
        }

        // Verificar si el usuario está activo
        if (!user.activo) {
            return res.status(403).json({ message: 'Este usuario se encuentra inactivo.' });
        }

        // Verificar la contraseña usando password_hash de la BD
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales inválidas (correo o contraseña incorrectos).' });
        }

        // Generar Token JWT
        const token = jwt.sign(
            { id: user.id, correo: user.correo, rol: user.rol_nombre },
            process.env.JWT_SECRET || 'secreto_super_seguro',
            { expiresIn: '8h' }
        );

        res.json({
            message: '¡Bienvenido de nuevo a Licores Donde Elian! 🍻',
            token,
            user: {
                id: user.id,
                nombre_completo: user.nombre_completo,
                correo: user.correo,
                rol: user.rol_nombre
            }
        });
    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ message: 'Error interno del servidor al iniciar sesión.' });
    }
};

module.exports = {
    register,
    login
};