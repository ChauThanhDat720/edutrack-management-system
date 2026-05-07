const User = require('../models/User');
const { broadcast } = require('../config/socket');
const { logActivity } = require('../utils/activityLogger');

// @desc    Lấy tất cả người dùng (có thể lọc theo role: student/teacher)
// @route   GET /api/users
exports.getUsers = async (req, res) => {
    try {
        const { role, search } = req.query;
        let filter = role ? { role } : {};
        
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const page = parseInt(req.query.page) || 1;
        const isPaginationFalse = req.query.pagination === 'false';
        const limit = parseInt(req.query.limit) || 20;
        const option = {
            page: page,
            limit: limit,
            sort: { createdAt: -1 },
            pagination: !isPaginationFalse
        };
        const result = await User.paginate(filter, option);
        res.status(200).json({
            success: true,
            data: result.docs,
            totalDocs: result.totalDocs,
            totalPages: result.totalPages,
            currentPage: result.page,
            hasNextPage: result.hasNextPage,
            prevPage: result.prevPage
        });
        // const users = await User.find(filter).select('-password');
        // res.status(200).json({ success: true, count: users.length, data: users });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Cập nhật thông tin người dùng
// @route   PUT /api/users/:id
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).select('-password');

        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });


        broadcast('users_updated', { message: `Cập nhật người dùng: ${user.name}` });

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Xóa người dùng
// @route   DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });


        broadcast('users_updated', { message: `Xóa người dùng: ${user.name}` });

        res.status(200).json({ success: true, message: 'Đã xóa người dùng thành công' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Tạo người dùng mới (Dành cho Admin)
// @route   POST /api/users
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Email đã tồn tại' });
        }

        // Làm sạch studentDetails
        if (req.body.studentDetails) {
            if (!req.body.studentDetails.className) {
                req.body.studentDetails.className = null;
            }
            if (!req.body.studentDetails.studentId) {
                delete req.body.studentDetails.studentId;
            }
        }

        if (req.body.teacherDetails) {
            if (req.body.teacherDetails.assignedClasses === "") {
                delete req.body.teacherDetails.assignedClasses;
            }
        }

        const user = await User.create(req.body);
        console.log('DEBUG CREATED USER:', JSON.stringify({
            id: user._id,
            email: user.email,
            role: user.role,
            passwordHashed: !!user.password
        }, null, 2));

        // Ghi nhật ký vào ActivityLog
        await logActivity({
            userId: req.user.id,
            action: 'TẠO',
            module: 'NGƯỜI DÙNG',
            targetId: user._id,
            description: `Đã tạo người dùng mới: ${user.name} (${user.role})`,
            details: { email: user.email, role: user.role }
        });

        broadcast('users_updated', { message: `Tạo người dùng mới: ${user.name}` });

        res.status(201).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('LỖI TẠO NGƯỜI DÙNG:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};