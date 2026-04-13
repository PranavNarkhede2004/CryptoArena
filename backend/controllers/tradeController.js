import Trade from '../models/Trade.js';
import User from '../models/User.js';
import Portfolio from '../models/Portfolio.js';
import { getCachedPriceForSymbol } from '../services/coinDCXService.js';
import axios from 'axios';

const TRADE_FEE_RATE = 0.001;
const toNum = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const getLiveUsdtInrRate = async () => {
  const cached = toNum(getCachedPriceForSymbol('USDTINR')?.lastPrice, 0);
  if (cached > 0) return cached;
  try {
    const res = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: { ids: 'tether', vs_currencies: 'inr' },
      timeout: 5000,
    });
    const rate = toNum(res?.data?.tether?.inr, 0);
    if (rate > 0) return rate;
  } catch {
    // ignore
  }
  const fxRes = await axios.get('https://open.er-api.com/v6/latest/USD', { timeout: 5000 });
  const usdInr = toNum(fxRes?.data?.rates?.INR, 0);
  return usdInr > 0 ? usdInr : null;
};

const resolveLiveData = (requestedSymbol = '') => {
  const symbol = String(requestedSymbol || '').toUpperCase();
  let liveData = getCachedPriceForSymbol(symbol);
  if (liveData) return { liveData, resolvedSymbol: symbol };

  const base = symbol.replace('USDT', '').replace('INR', '');
  if (!base) return { liveData: null, resolvedSymbol: symbol };

  const usdtSymbol = `${base}USDT`;
  const inrSymbol = `${base}INR`;
  liveData = getCachedPriceForSymbol(usdtSymbol) || getCachedPriceForSymbol(inrSymbol);
  if (liveData) return { liveData, resolvedSymbol: liveData.symbol || symbol };

  return { liveData: null, resolvedSymbol: symbol };
};

const fetchLiveDataFromBinance = async (resolvedSymbol) => {
  const symbol = String(resolvedSymbol || '').toUpperCase();
  const base = symbol.replace('USDT', '').replace('INR', '');
  if (!base) return null;

  const usdtSymbol = `${base}USDT`;
  const tickerRes = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
    params: { symbol: usdtSymbol },
  });
  const t = tickerRes.data;
  const usdtData = {
    symbol: usdtSymbol,
    lastPrice: toNum(t.lastPrice),
    change24h: toNum(t.priceChangePercent),
    volume: toNum(t.quoteVolume),
    high: toNum(t.highPrice),
    low: toNum(t.lowPrice),
  };

  if (symbol.endsWith('USDT')) return usdtData;
  const usdtInr = await getLiveUsdtInrRate();
  if (!(usdtInr > 0)) return null;
  return {
    symbol: `${base}INR`,
    lastPrice: usdtData.lastPrice * usdtInr,
    change24h: usdtData.change24h,
    volume: usdtData.volume * usdtInr,
    high: usdtData.high * usdtInr,
    low: usdtData.low * usdtInr,
  };
};

