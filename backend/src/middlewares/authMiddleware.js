const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    // El token suele venir como "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Acceso denegado. No se proporcionó un token de autenticación.' });
    }

    try {
        const secret = process.env.JWT_SECRET || 'secreto_super_seguro';
        const verified = jwt.verify(token, secret);
        
        // Guardamos los datos del usuario decodificados en la petición para usarlos luego
        req.user = verified;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token inválido o expirado.' });
    }
};

// Middleware opcional para verificar si es Administrador
const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user && req.user.rol === 'Administrador') {
            next();
        } else {
            return res.status(403).json({ message: 'Acceso denegado. Se requieren privilegios de Administrador.' });
        }
    });
};

module.exports = {
    verifyToken,
    verifyAdmin
};