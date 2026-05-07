const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate Access Token (short-lived)
const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '10h',
    });
};

// Generate Refresh Token (long-lived)
const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
};

// @desc    Register a user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'Người dùng đã tồn tại' });
        }


        const user = await User.create({
            name,
            email,
            password,
            role,
            profile: req.body.profile,
            studentDetails: req.body.studentDetails,
            teacherDetails: req.body.teacherDetails
        });

        if (user) {
            const token = generateAccessToken(user._id);
            const refreshToken = generateRefreshToken(user._id);

            user.refreshToken = refreshToken;
            await user.save({ validateBeforeSave: false });

            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token,
                refreshToken
            });
        } else {
            res.status(400).json({ message: 'Dữ liệu người dùng không hợp lệ' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Login user / Authenticate
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;


        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Thông tin đăng nhập không chính xác' });
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Thông tin đăng nhập không chính xác' });
        }

        const token = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token,
            refreshToken
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Làm mới Access Token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ message: 'Không tìm thấy Refresh Token' });
        }

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
        } catch (error) {
            return res.status(403).json({ message: 'Refresh Token không hợp lệ' });
        }

        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ message: 'Refresh Token không hợp lệ hoặc đã hết hạn' });
        }

        const newToken = generateAccessToken(user._id);

        res.json({
            success: true,
            token: newToken,
            refreshToken: refreshToken
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Đăng xuất (xóa cấu hình token trong server)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user) {
            user.refreshToken = null;
            await user.save({ validateBeforeSave: false });
        }
        res.status(200).json({ success: true, message: 'Đăng xuất thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Lấy thông tin người dùng hiện tại (từ Token)
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        // req.user đã được gán bởi middleware 'protect'
        res.status(200).json({
            success: true,
            data: req.user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};