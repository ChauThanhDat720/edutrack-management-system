const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Vui lòng nhập tên'] },
    email: {
        type: String,
        index: true,
        unique: true,
        required: [true, 'Vui lòng nhập email'],
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Vui lòng nhập email hợp lệ']
    },
    password: { type: String, required: [true, 'Vui lòng nhập mật khẩu'], minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'], select: false },
    role: { type: String, enum: { values: ['admin', 'teacher', 'student'], message: 'Quyền không hợp lệ' }, default: 'student' },
    profile: {
        phoneNumber: String,
        address: String,
        gender: { type: String, enum: ['Male', 'Female', 'Other'] }
    },
    studentDetails: {
        studentId: { type: String, unique: true, sparse: true, index: true },
        grade: { type: Number, min: 1, max: 12 },
        className: { type: String, default: null },
        class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', default: null },

    },
    teacherDetails: {
        subject: String,
        assignedClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
        maxClasses: { type: Number, default: 2 },
        allowedGrades: [{ type: Number }]
    },
    refreshToken: { type: String }
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.password || !this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};
userSchema.plugin(mongoosePaginate);
userSchema.index({ role: 1 });
userSchema.index({ 'studentDetails.className': 1 });

module.exports = mongoose.model('User', userSchema);
