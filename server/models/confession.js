const mongoose = require('mongoose');
const confessionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxLength: [300, 'Title cannot be more than 300 characters']
    },
    content: {
        type: String,
        required: [true, 'please add content']
    },
    status: {
        type: String,
        enum: ['approved', 'rejected', 'pending'],
        default: 'pending'
    },
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true

    },
    media: [
        {
            url: String,
            public_id: String,
            resource_type: {
                type: String,
                enum: ['image', 'video'],
                default: 'image'
            }
        }
    ]
}, { timestamps: true });

confessionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Confession', confessionSchema);