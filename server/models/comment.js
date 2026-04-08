const mongoose = require('mongoose');
const commentSchema = new mongoose.Schema({
    confession: {
        type: mongoose.Schema.ObjectId,
        ref: 'confession'

    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        require: true
    },
    content: {
        type: String,
        required: [true, 'please add content']
    },
    title: {
        type: String,
    }
}, { timestamps: true });

commentSchema.index({ confession: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
