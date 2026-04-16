const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2')
const conductRecordSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    recordedBy: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['violation', 'reward'] },
    // category: { type: String, required: true },
    content: { type: String, required: true },
    pointAdjustment: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    conductScore: { type: Number, default: 100 }
}, { timestamps: true });
conductRecordSchema.plugin(mongoosePaginate)
conductRecordSchema.index({ studentId: 1 });
module.exports = mongoose.model('ConductRecord', conductRecordSchema);