import WebSocket from 'ws';
import axios from 'axios';

// In-memory cache replacing Redis
global.priceCache = new Map();
let wsClient = null;
let fallbackInterval = null;
let ioRef = null;

const BINANCE_STREAM_URL = 'wss://stream.binance.com:9443/ws/!ticker@arr';
const TRACKED_BASES = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'MATIC', 'DOGE'];
const FX_REFRESH_MS = 10 * 60 * 1000;
let fxState = { rate: null, fetchedAt: 0 };

const toNum = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const getUsdtInrRate = (tickers) => {
  const direct = tickers.find((t) => t.s === 'USDTINR');
  if (direct) {
    const directRate = toNum(direct.c, 0);
    if (directRate > 0) {
      fxState = { rate: directRate, fetchedAt: Date.now() };
      return directRate;
    }
  }
  const cached = toNum(global.priceCache.get('USDTINR')?.lastPrice, 0);
  if (cached > 0) {
    fxState = { rate: cached, fetchedAt: Date.now() };
    return cached;
  }
  if (fxState.rate && fxState.rate > 0) {
    fxState = { rate: fxState.rate, fetchedAt: Date.now() };
    return fxState.rate;
  }
  return null;
};

const refreshFxRate = async () => {
  const now = Date.now();
  if (now - fxState.fetchedAt < FX_REFRESH_MS) return fxState.rate;
  try {
    const res = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: { ids: 'tether', vs_currencies: 'inr' },
      timeout: 5000,
    });
    const rate = toNum(res?.data?.tether?.inr, 0);
    if (!(rate > 0)) throw new Error('Invalid FX rate');
    fxState = { rate, fetchedAt: now };
    global.priceCache.set('USDTINR', {
      symbol: 'USDTINR',
      lastPrice: rate,
      change24h: 0,
      volume: 0,
      high: rate,
      low: rate,
    });
    return rate;
  } catch {
    try {
      const fxRes = await axios.get('https://open.er-api.com/v6/latest/USD', { timeout: 5000 });
      const usdInr = toNum(fxRes?.data?.rates?.INR, 0);
      if (usdInr > 0) {
        fxState = { rate: usdInr, fetchedAt: now };
        global.priceCache.set('USDTINR', { symbol: 'USDTINR', lastPrice: usdInr, change24h: 0, volume: 0, high: usdInr, low: usdInr });
        return usdInr;
      }
    } catch {
      // ignore
    }
    return fxState.rate;
  }
};

const buildMarketPayload = (tickers) => {
  const usdtToInr = getUsdtInrRate(tickers);
  const payload = [];

  tickers.forEach((ticker) => {
    const symbol = String(ticker.s || '');
    if (!symbol.endsWith('USDT')) return;
    const base = symbol.replace('USDT', '');
    if (!TRACKED_BASES.includes(base)) return;

    const lastPriceUsdt = toNum(ticker.c);
    const change24h = toNum(ticker.P);
    const quoteVolumeUsdt = toNum(ticker.q);
    const highUsdt = toNum(ticker.h);
    const lowUsdt = toNum(ticker.l);

    const usdtData = {
      symbol,
      lastPrice: lastPriceUsdt,
      change24h,
      volume: quoteVolumeUsdt,
      high: highUsdt,
      low: lowUsdt,
    };
    global.priceCache.set(symbol, usdtData);
    payload.push(usdtData);

    if (usdtToInr && usdtToInr > 0) {
      const inrSymbol = `${base}INR`;
      const inrData = {
        symbol: inrSymbol,
        lastPrice: lastPriceUsdt * usdtToInr,
        change24h,
        volume: quoteVolumeUsdt * usdtToInr,
        high: highUsdt * usdtToInr,
        low: lowUsdt * usdtToInr,
      };
      global.priceCache.set(inrSymbol, inrData);
      payload.push(inrData);
    }
  });

  return payload;
};

