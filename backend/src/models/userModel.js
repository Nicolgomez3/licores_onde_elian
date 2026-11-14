const db = require('../config/db');

const User = {
    // Buscar un usuario por su correo electrónico incluyendo su rol
    findByEmail: async (correo) => {
        const [rows] = await db.query(`
            SELECT u.*, r.nombre AS rol_nombre 
            FROM usuarios u 
            JOIN roles r ON u.rol_id = r.id 
            WHERE u.correo = ?
        `, [correo]);
        return rows[0];
    },

    // Crear un nuevo usuario en la tabla usuarios
    create: async (nombre_completo, correo, password_hash, rol_id) => {
        const [result] = await db.query(
            'INSERT INTO usuarios (nombre_completo, correo, password_hash, rol_id) VALUES (?, ?, ?, ?)',
            [nombre_completo, correo, password_hash, rol_id]
        );
        return result.insertId;
    }
};

module.exports = User;