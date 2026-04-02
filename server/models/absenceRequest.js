const mongoose = require('mongoose');
const absenceSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    reason: {
        type: String,
        required: [true, 'please add reason']
    },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
});
module.exports = mongoose.model('Absence', absenceSchema);