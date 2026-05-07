const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Assignment = require('./models/Assignment');

dotenv.config();

const checkAllAssignments = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const assignments = await Assignment.find({});
        console.log(`TOTAL ASSIGNMENTS: ${assignments.length}`);
        assignments.forEach((a, i) => {
            console.log(`--- Assignment ${i+1} ---`);
            console.log(JSON.stringify(a, null, 2));
        });
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

checkAllAssignments();
