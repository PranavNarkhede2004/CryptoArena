import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  holdings: [{
    coin: String,
    symbol: String,
    quantity: Number,
    avgBuyPrice: Number,
    currentValue: Number
  }],
  totalInvested: {
    type: Number,
    default: 0
  },
  totalCurrentValue: {
    type: Number,
    default: 0
  },
  pnl: {
    type: Number,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Portfolio = mongoose.model('Portfolio', portfolioSchema);
export default Portfolio;