export const buyCoin = async (req, res) => {
  try {
    const { coin, symbol, quantity, isAmountBased, amount } = req.body;
    const userId = req.user.userId;

    const { liveData, resolvedSymbol } = resolveLiveData(symbol);
    const priceData = liveData || await fetchLiveDataFromBinance(resolvedSymbol);
    if (!priceData) return res.status(400).json({ message: 'Live price not available' });
    
    const price = priceData.lastPrice;
    
    let actualQuantity = Number(quantity);
    let totalCost = 0;

    if (isAmountBased) {
      totalCost = Number(amount);
      actualQuantity = amount / price;
    } else {
      totalCost = Number(quantity) * price;
    }
    if (!Number.isFinite(actualQuantity) || !Number.isFinite(totalCost) || actualQuantity <= 0 || totalCost <= 0) {
      return res.status(400).json({ message: 'Invalid order amount' });
    }

    const user = await User.findById(userId);
    if (user.virtualBalance < totalCost) {
      return res.status(400).json({ message: 'Insufficient virtual balance' });
    }

    const fee = totalCost * TRADE_FEE_RATE;

    // Deduct balance
    user.virtualBalance -= (totalCost + fee);
    await user.save();

    // Create Trade
    const trade = await Trade.create({
      userId,
      coin,
      symbol: resolvedSymbol,
      type: 'BUY',
      quantity: actualQuantity,
      price,
      total: totalCost,
      fee,
      pnl: 0
    });

    // Update Portfolio
    let portfolio = await Portfolio.findOne({ userId });
    if (!portfolio) {
      portfolio = await Portfolio.create({ userId, holdings: [], totalInvested: 0 });
    }

    const holdingIndex = portfolio.holdings.findIndex(h => h.symbol === resolvedSymbol);
    if (holdingIndex >= 0) {
      const h = portfolio.holdings[holdingIndex];
      const newQuantity = h.quantity + actualQuantity;
      const totalPaidSoFar = (h.quantity * h.avgBuyPrice) + totalCost;
      h.avgBuyPrice = totalPaidSoFar / newQuantity;
      h.quantity = newQuantity;
      h.currentValue = newQuantity * price;
    } else {
      portfolio.holdings.push({
        coin,
        symbol: resolvedSymbol,
        quantity: actualQuantity,
        avgBuyPrice: price,
        currentValue: actualQuantity * price
      });
    }

    portfolio.totalInvested += (totalCost + fee);
    await portfolio.save();

    res.status(200).json({ message: 'Buy successful', trade, balance: user.virtualBalance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sellCoin = async (req, res) => {
  try {
    const { symbol, quantity, isAmountBased, amount } = req.body;
    const userId = req.user.userId;

    const { liveData, resolvedSymbol } = resolveLiveData(symbol);
    const priceData = liveData || await fetchLiveDataFromBinance(resolvedSymbol);
    if (!priceData) return res.status(400).json({ message: 'Live price not available' });
    
    const price = priceData.lastPrice;

    const portfolio = await Portfolio.findOne({ userId });
    if (!portfolio) return res.status(400).json({ message: 'No portfolio found' });

    const holdingIndex = portfolio.holdings.findIndex(h => h.symbol === symbol || h.symbol === resolvedSymbol);
    if (holdingIndex === -1) return res.status(400).json({ message: 'Coin not in portfolio' });

    const holding = portfolio.holdings[holdingIndex];
    
    let actualQuantity = Number(quantity);
    let totalProceeds = 0;

    if (isAmountBased) {
      actualQuantity = Number(amount) / price;
      totalProceeds = Number(amount);
    } else {
      totalProceeds = Number(quantity) * price;
    }
    if (!Number.isFinite(actualQuantity) || !Number.isFinite(totalProceeds) || actualQuantity <= 0 || totalProceeds <= 0) {
      return res.status(400).json({ message: 'Invalid order amount' });
    }

    if (holding.quantity < actualQuantity) {
      return res.status(400).json({ message: 'Insufficient coin quantity' });
    }

    const pnl = (price - holding.avgBuyPrice) * actualQuantity;
    const fee = totalProceeds * TRADE_FEE_RATE;
    const netProceeds = totalProceeds - fee;

    // Add proceeds to balance
    const user = await User.findById(userId);
    user.virtualBalance += netProceeds;
    await user.save();

    // Create Trade
    const trade = await Trade.create({
      userId,
      coin: holding.coin,
      symbol: holding.symbol,
      type: 'SELL',
      quantity: actualQuantity,
      price,
      total: totalProceeds,
      fee,
      pnl
    });

    // Update Portfolio
    holding.quantity -= actualQuantity;
    const reducedInvested = holding.avgBuyPrice * actualQuantity;
    portfolio.totalInvested = Math.max(0, (portfolio.totalInvested || 0) - reducedInvested);
    holding.currentValue = Math.max(0, holding.quantity * price);

    if (holding.quantity <= 0) {
      portfolio.holdings.splice(holdingIndex, 1);
    }

    await portfolio.save();

    res.status(200).json({ message: 'Sell successful', pnl, fee, trade, balance: user.virtualBalance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHistory = async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.user.userId }).sort({ timestamp: -1 }).limit(50);
    res.status(200).json(trades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHistoryBySymbol = async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.user.userId, symbol: req.params.symbol }).sort({ timestamp: -1 });
    res.status(200).json(trades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
