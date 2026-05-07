const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Assignment = require('./models/Assignment');

dotenv.config();

const checkAssignments = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const assignment = await Assignment.findOne({});
        if (assignment) {
            console.log('ASSIGNMENT FOUND:');
            console.log(JSON.stringify(assignment, null, 2));
        } else {
            console.log('NO ASSIGNMENT FOUND');
        }
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

checkAssignments();
