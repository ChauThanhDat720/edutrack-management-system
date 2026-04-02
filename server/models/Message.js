const mongoose = require('mongoose')
const messageSchema = new mongoose.Schema({
    class: { type: mongoose.Schema.ObjectId, ref: 'Class', required: true },
    sender: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['text', 'image', 'file'], default: 'text' }
}, { timestamps: true });
module.exports = mongoose.model('Message', messageSchema);