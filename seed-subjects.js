const mongoose = require('mongoose');
const Subject = require('./server/models/Subject');
require('dotenv').config({ path: './server/.env' });

const seedSubjects = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const subjects = [
            { name: 'Toán học', code: 'MATH' },
            { name: 'Vật lý', code: 'PHYS' },
            { name: 'Hóa học', code: 'CHEM' },
            { name: 'Ngữ văn', code: 'LIT' },
            { name: 'Tiếng Anh', code: 'ENG' },
            { name: 'Sinh học', code: 'BIO' },
            { name: 'Lịch sử', code: 'HIS' },
            { name: 'Địa lý', code: 'GEO' }
        ];

        for (const s of subjects) {
            await Subject.findOneAndUpdate({ code: s.code }, s, { upsert: true });
        }
        console.log('Subjects seeded successfully');
        process.exit();
    } catch (error) {
        console.error('Error seeding subjects:', error);
        process.exit(1);
    }
};

seedSubjects();
