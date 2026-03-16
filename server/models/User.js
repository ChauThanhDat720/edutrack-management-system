const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['admin', 'teacher', 'student'],
        default: 'student'
    },
    profile: {
        phoneNumber: {
            type: String
        },
        address: {
            type: String
        },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other']
        }
    },
    studentDetails: {
        studentId: {
            type: String
        },
        grade: {
            type: Number,
            min: 1,
            max: 12
        },
        class: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class'
        },
        grades: {
            type: Array,
            default: []
        }
    },
    teacherDetails: {
        subject: {
            type: String
        },
        assignedClasses: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class'
        }]
    }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
