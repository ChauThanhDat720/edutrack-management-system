const express = require('express');
const router = express.Router();
const {
    createClass,
    getClasses,
    getClassById,
    addStudent,
    manageStudents,
    updateClass
} = require('../controllers/classController');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/classes:
 *   get:
 *     summary: Get all classes with teacher info
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of classes
 *   post:
 *     summary: Create a new class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               className:
 *                 type: string
 *                 example: 10A1
 *               teacher:
 *                 type: string
 *                 description: Teacher's ObjectId
 *               room:
 *                 type: string
 *                 example: "Room 301"
 *               schedule:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     dayOfWeek:
 *                       type: string
 *                       example: Monday
 *                     startTime:
 *                       type: string
 *                       example: "07:30"
 *                     endTime:
 *                       type: string
 *                       example: "09:00"
 *     responses:
 *       201:
 *         description: Class created
 */
router.route('/')
    .get(protect, getClasses)
    .post(protect, authorize('admin'), createClass);

/**
 * @swagger
 * /api/classes/{id}:
 *   get:
 *     summary: Get single class by ID
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Class details
 *       404:
 *         description: Not found
 */
router.route('/:id')
    .get(protect, getClassById)
    .put(protect, authorize('admin'), updateClass);

/**
 * @swagger
 * /api/classes/{id}/add-student:
 *   put:
 *     summary: Add a student to the class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *             properties:
 *               studentId:
 *                 type: string
 *                 description: Student's ObjectId
 *     responses:
 *       200:
 *         description: Student added
 *       400:
 *         description: Student already in class
 *       404:
 *         description: Class not found
 */
router.route('/:id/add-student')
    .put(protect, authorize('admin'), addStudent);

// PATCH /api/classes/:id/students — add or remove a student
router.route('/:id/students')
    .patch(protect, authorize('admin'), manageStudents);

module.exports = router;
