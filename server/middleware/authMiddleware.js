const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');
            
            if (!req.user) {
                return res.status(401).json({ message: 'Không tìm thấy người dùng' });
            }

            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Truy cập bị từ chối, token không hợp lệ' });
        }
    } else {
        return res.status(401).json({ message: 'Truy cập bị từ chối, không có token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        const userRole = req.user.role ? req.user.role.toLowerCase() : '';
        console.log(`DEBUG AUTHORIZE: User Role: [${req.user.role}] | Allowed Roles: [${roles.join(', ')}]`);
        
        if (userRole === 'admin' || roles.includes(req.user.role)) {
            return next();
        }

        return res.status(403).json({
            message: `Quyền hạn ${req.user.role} không được phép truy cập đường dẫn này`
        });
    };
};

module.exports = { protect, authorize };
