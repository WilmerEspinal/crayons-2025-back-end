const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: 'Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido' });
    }
};

const checkChangePasswordRequired = async (req, res, next) => {
    if (req.user.change_password_required) {
        return res.status(403).json({ 
            message: 'Se requiere cambio de contraseña',
            requirePasswordChange: true
        });
    }
    next();
};

module.exports = {
    verifyToken,
    checkChangePasswordRequired
}; 