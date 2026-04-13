import WebSocket from 'ws';
import axios from 'axios';

// In-memory cache replacing Redis
global.priceCache = new Map();
let wsClient = null;
let fallbackInterval = null;
let ioRef = null;

// Multiple WebSocket endpoints for redundancy
const WEBSOCKET_ENDPOINTS = [
  'wss://stream.binance.com:9443/stream',
  'wss://stream.binance.com:443/stream',
  'wss://data-stream.binance.vision/stream',
  'wss://stream.binance.us:9443/stream'
];

let currentEndpointIndex = 0;
const getNextEndpoint = () => {
  const endpoint = WEBSOCKET_ENDPOINTS[currentEndpointIndex];
  currentEndpointIndex = (currentEndpointIndex + 1) % WEBSOCKET_ENDPOINTS.length;
  return endpoint;
};
const TRACKED_BASES = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'MATIC', 'DOGE'];
const FX_REFRESH_MS = 30 * 1000;
let fxState = { rate: null, fetchedAt: 0 };

// Circuit breaker for FX APIs
let circuitBreaker = {
  failures: 0,
  lastFailureTime: 0,
  isOpen: false,
  threshold: 3,
  resetTimeout: 60000 // 1 minute
};

const isCircuitBreakerOpen = () => {
  if (circuitBreaker.failures >= circuitBreaker.threshold) {
    if (Date.now() - circuitBreaker.lastFailureTime > circuitBreaker.resetTimeout) {
      circuitBreaker.failures = 0;
      circuitBreaker.isOpen = false;
      return false;
    }
    circuitBreaker.isOpen = true;
    return true;
  }
  return false;
};

const recordFailure = () => {
  circuitBreaker.failures++;
  circuitBreaker.lastFailureTime = Date.now();
};

const recordSuccess = () => {
  circuitBreaker.failures = 0;
  circuitBreaker.isOpen = false;
};

const toNum = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const validateFxRate = (rate) => {
  // Validate that the rate is reasonable for USD/INR
  const minReasonableRate = 70; // Historical minimum
  const maxReasonableRate = 100; // Historical maximum with buffer
  
  if (!rate || rate <= 0) {
    return { valid: false, reason: 'Rate is null, undefined, or negative' };
  }
  
  if (rate < minReasonableRate || rate > maxReasonableRate) {
    return { valid: false, reason: `Rate ${rate} is outside reasonable range [${minReasonableRate}, ${maxReasonableRate}]` };
  }
  
  return { valid: true };
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

const fetchFromCoinGecko = async () => {
  try {
    const res = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: { ids: 'tether', vs_currencies: 'inr' },
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CryptoArena/1.0)'
      }
    });
    const rate = toNum(res?.data?.tether?.inr, 0);
    const validation = validateFxRate(rate);
    if (!validation.valid) {
      throw new Error(`Invalid FX rate from CoinGecko: ${validation.reason}`);
    }
    return rate;
  } catch (error) {
    if (error.response?.status === 429) {
      console.warn('CoinGecko rate limited, backing off...');
      // Add delay for rate limiting
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
    console.warn('CoinGecko FX API failed:', error.message);
    throw error;
  }
};

const fetchFromExchangeRateAPI = async () => {
  try {
    const fxRes = await axios.get('https://open.er-api.com/v6/latest/USD', { timeout: 3000 });
    const usdInr = toNum(fxRes?.data?.rates?.INR, 0);
    const validation = validateFxRate(usdInr);
    if (!validation.valid) {
      throw new Error(`Invalid FX rate from ExchangeRate-API: ${validation.reason}`);
    }
    return usdInr;
  } catch (error) {
    console.warn('ExchangeRate-API failed:', error.message);
    throw error;
  }
};

