import mongoose from 'mongoose';

const tradeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coin: {
    type: String,
    required: true
  },
  symbol: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['BUY', 'SELL'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  fee: {
    type: Number,
    default: 0
  },
  pnl: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['COMPLETED', 'FAILED'],
    default: 'COMPLETED'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const Trade = mongoose.model('Trade', tradeSchema);
export default Trade;
