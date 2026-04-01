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
    }
}, { timestamps: true });
