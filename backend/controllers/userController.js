import User from '../models/User.js';
import Portfolio from '../models/Portfolio.js';

export const getLeaderboard = async (req, res) => {
  try {
    // Top 50 Users scored by virtualBalance + portfolioValue
    // Fetch all users and portfolios (Heavy operation but ok for dummy platform)
    const users = await User.find().select('username virtualBalance');
    const portfolios = await Portfolio.find();

    const stats = users.map(user => {
      const p = portfolios.find(port => port.userId.toString() === user._id.toString());
      const startingBalance = 1000000;
      
      let currentValue = user.virtualBalance;
      if (p) {
        // We'll just use totalInvested + PnL = totalCurrentValue recorded in DB (which updates on trade)
        // Note: For real live depth we'd calculate via socket, but db stored values serve well enough for leaderboard
        currentValue += p.totalCurrentValue; 
      }

      const totalPnL = currentValue - startingBalance;
      const pnlPercent = (totalPnL / startingBalance) * 100;

      return {
        _id: user._id,
        username: user.username,
        startingBalance,
        currentValue,
        totalPnL,
        pnlPercent,
        totalTrades: 0 // Mocked for now unless we query trades per user
      };
    });

    stats.sort((a, b) => b.totalPnL - a.totalPnL);

    res.status(200).json(stats.slice(0, 50));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
