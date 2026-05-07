const express = require('express');
const http = require('http');
const socketConfig = require('./config/socket');
const dotenv = require('dotenv');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const announcementRoutes = require('./routes/announcementRoutes');
// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: 'Quá nhiều yêu cầu đăng nhập, vui lòng thử lại sau 15 phút.' }
});

const server = http.createServer(app);

// Initialize Socket.io
socketConfig.init(server);

const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

// Middleware
app.use(cors());
app.use(express.json());
// app.use('/api/', globalLimiter);
// app.use('/api/auth', authLimiter);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/sessions', require('./routes/sessionRoutes'));
app.use('/api/grades', require('./routes/gradeRoutes'));
app.use('/api/confession', require('./routes/confessionRoutes'));
app.use('/api/comment', require('./routes/commentRoutes'));
app.use('/api/absence', require('./routes/absenceRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/conducts', require('./routes/conductRoutes'));
app.use('/api/reschedule', require('./routes/rescheduleRoutes'));
app.use('/api/activity', require('./routes/activityRoutes'));
app.use('/api/submission', require('./routes/submissionRoutes'))
app.use('/api/assignments', require('./routes/assignmentRoutes'))
app.use('/api/upload', require('./routes/uploadRoutes'))
app.use('/api/files', require('./routes/fileRoutes'))
app.use('/api/curriculums', require('./routes/curriculumRoutes'))


const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