const pushDualSymbolData = ({ base, lastPriceInr, change24h, volumeInr, highInr, lowInr, usdtToInr, payload }) => {
  const inrSymbol = `${base}INR`;
  const inrData = {
    symbol: inrSymbol,
    lastPrice: lastPriceInr,
    change24h,
    volume: volumeInr,
    high: highInr,
    low: lowInr,
  };
  global.priceCache.set(inrSymbol, inrData);
  payload.push(inrData);

  const usdtSymbol = `${base}USDT`;
  const usdtData = {
    symbol: usdtSymbol,
    lastPrice: lastPriceInr / usdtToInr,
    change24h,
    volume: volumeInr / usdtToInr,
    high: highInr / usdtToInr,
    low: lowInr / usdtToInr,
  };
  global.priceCache.set(usdtSymbol, usdtData);
  payload.push(usdtData);
};

const startFallbackSimulation = () => {
  if (fallbackInterval) return;
  console.log('Starting fallback real-market polling...');
  let polling = false;
  fallbackInterval = setInterval(async () => {
    if (polling) return;
    polling = true;
    try {
      const usdtToInr = toNum(global.priceCache.get('USDTINR')?.lastPrice, fxState.rate || 0);
      if (!(usdtToInr > 0)) {
        polling = false;
        return;
      }
      const symbols = TRACKED_BASES.map((base) => `${base}USDT`);
      const responses = await Promise.all(symbols.map((symbol) => axios.get('https://api.binance.com/api/v3/ticker/24hr', { params: { symbol }, timeout: 5000 })));
      const payload = [];
      responses.forEach((res, idx) => {
        const t = res.data;
        const base = TRACKED_BASES[idx];
        const usdtLast = toNum(t.lastPrice);
        if (!(usdtLast > 0)) return;
        const change24h = toNum(t.priceChangePercent);
        const volumeUsdt = toNum(t.quoteVolume);
        const highUsdt = toNum(t.highPrice);
        const lowUsdt = toNum(t.lowPrice);
        const usdtData = {
          symbol: `${base}USDT`,
          lastPrice: usdtLast,
          change24h,
          volume: volumeUsdt,
          high: highUsdt,
          low: lowUsdt,
        };
        global.priceCache.set(usdtData.symbol, usdtData);
        payload.push(usdtData);
        const inrData = {
          symbol: `${base}INR`,
          lastPrice: usdtLast * usdtToInr,
          change24h,
          volume: volumeUsdt * usdtToInr,
          high: highUsdt * usdtToInr,
          low: lowUsdt * usdtToInr,
        };
        global.priceCache.set(inrData.symbol, inrData);
        payload.push(inrData);
      });
      if (payload.length && ioRef) ioRef.emit('price_update', payload);
    } catch (error) {
      console.warn('Fallback real polling failed:', error.message);
    } finally {
      polling = false;
    }
  }, 4000);
};

const stopFallbackSimulation = () => {
  if (!fallbackInterval) return;
  clearInterval(fallbackInterval);
  fallbackInterval = null;
};

export const startPricePolling = (ioInstance) => {
  ioRef = ioInstance;
  refreshFxRate();
  setInterval(() => { refreshFxRate(); }, FX_REFRESH_MS);
  // Prime the cache immediately so /market/tickers never returns empty on boot.
  startFallbackSimulation();
  const connect = () => {
    wsClient = new WebSocket(BINANCE_STREAM_URL);

    wsClient.on('open', () => {
      console.log('Connected to Binance WebSocket feed');
      // Keep fallback alive until we actually receive a valid live payload.
    });

    wsClient.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (!Array.isArray(data)) return;
        const payload = buildMarketPayload(data);
        if (payload.length) {
          stopFallbackSimulation();
          if (ioRef) ioRef.emit('price_update', payload);
        }
      } catch (error) {
        console.error('Binance WebSocket message parse error:', error.message);
      }
    });

    wsClient.on('error', (error) => {
      console.error('Binance WebSocket error:', error.message);
      startFallbackSimulation();
    });

    wsClient.on('close', () => {
      console.warn('Binance WebSocket closed. Reconnecting in 3s...');
      startFallbackSimulation();
      setTimeout(connect, 3000);
    });
  };

  connect();
};

export const getCachedPrices = () => {
  return Array.from(global.priceCache.values());
};

export const getCachedPriceForSymbol = (symbol) => {
  return global.priceCache.get(symbol);
};
