const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Probamos la conexión al arrancar
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error al conectar a la base de datos MySQL (licores_onde_elian_db):', err.message);
        if (err.code === 'ECONNREFUSED') {
            console.error('⚠️ Asegúrate de que MySQL esté encendido y los datos en el archivo .env sean correctos.');
        }
        return;
    }
    if (connection) {
        console.log('✅ ¡Conexión exitosa a la base de datos MySQL: licores_donde_elian_db!');
        connection.release();
    }
});

module.exports = pool.promise();