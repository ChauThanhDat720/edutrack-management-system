const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Submission = require('./models/Submission');

dotenv.config();

const checkSubmissions = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const submission = await Submission.findOne({});
        if (submission) {
            console.log('SUBMISSION FOUND:');
            console.log(JSON.stringify(submission, null, 2));
        } else {
            console.log('NO SUBMISSION FOUND');
        }
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

checkSubmissions();
