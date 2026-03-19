const mongoose = require('mongoose');
const User = require('./models/User');
const Class = require('./models/Class');
const Session = require('./models/Session');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const student = await User.findOne({ role: 'student' }).select('name email studentDetails');
    console.log("Student:", student);
    if (student && student.studentDetails.class) {
        const cls = await Class.findById(student.studentDetails.class);
        console.log("Class:", cls);
        const sessions = await Session.find({ classId: student.studentDetails.class });
        console.log("Number of sessions:", sessions.length);
        if (sessions.length > 0) {
            console.log("First session:", sessions[0]);
        }
    }
    process.exit(0);
}
check();