const fetchFromAlphaVantage = async () => {
  try {
    // Note: This would require API key configuration
    const res = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'CURRENCY_EXCHANGE_RATE',
        from_currency: 'USD',
        to_currency: 'INR',
        apikey: process.env.ALPHA_VANTAGE_API_KEY || 'demo'
      },
      timeout: 3000,
    });
    const rate = toNum(res?.data?.['Realtime Currency Exchange Rate']?.['5. Exchange Rate'], 0);
    const validation = validateFxRate(rate);
    if (!validation.valid) {
      throw new Error(`Invalid FX rate from Alpha Vantage: ${validation.reason}`);
    }
    return rate;
  } catch (error) {
    console.warn('Alpha Vantage FX API failed:', error.message);
    throw error;
  }
};

const fetchFromFixer = async () => {
  try {
    // Note: This would require API key configuration
    const res = await axios.get('https://api.fixer.io/latest', {
      params: {
        access_key: process.env.FIXER_API_KEY || 'demo',
        base: 'USD',
        symbols: 'INR'
      },
      timeout: 3000,
    });
    const rate = toNum(res?.data?.rates?.INR, 0);
    const validation = validateFxRate(rate);
    if (!validation.valid) {
      throw new Error(`Invalid FX rate from Fixer: ${validation.reason}`);
    }
    return rate;
  } catch (error) {
    console.warn('Fixer FX API failed:', error.message);
    throw error;
  }
};

const refreshFxRate = async () => {
  const now = Date.now();
  if (now - fxState.fetchedAt < FX_REFRESH_MS) return fxState.rate;
  
  if (isCircuitBreakerOpen()) {
    console.warn('FX API circuit breaker is open, using cached rate');
    return fxState.rate;
  }

    const fxSources = [
    { name: 'CoinGecko', fetch: fetchFromCoinGecko },
    { name: 'ExchangeRate-API', fetch: fetchFromExchangeRateAPI },
    { name: 'Alpha Vantage', fetch: fetchFromAlphaVantage },
    { name: 'Fixer', fetch: fetchFromFixer }
  ];
  
  // Add fallback to static rate if all sources fail
  const staticFallbackRate = 94.0; // Reasonable fallback rate

  for (const source of fxSources) {
    try {
      const rate = await source.fetch();
      if (rate > 0) {
        fxState = { rate, fetchedAt: now };
        global.priceCache.set('USDTINR', {
          symbol: 'USDTINR',
          lastPrice: rate,
          change24h: 0,
          volume: 0,
          high: rate,
          low: rate,
        });
        recordSuccess();
        console.log(`FX rate updated from ${source.name}: ${rate}`);
        return rate;
      }
    } catch (error) {
      recordFailure();
      console.warn(`Failed to fetch FX rate from ${source.name}:`, error.message);
      continue;
    }
  }

  // If all sources fail and we have no cached rate, use static fallback
  if (!fxState.rate || fxState.rate <= 0) {
    console.warn(`All FX sources failed, using static fallback rate: ${staticFallbackRate}`);
    fxState = { rate: staticFallbackRate, fetchedAt: now };
    global.priceCache.set('USDTINR', {
      symbol: 'USDTINR',
      lastPrice: staticFallbackRate,
      change24h: 0,
      volume: 0,
      high: staticFallbackRate,
      low: staticFallbackRate,
    });
  }
  
  console.error('All FX sources failed, using last known rate');
  return fxState.rate;
};

