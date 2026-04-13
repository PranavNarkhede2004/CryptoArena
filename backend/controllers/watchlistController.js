import Watchlist from '../models/Watchlist.js';

export const getWatchlist = async (req, res) => {
  try {
    let watchlist = await Watchlist.findOne({ userId: req.user.userId });
    if (!watchlist) {
      watchlist = await Watchlist.create({ userId: req.user.userId, coins: [] });
    }
    res.status(200).json(watchlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addCoin = async (req, res) => {
  try {
    const { symbol } = req.body;
    let watchlist = await Watchlist.findOne({ userId: req.user.userId });
    
    if (!watchlist) {
      watchlist = await Watchlist.create({ userId: req.user.userId, coins: [symbol] });
    } else if (!watchlist.coins.includes(symbol)) {
      watchlist.coins.push(symbol);
      await watchlist.save();
    }
    
    res.status(200).json(watchlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeCoin = async (req, res) => {
  try {
    const { symbol } = req.params;
    const watchlist = await Watchlist.findOne({ userId: req.user.userId });
    
    if (watchlist) {
      watchlist.coins = watchlist.coins.filter(c => c !== symbol);
      await watchlist.save();
    }
    
    res.status(200).json(watchlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
