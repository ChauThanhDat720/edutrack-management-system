const express = require('express');
const router = express.Router();
const { getUsers, updateUser, deleteUser, createUser } = require('../controllers/userController');
const { importFromExcel, downloadTemplate } = require('../controllers/importController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// ─── Import Routes (must be declared BEFORE the generic /:id route) ───────────
router.get('/excel-template', protect, authorize('admin'), downloadTemplate);
router.post('/import-excel', protect, authorize('admin'), upload.single('file'), importFromExcel);

// Tất cả các route dưới đây đều yêu cầu đăng nhập và quyền Admin
router.use(protect);
router.use(authorize('admin'));

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Retrieve a list of users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, teacher, student]
 *         description: Default gets all, filter by role if needed
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden (Admin role required)
 */
router.route('/')
    .get(getUsers)
    .post(createUser);

router.route('/:id')
    .put(updateUser)
    .delete(deleteUser);

module.exports = router;