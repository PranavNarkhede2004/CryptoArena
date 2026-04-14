import User from '../models/User.js';
import Portfolio from '../models/Portfolio.js';

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('username email virtualBalance');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      virtualBalance: user.virtualBalance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    // Top 50 Users scored by virtualBalance + real-time portfolio value
    // Fetch all users and portfolios
    const users = await User.find().select('username virtualBalance');
    const portfolios = await Portfolio.find();

    // Get current market prices from global cache
    const priceCache = global.priceCache || new Map();
    
    const stats = users.map(user => {
      const p = portfolios.find(port => port.userId.toString() === user._id.toString());
      const startingBalance = 1000000;
      
      let holdingsValue = 0;
      if (p && p.holdings && p.holdings.length > 0) {
        // Calculate real-time holdings value using current market prices
        holdingsValue = p.holdings.reduce((total, holding) => {
          const currentPrice = priceCache.get(holding.symbol)?.lastPrice || holding.avgBuyPrice || 0;
          return total + (holding.quantity * currentPrice);
        }, 0);
      }
      
      // Total account value = wallet balance + real-time holdings value
      const currentValue = user.virtualBalance + holdingsValue;

      const totalPnL = currentValue - startingBalance;
      const pnlPercent = (totalPnL / startingBalance) * 100;

      return {
        _id: user._id,
        username: user.username,
        startingBalance,
        currentValue,
        totalPnL,
        pnlPercent,
        holdingsValue, // Added for debugging
        walletBalance: user.virtualBalance, // Added for debugging
        totalTrades: 0 // Mocked for now unless we query trades per user
      };
    });

    stats.sort((a, b) => b.totalPnL - a.totalPnL);

    res.status(200).json(stats.slice(0, 50));
  } catch (error) {
    console.error('Leaderboard error:', error.message);
    res.status(500).json({ message: error.message });
  }
};
