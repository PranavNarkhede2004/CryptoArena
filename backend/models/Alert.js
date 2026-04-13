import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symbol: {
    type: String,
    required: true
  },
  condition: {
    type: String,
    enum: ['ABOVE', 'BELOW'],
    required: true
  },
  targetPrice: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  triggeredAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Alert', alertSchema);
