const mongoose = require('mongoose');
const { Schema } = mongoose;

const MessageSchema = new Schema({
  sender: { type: Schema.Types.ObjectId, required: true, refPath: 'senderRole' },
  receiver: { type: Schema.Types.ObjectId, required: true, refPath: 'receiverRole' },
  senderRole: { type: String, required: true, enum: ['Admin', 'Farmer'] },
  receiverRole: { type: String, required: true, enum: ['Admin', 'Farmer'] },
  content: { type: String, required: true },
  read: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema); 