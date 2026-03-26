const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('../config/db');

const path = require('path');

// Load env vars
// Use __dirname to securely resolve the path to the .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAdmin = async () => {
    try {
        // Connect to database
        await connectDB();

        // Check if admin already exists
        const adminExists = await User.findOne({ email: 'admin@test.com' });

        if (adminExists) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Create admin user
        const adminUser = await User.create({
            name: 'Admin System',
            email: 'admin@test.com',
            password: 'admin123',
            role: 'admin'
        });

        console.log('Admin user created successfully:', adminUser.email);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin user:', error);
        process.exit(1);
    }
};

seedAdmin();