const buildMarketPayload = (tickers) => {
  const usdtToInr = getUsdtInrRate(tickers);
  const payload = [];
  let priceUpdates = 0;

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
    const openPrice = toNum(ticker.o);
    const prevClosePrice = toNum(ticker.x);

    // Check if price actually changed
    const cachedData = global.priceCache.get(symbol);
    const priceChanged = !cachedData || Math.abs(cachedData.lastPrice - lastPriceUsdt) > 0.001;
    
    if (priceChanged) {
      priceUpdates++;
    }

    const usdtData = {
      symbol,
      lastPrice: lastPriceUsdt,
      change24h,
      volume: quoteVolumeUsdt,
      high: highUsdt,
      low: lowUsdt,
      openPrice,
      prevClosePrice,
      priceChanged,
      timestamp: Date.now()
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
        openPrice: openPrice * usdtToInr,
        prevClosePrice: prevClosePrice * usdtToInr,
        priceChanged,
        timestamp: Date.now()
      };
      global.priceCache.set(inrSymbol, inrData);
      payload.push(inrData);
    }
  });

  console.log(`Processed ${tickers.length} tickers, ${priceUpdates} with price changes`);
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
      // Try multiple API endpoints for redundancy
      const apiEndpoints = [
        'https://api.binance.com/api/v3/ticker/24hr',
        'https://api1.binance.com/api/v3/ticker/24hr',
        'https://api2.binance.com/api/v3/ticker/24hr',
        'https://api3.binance.com/api/v3/ticker/24hr'
      ];
      
      const responses = await Promise.all(symbols.map(async (symbol) => {
        let lastError;
        
        for (const endpoint of apiEndpoints) {
          try {
            const response = await axios.get(endpoint, { 
              params: { symbol }, 
              timeout: 3000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; CryptoArena/1.0)'
              }
            });
            return response;
          } catch (error) {
            lastError = error;
            console.warn(`API endpoint ${endpoint} failed for ${symbol}:`, error.message);
            continue;
          }
        }
        
        throw lastError || new Error(`All endpoints failed for ${symbol}`);
      }));
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
      
      // Try to get cached prices and broadcast them anyway
      const cachedPrices = Array.from(global.priceCache.values())
        .filter(price => TRACKED_BASES.some(base => 
          price.symbol === `${base}USDT` || price.symbol === `${base}INR`
        ));
      
      if (cachedPrices.length > 0 && ioRef) {
        console.log(`Broadcasting ${cachedPrices.length} cached prices due to API failure`);
        ioRef.emit('price_update', cachedPrices);
      }
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
  
  // Create combined streams for all tracked symbols
  const streams = TRACKED_BASES.map(base => `${base.toLowerCase()}usdt@ticker`).join('/');
  
  const connect = () => {
    const baseUrl = getNextEndpoint();
    const wsUrl = `${baseUrl}?streams=${streams}`;
    console.log(`Connecting to WebSocket endpoint ${currentEndpointIndex}: ${wsUrl}`);
    
    try {
      wsClient = new WebSocket(wsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CryptoArena/1.0)'
        }
      });
    } catch (error) {
      console.error('Failed to create WebSocket:', error.message);
      setTimeout(connect, 5000);
      return;
    }

    wsClient.on('open', () => {
      console.log('Connected to Binance WebSocket feed');
      console.log('WebSocket state: OPEN');
      // Keep fallback alive until we actually receive a valid live payload.
    });

    wsClient.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        
        // Handle both stream format and array format
        let tickers = [];
        if (data.data && typeof data.data === 'object') {
          // Single ticker from combined stream
          tickers = [data.data];
        } else if (Array.isArray(data)) {
          // Array of tickers from !ticker@arr
          tickers = data;
        } else {
          console.warn('Received unexpected data format from Binance:', typeof data);
          return;
        }
        
        console.log(`Received ${tickers.length} ticker(s) from Binance WebSocket`);
        const payload = buildMarketPayload(tickers);
        
        if (payload.length) {
          console.log(`Broadcasting ${payload.length} price updates to clients`);
          stopFallbackSimulation();
          if (ioRef) {
            ioRef.emit('price_update', payload);
            ioRef.emit('price_update_count', payload.length);
          }
        } else {
          console.warn('No valid tickers processed from WebSocket data');
        }
      } catch (error) {
        console.error('Binance WebSocket message parse error:', error.message);
        console.error('Raw data sample:', raw.toString().substring(0, 200));
      }
    });

    wsClient.on('error', (error) => {
      console.error(`WebSocket error on endpoint ${currentEndpointIndex}:`, error.message);
      startFallbackSimulation();
      
      // Try next endpoint after delay
      setTimeout(() => {
        console.log('Trying next WebSocket endpoint...');
        connect();
      }, 5000);
    });

    wsClient.on('close', (code, reason) => {
      console.warn(`WebSocket closed with code ${code}: ${reason || 'No reason provided'}`);
      startFallbackSimulation();
      
      // Try next endpoint after delay
      setTimeout(() => {
        console.log('Attempting to reconnect with next endpoint...');
        connect();
      }, 3000);
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
