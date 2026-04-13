import mongoose from 'mongoose';

const watchlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coins: [{
    type: String, // Storing symbols e.g., 'BTCINR'
    required: true
  }]
});

export default mongoose.model('Watchlist', watchlistSchema);
