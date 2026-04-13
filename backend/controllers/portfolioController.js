import Portfolio from '../models/Portfolio.js';
import User from '../models/User.js';
import { getCachedPriceForSymbol } from '../services/coinDCXService.js';

export const getPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ userId: req.user.userId });
    if (!portfolio) {
      return res.status(200).json({ holdings: [], totalInvested: 0, totalCurrentValue: 0, pnl: 0 });
    }

    let totalCurrentValue = 0;
    let totalInvested = 0;

    const populatedHoldings = portfolio.holdings.map(h => {
      const liveData = getCachedPriceForSymbol(h.symbol);
      const currentPrice = liveData ? liveData.lastPrice : h.avgBuyPrice;
      const currentValue = currentPrice * h.quantity;
      const cost = h.avgBuyPrice * h.quantity;
      const pnl = currentValue - cost;

      totalCurrentValue += currentValue;
      totalInvested += cost;

      return {
        ...h.toObject(),
        currentPrice,
        currentValue,
        pnl,
        pnlPercent: (pnl / cost) * 100
      };
    });

    portfolio.totalCurrentValue = totalCurrentValue;
    portfolio.totalInvested = totalInvested;
    portfolio.pnl = totalCurrentValue - totalInvested;

    res.status(200).json({
      holdings: populatedHoldings,
      totalCurrentValue,
      totalInvested,
      pnl: portfolio.pnl
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSummary = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const portfolio = await Portfolio.findOne({ userId: req.user.userId });

    if (!portfolio) {
      return res.status(200).json({
        balance: user.virtualBalance,
        invested: 0,
        currentValue: 0,
        pnl: 0,
        pnlPercent: 0
      });
    }

    let totalCurrentValue = 0;
    let totalInvested = 0;

    portfolio.holdings.forEach(h => {
      const liveData = getCachedPriceForSymbol(h.symbol);
      const currentPrice = liveData ? liveData.lastPrice : h.avgBuyPrice;
      totalCurrentValue += (currentPrice * h.quantity);
      totalInvested += (h.avgBuyPrice * h.quantity);
    });

    const pnl = totalCurrentValue - totalInvested;
    const pnlPercent = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;

    res.status(200).json({
      balance: user.virtualBalance,
      invested: totalInvested,
      currentValue: totalCurrentValue,
      pnl,
      pnlPercent
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
