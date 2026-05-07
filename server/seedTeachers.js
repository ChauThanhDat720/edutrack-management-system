const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();

const subjects = [
    'Toán', 'Lý', 'Hóa', 'Sinh', 'Văn', 
    'Anh', 'Sử', 'Địa', 'GDCD', 'Thể dục'
];

const seedTeachers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        const newTeachers = [];

        for (let i = 0; i < subjects.length; i++) {
            const subject = subjects[i];
            
            // Create 3 teachers per subject
            for (let j = 1; j <= 3; j++) {
                const name = `Giáo viên ${subject} ${j}`;
                const email = `gv_${subject.toLowerCase().replace(/đ/g, 'd').replace(/[^a-z]/g, '')}${j}@school.edu.vn`;
                
                // Random allowedGrades: either [10], [11], [12], or [10, 11, 12]
                let allowedGrades = [10, 11, 12];
                const rand = Math.random();
                if (rand < 0.25) allowedGrades = [10];
                else if (rand < 0.5) allowedGrades = [11];
                else if (rand < 0.75) allowedGrades = [12];

                newTeachers.push({
                    name,
                    email,
                    password: hashedPassword,
                    role: 'teacher',
                    phone: `090${Math.floor(Math.random() * 9000000) + 1000000}`,
                    status: 'active',
                    teacherDetails: {
                        subject: subject,
                        maxClasses: Math.floor(Math.random() * 3) + 2, // 2 to 4 classes
                        allowedGrades: allowedGrades,
                        assignedClasses: []
                    }
                });
            }
        }

        // Delete old teachers (except admin)
        // Only deleting the test ones we are about to create to avoid wiping out real ones
        // Actually, let's just insert these new ones. It might throw duplicate key error if we run it multiple times.
        // Let's delete existing test teachers by email pattern
        await User.deleteMany({ email: { $regex: /^gv_/ } });

        await User.insertMany(newTeachers);
        
        console.log(`Successfully generated ${newTeachers.length} test teachers!`);
        process.exit();
    } catch (error) {
        console.error('Error seeding teachers:', error);
        process.exit(1);
    }
};

seedTeachers();
