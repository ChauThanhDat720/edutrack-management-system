const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Class = require('../models/Class'); // We need this to create classes
const connectDB = require('../config/db');

// Load env vars
dotenv.config();

// Connect to DB
connectDB();

const seedData = async () => {
    try {
        // Clear all non-admin users
        console.log('Clearing old data (excluding Admins)...');
        await User.deleteMany({ role: { $ne: 'admin' } });

        // Clear existing classes
        await Class.deleteMany();

        console.log('Old data cleared.');

        // 1. Create 3 mock classes
        const classes = await Class.insertMany([
            { name: '10A1', description: 'Toán Lý Hóa' },
            { name: '10A2', description: 'Văn Sử Địa' },
            { name: '11B1', description: 'Khối Cơ bản' }
        ]);
        console.log('Classes created.');

        // 2. Create 5 Teachers
        const teachersToCreate = [
            { name: 'Teacher Math', email: 'math@school.com', password: 'password123', role: 'teacher', teacherDetails: { subject: 'Toán', assignedClasses: [classes[0]._id, classes[2]._id] } },
            { name: 'Teacher Physics', email: 'physics@school.com', password: 'password123', role: 'teacher', teacherDetails: { subject: 'Vật Lý', assignedClasses: [classes[0]._id] } },
            { name: 'Teacher Literature', email: 'lit@school.com', password: 'password123', role: 'teacher', teacherDetails: { subject: 'Ngữ Văn', assignedClasses: [classes[1]._id] } },
            { name: 'Teacher English', email: 'english@school.com', password: 'password123', role: 'teacher', teacherDetails: { subject: 'Tiếng Anh', assignedClasses: [classes[0]._id, classes[1]._id, classes[2]._id] } },
            { name: 'Teacher Chemistry', email: 'chem@school.com', password: 'password123', role: 'teacher', teacherDetails: { subject: 'Hóa Học', assignedClasses: [classes[0]._id] } },
        ];

        // We use create instead of insertMany so the pre-save hook runs for password hashing
        console.log('Creating 5 teachers...');
        for (let t of teachersToCreate) {
            await User.create(t);
        }

        // 3. Create 15 Students
        console.log('Creating 15 students...');
        for (let i = 1; i <= 15; i++) {
            // Assign student to a random class from the 3 created
            const randomClass = classes[i % 3];

            await User.create({
                name: `Student ${i}`,
                email: `student${i}@school.com`,
                password: 'password123',
                role: 'student',
                studentDetails: {
                    studentId: `HS2024${String(i).padStart(3, '0')}`,
                    class: randomClass._id,
                    grades: [
                        { subject: 'Toán', score: Math.floor(Math.random() * 5) + 5 },
                        { subject: 'Văn', score: Math.floor(Math.random() * 5) + 5 }
                    ]
                }
            });
        }

        console.log('============================================');
        console.log('✅ Seed Data Completed Successfully!');
        console.log(`Created 3 Classes, 5 Teachers, and 15 Students.`);
        console.log('============================================');

        process.exit();
    } catch (error) {
        console.error(`❌ Error with data import: ${error.message}`);
        process.exit(1);
    }
};

seedData();
