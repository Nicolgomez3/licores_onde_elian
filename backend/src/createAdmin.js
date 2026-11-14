const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {
        const nombre_completo = 'Administrador Principal';
        const correo = 'admin@licores.com';
        const passwordPlain = '123456'; // Contraseña temporal para pruebas
        const rol_id = 1; // 1 = Administrador

        // 1. Asegurar que exista el rol Administrador (id = 1) para evitar error de llave foránea
        await db.query(
            'INSERT IGNORE INTO roles (id, nombre) VALUES (1, "Administrador"), (2, "Empleado")'
        );

        // 2. Verificar si ya existe el admin para no duplicarlo
        const [existing] = await db.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
        if (existing.length > 0) {
            console.log('⚠️ El usuario administrador ya existe en la base de datos (ID:', existing[0].id, ').');
            process.exit(0);
        }

        // 3. Encriptar la contraseña con Bcrypt
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(passwordPlain, salt);

        // 4. Insertar el administrador en la tabla usuarios
        const [result] = await db.query(
            'INSERT INTO usuarios (nombre_completo, correo, password_hash, rol_id, activo) VALUES (?, ?, ?, ?, TRUE)',
            [nombre_completo, correo, password_hash, rol_id]
        );

        console.log('--------------------------------------------------');
        console.log('✅ ¡Administrador creado exitosamente para Licores Donde Elian!');
        console.log('🆔 ID asignado:', result.insertId);
        console.log('📧 Correo: admin@licores.com');
        console.log('🔑 Contraseña: 123456');
        console.log('--------------------------------------------------');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al crear el administrador:', error.message);
        process.exit(1);
    }
}

createAdmin();