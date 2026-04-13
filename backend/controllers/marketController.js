import { getCachedPrices, getCachedPriceForSymbol } from '../services/coinDCXService.js';
import axios from 'axios';

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
const normalizeBinanceSymbol = (rawSymbol = '') => {
  const clean = String(rawSymbol || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.endsWith('USDT')) return { binanceSymbol: clean, convertToInr: false };
  if (clean.endsWith('INR')) return { binanceSymbol: `${clean.replace('INR', '')}USDT`, convertToInr: true };
  return { binanceSymbol: `${clean}USDT`, convertToInr: false };
};

export const getTickers = (req, res) => {
  const prices = getCachedPrices();
  res.json(prices);
};

export const getTickerBySymbol = (req, res) => {
  const price = getCachedPriceForSymbol(req.params.symbol);
  if (price) {
    res.json(price);
  } else {
    res.status(404).json({ message: 'Symbol not found' });
  }
};

export const getCandles = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { binanceSymbol, convertToInr } = normalizeBinanceSymbol(symbol);
    const response = await axios.get('https://api.binance.com/api/v3/klines', {
      params: { symbol: binanceSymbol, interval: '1h', limit: 200 },
    });

    const usdtInr = convertToInr ? await getLiveUsdtInrRate() : 1;
    if (convertToInr && !(usdtInr > 0)) {
      return res.status(503).json({ message: 'Live INR conversion unavailable' });
    }
    const fx = convertToInr ? usdtInr : 1;
    const candles = response.data.map((kline) => ({
      time: Number(kline[0]),
      start_time: Number(kline[0]),
      open: toNum(kline[1]) * fx,
      high: toNum(kline[2]) * fx,
      low: toNum(kline[3]) * fx,
      close: toNum(kline[4]) * fx,
      volume: toNum(kline[5]),
    }));

    res.json(candles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching candles', detail: error.message });
  }
};

export const getCoins = async (req, res) => {
  try {
    const response = await axios.get('https://api.coindcx.com/exchange/v1/markets_details');
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching coins' });
  }
};
