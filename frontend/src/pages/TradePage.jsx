import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import usePriceStore from '../store/priceStore';
import useAuthStore from '../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import QuantitySlider from '../components/ui/QuantitySlider';
import CoinLogo from '../components/ui/CoinLogo';
import PriceFlash from '../components/ui/PriceFlash';
import { ChevronDown } from 'lucide-react';

const toNum = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const formatNum = (value, digits = 2) =>
  toNum(value).toLocaleString(undefined, { maximumFractionDigits: digits });

const resolveTradableSymbol = (requestedSymbol, prices) => {
  if (prices[requestedSymbol]) return requestedSymbol;
  const base = String(requestedSymbol || '').replace('USDT', '').replace('INR', '');
  if (!base) return requestedSymbol;
  const inr = `${base}INR`;
  if (prices[inr]) return inr;
  const fallback = Object.keys(prices).find((s) => s.startsWith(base));
  return fallback || requestedSymbol;
};
const toTvSymbolCandidates = (symbol = 'BTCUSDT') => {
  const clean = String(symbol || 'BTCUSDT').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const base = clean.endsWith('USDT')
    ? clean.replace('USDT', '')
    : clean.endsWith('INR')
      ? clean.replace('INR', '')
      : clean;
  if (clean.endsWith('INR')) {
    return [
      `BINANCE:${base || 'BTC'}USDT*FX_IDC:USDINR`,
      `BINANCE:${base || 'BTC'}USDT`,
      `WAZIRX:${base || 'BTC'}INR`,
      `BITBNS:${base || 'BTC'}INR`,
    ];
  }
  return [`BINANCE:${base || 'BTC'}USDT`];
};

const calcHighLowFromCandles = (candles = []) => {
  if (!Array.isArray(candles) || candles.length === 0) return { high: 0, low: 0, close: 0 };
  const highs = candles.map((c) => toNum(c.high, 0));
  const lows = candles.map((c) => toNum(c.low, 0)).filter((n) => n > 0);
  const close = toNum(candles[candles.length - 1]?.close, 0);
  return {
    high: highs.length ? Math.max(...highs) : 0,
    low: lows.length ? Math.min(...lows) : 0,
    close,
  };
};

// --- SUB-COMPONENTS --- //

const ProfessionalChart = ({ symbol }) => {
  const candidates = toTvSymbolCandidates(symbol);
  const [sourceIdx, setSourceIdx] = useState(0);
  const tvSymbol = candidates[Math.min(sourceIdx, candidates.length - 1)];

  useEffect(() => {
    setSourceIdx(0);
  }, [symbol]);

  return (
    <div className="w-full h-full relative bg-[#080B11]">
      {candidates.length > 1 && (
        <button
          onClick={() => setSourceIdx((i) => (i + 1) % candidates.length)}
          className="absolute top-3 right-3 z-20 text-[10px] px-2 py-1 rounded border border-borderSubtle bg-elevated text-textSecondary hover:text-textPrimary"
        >
          Source: {tvSymbol.split(':')[0]}
        </button>
      )}
      <iframe
        key={`${symbol}-${tvSymbol}`}
        title="trade-tradingview"
        src={`https://s.tradingview.com/widgetembed/?symbol=${tvSymbol}&interval=15&theme=dark&style=1&toolbarbg=080B11&hide_top_toolbar=0&hide_legend=0&saveimage=0`}
        width="100%"
        height="100%"
        frameBorder="0"
      />
    </div>
  );
};

const SimulatedOrderBook = ({ price }) => {
  const centerPrice = price || 100;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1200);
    return () => clearInterval(id);
  }, []);
  
  const genRows = (isAsk) => {
    let currentPrice = centerPrice;
    const rows = [];
    const seed = Math.floor(centerPrice) + tick;
    for(let i=0; i<12; i++) {
      currentPrice = isAsk ? currentPrice * (1 + 0.0005) : currentPrice * (1 - 0.0005);
      const size = (((Math.sin(seed + i * 1.3) + 1) / 2) * 5) + 0.1;
      rows.push({ price: currentPrice, size, total: currentPrice * size });
    }
    return isAsk ? rows.reverse() : rows;
  };

  const asks = genRows(true);
  const bids = genRows(false);
  const maxTotal = Math.max(...asks.map(a=>a.total), ...bids.map(b=>b.total));

  return (
    <div className="flex flex-col h-full bg-surface border-r border-borderSubtle overflow-hidden select-none">
      <div className="p-3 border-b border-borderSubtle shrink-0">
        <h3 className="font-heading font-medium text-sm">Order Book</h3>
      </div>
      <div className="flex text-xs text-textSecondary px-3 py-1 font-mono uppercase border-b border-[#1E2D3D]">
        <div className="w-1/3">Price</div><div className="w-1/3 text-right">Size</div><div className="w-1/3 text-right">Total</div>
      </div>
      
      {/* Asks (Sell) */}
      <div className="flex-1 overflow-hidden flex flex-col justify-end relative no-scrollbar pt-2 pl-3 pb-2 pr-1">
        {asks.map((a,i) => (
          <div key={i} className="flex text-[11px] font-mono leading-relaxed relative group cursor-pointer hover:bg-elevated">
             <div className="absolute top-0 right-0 h-full bg-dangerDim" style={{ width: `${(a.total/maxTotal)*100}%` }} />
             <div className="w-1/3 text-danger z-10">{a.price.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
             <div className="w-1/3 text-right text-textPrimary z-10">{a.size.toFixed(4)}</div>
             <div className="w-1/3 text-right text-textMuted z-10 pr-2">{a.total.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
          </div>
        ))}
      </div>
      
      {/* Spread */}
      <div className="py-2 border-y border-[#1E2D3D] text-center bg-elevated shrink-0">
         <PriceFlash val={centerPrice}>
           <div className="text-lg font-mono font-bold text-white tracking-tight">₹{centerPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
         </PriceFlash>
      </div>

      {/* Bids (Buy) */}
      <div className="flex-1 overflow-hidden relative no-scrollbar pt-2 pl-3 pb-2 pr-1">
        {bids.map((b,i) => (
          <div key={i} className="flex text-[11px] font-mono leading-relaxed relative group cursor-pointer hover:bg-elevated">
             <div className="absolute top-0 left-0 h-full bg-accentDim" style={{ width: `${(b.total/maxTotal)*100}%` }} />
             <div className="w-1/3 text-accent z-10">{b.price.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
             <div className="w-1/3 text-right text-textPrimary z-10">{b.size.toFixed(4)}</div>
             <div className="w-1/3 text-right text-textMuted z-10 pr-2">{b.total.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MAIN PAGE --- //

const TradePage = () => {
  const { symbol } = useParams();
  const [searchParams] = useSearchParams();
  const { prices } = usePriceStore();
  const { user, updateBalance } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [showCoinSelector, setShowCoinSelector] = useState(false);
  
  // Available coins for trading
  const availableCoins = [
    'BTCINR', 'ETHINR', 'BNBINR', 'SOLINR', 'XRPINR', 
    'ADAINR', 'MATICINR', 'DOGEINR'
  ];
  
  const handleCoinSelect = (coinSymbol) => {
    setShowCoinSelector(false);
    navigate(`/trade/${coinSymbol}`);
  };
  
  const activeSymbol = resolveTradableSymbol(symbol, prices);
  const coinData = prices[activeSymbol];
  const { data: tickerFallback } = useQuery({
    queryKey: ['tradeTickerFallback', activeSymbol],
    queryFn: async () => (await axios.get(`/market/ticker/${activeSymbol}`)).data,
    enabled: !!activeSymbol && !coinData,
    refetchInterval: 4000,
  });
  const effectiveTicker = coinData || tickerFallback;
  const livePrice = coinData ? toNum(coinData.lastPrice) : 0;

  const [side, setSide] = useState('BUY');
  const [amountInr, setAmountInr] = useState('');
  const [sliderPct, setSliderPct] = useState(0);

  const { data: holdings } = useQuery({
    queryKey: ['portfolioData'],
    queryFn: async () => (await axios.get('/portfolio')).data
  });
  const { data: rawCandles } = useQuery({
    queryKey: ['tradeCandlesStats', activeSymbol],
    queryFn: async () => (await axios.get(`/market/candles/${activeSymbol}`)).data,
    staleTime: 15000,
    enabled: !!activeSymbol,
  });
  const { data: recentTrades } = useQuery({
    queryKey: ['tradePageHistory', activeSymbol],
    queryFn: async () => (await axios.get(`/trades/history/${activeSymbol}`)).data,
    enabled: !!activeSymbol,
  });

  const holdingsArr = Array.isArray(holdings)
    ? holdings
    : Array.isArray(holdings?.holdings)
      ? holdings.holdings
      : [];
  const holding = holdingsArr.find((h) => h.symbol === activeSymbol)?.quantity || 0;
  const candleStats = calcHighLowFromCandles(rawCandles);
  const effectivePrice = toNum(effectiveTicker?.lastPrice, candleStats.close);
  const high24h = toNum(effectiveTicker?.high, candleStats.high);
  const low24h = toNum(effectiveTicker?.low, candleStats.low);
  const volume24h = toNum(effectiveTicker?.volume, 0);
  
  const handleSliderChange = (pct) => {
    setSliderPct(pct);
    if (side === 'BUY') {
      const maxInr = user?.virtualBalance || 0;
      setAmountInr((maxInr * (pct/100)).toString());
    } else {
      const maxQty = holding;
      setAmountInr((maxQty * effectivePrice * (pct/100)).toString());
    }
  };

  const tradeMutation = useMutation({
    mutationFn: async (payload) => {
      const endpoint = payload.type === 'SELL' ? '/trades/sell' : '/trades/buy';
      return axios.post(endpoint, payload);
    },
    onSuccess: (data) => {
      toast.success(
        <div className="flex flex-col">
          <span className="font-bold">Trade Executed</span>
          <span className="font-mono text-xs">{data.data.trade.type} {data.data.trade.quantity.toFixed(4)} @ {data.data.trade.price}</span>
        </div>
      );
      if (typeof data?.data?.balance === 'number') {
        updateBalance(data.data.balance);
      }
      queryClient.invalidateQueries({ queryKey: ['portfolioData'] });
      queryClient.invalidateQueries({ queryKey: ['portfolioSummary'] });
      queryClient.invalidateQueries({ queryKey: ['recentTrades'] });
      queryClient.invalidateQueries({ queryKey: ['tradePageHistory', activeSymbol] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      setAmountInr('');
      setSliderPct(0);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Trade failed');
    }
  });

  const parsedAmount = parseFloat(amountInr || 0);
  const qtyEstimation = effectivePrice > 0 ? parsedAmount / effectivePrice : 0;
  const maxSellAmount = holding * effectivePrice;
  const isSufficient = side === 'BUY'
    ? parsedAmount <= toNum(user?.virtualBalance)
    : parsedAmount <= maxSellAmount;
  const canExecute = parsedAmount > 0 && Number.isFinite(qtyEstimation) && qtyEstimation > 0 && isSufficient && !tradeMutation.isPending && effectivePrice > 0;
  const disabledReason = effectivePrice <= 0
    ? 'Waiting for live price feed'
    : parsedAmount <= 0
      ? `Enter amount to ${side.toLowerCase()}`
      : !isSufficient
        ? `Insufficient ${side === 'BUY' ? 'balance' : 'asset quantity'}`
        : '';

  useEffect(() => {
    if (sliderPct === 0 && !amountInr) {
      handleSliderChange(25);
    }
  }, [side]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const sideParam = String(searchParams.get('side') || '').toUpperCase();
    const pctParam = Number(searchParams.get('pct') || 0);
    if (sideParam === 'SELL' || sideParam === 'BUY') {
      setSide(sideParam);
      if (pctParam > 0) {
        setTimeout(() => handleSliderChange(Math.min(100, Math.max(0, pctParam))), 0);
      }
    }
  }, [searchParams, effectivePrice, holding]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close coin selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCoinSelector && !event.target.closest('.coin-selector-wrapper')) {
        setShowCoinSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCoinSelector]);

  return (
    <div className="w-full h-full flex flex-col -m-4 lg:-m-6 bg-base">
      
      {/* Header Bar */}
      <div className="h-auto sm:h-[60px] premium-card rounded-none flex flex-col sm:flex-row items-start sm:items-center px-3 sm:px-4 py-3 sm:py-4 border-b border-borderSubtle shrink-0">
        <div className="flex items-center gap-3 sm:gap-6 w-full">
          <div className="flex items-center gap-2 sm:gap-3 pr-3 sm:pr-6 border-r border-[#1E2D3D] relative coin-selector-wrapper">
            <button
              onClick={() => setShowCoinSelector(!showCoinSelector)}
              className="flex items-center gap-2 hover:bg-elevated px-2 py-1 rounded transition-colors"
            >
              <CoinLogo symbol={activeSymbol} size={24} className="sm:size-32" />
              <span className="font-heading font-bold text-lg sm:text-xl text-white tracking-widest">{activeSymbol.replace('INR','')}</span>
              <ChevronDown size={14} className="text-textMuted" />
            </button>
            
            {/* Coin Selector Dropdown */}
            {showCoinSelector && (
              <div className="absolute top-full left-0 mt-2 w-48 sm:w-56 premium-card rounded-lg shadow-xl z-50">
                <div className="p-2">
                  {availableCoins.map((coin) => (
                    <button
                      key={coin}
                      onClick={() => handleCoinSelect(coin)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-elevated transition-colors text-left ${
                        coin === activeSymbol ? 'bg-accent/20 text-accent' : 'text-textPrimary'
                      }`}
                    >
                      <CoinLogo symbol={coin} size={20} />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{coin.replace('INR','')}</div>
                        <div className="text-xs text-textMuted">
                          ₹{prices[coin]?.lastPrice?.toLocaleString(undefined, {maximumFractionDigits:2}) || '---'}
                        </div>
                      </div>
                      {coin === activeSymbol && (
                        <div className="w-2 h-2 bg-accent rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div>
              <PriceFlash val={effectivePrice} className="block">
                <span className={`text-lg sm:text-xl font-mono font-medium ${toNum(effectiveTicker?.change24h) >= 0 ? 'text-accent glow-green' : 'text-danger'}`}>
                  ₹{formatNum(effectivePrice, 2)}
                </span>
              </PriceFlash>
            </div>
            <div className={`text-sm font-mono ${toNum(effectiveTicker?.change24h) >= 0 ? 'text-accent' : 'text-danger'}`}>
              {toNum(effectiveTicker?.change24h) >= 0 ? '+' : ''}{toNum(effectiveTicker?.change24h).toFixed(2)}%
            </div>
          </div>
        </div>
        
        {/* Mobile Stats */}
        <div className="flex gap-3 sm:gap-4 font-mono text-[10px] sm:text-[11px] text-textMuted mt-2 sm:mt-0 sm:hidden">
          <div className="flex flex-col"><span className="text-textSecondary uppercase">H</span><span>{formatNum(high24h, 2)}</span></div>
          <div className="flex flex-col"><span className="text-textSecondary uppercase">L</span><span>{formatNum(low24h, 2)}</span></div>
          <div className="flex flex-col"><span className="text-textSecondary uppercase">Vol</span><span>{(volume24h / 1000).toFixed(1)}K</span></div>
        </div>
        
        {/* Desktop Stats */}
        <div className="flex gap-4 font-mono text-[11px] text-textMuted hidden md:flex">
          <div className="flex flex-col"><span className="text-textSecondary uppercase">24h Change</span><span className={toNum(effectiveTicker?.change24h) >= 0 ? 'text-accent' : 'text-danger'}>{toNum(effectiveTicker?.change24h).toFixed(2)}%</span></div>
          <div className="flex flex-col"><span className="text-textSecondary uppercase">24h High</span><span>{formatNum(high24h, 2)}</span></div>
          <div className="flex flex-col"><span className="text-textSecondary uppercase">24h Low</span><span>{formatNum(low24h, 2)}</span></div>
          <div className="flex flex-col"><span className="text-textSecondary uppercase">24h Vol</span><span>{(volume24h / 1000).toFixed(2)}K {activeSymbol.replace('INR','')}</span></div>
        </div>
      </div>

      {/* Main Terminal Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left: Chart */}
        <div className="flex-1 lg:border-r border-borderSubtle relative min-h-[300px] lg:min-h-[460px] premium-card rounded-none">
           <ProfessionalChart symbol={activeSymbol} />
        </div>

        {/* Middle: Order Book (Hidden on small screens) */}
        <div className="w-full lg:w-[300px] shrink-0 hidden xl:block premium-card rounded-none">
           <SimulatedOrderBook price={effectivePrice} />
        </div>

        {/* Right: Order Panel */}
        <div className="w-full lg:w-[320px] xl:w-[320px] shrink-0 premium-card rounded-none flex flex-col overflow-y-auto">
          
          <div className="flex p-1 bg-elevated border-b border-borderSubtle">
            <button className="flex-1 py-1.5 text-xs font-bold text-white bg-surface rounded shadow-sm">Market</button>
            <button className="flex-1 py-1.5 text-xs text-textMuted hover:text-textPrimary disabled:opacity-50" disabled>Limit</button>
            <button className="flex-1 py-1.5 text-xs text-textMuted hover:text-textPrimary disabled:opacity-50" disabled>Stop</button>
          </div>

          <div className="p-4 flex-1">
            <div className="flex gap-2 p-1 bg-[#151b23] rounded-lg mb-6 border border-borderSubtle">
              <button 
                onClick={() => setSide('BUY')}
                className={`flex-1 py-2 font-heading font-bold text-sm tracking-widest rounded transition-all ${side === 'BUY' ? 'bg-accent text-bg-base' : 'text-textMuted hover:text-white'}`}
              >BUY</button>
              <button
                onClick={() => setSide('SELL')}
                className={`flex-1 py-2 font-heading font-bold text-sm tracking-widest rounded transition-all ${side === 'SELL' ? 'bg-danger text-white border border-danger' : 'text-danger border border-danger bg-transparent'}`}
              >
                SELL
              </button>
            </div>

            <div className="flex justify-between items-center mb-2 font-mono text-[10px] sm:text-[11px] text-textMuted uppercase tracking-wider pl-1">
              <span>Avail</span>
              <span className="text-white bg-elevated px-1.5 py-0.5 rounded cursor-pointer border border-[#1E2D3D] text-xs">
                {side === 'BUY' ? `₹${(user?.virtualBalance / 1000).toFixed(1)}K` : `${holding.toFixed(4)} ${activeSymbol.replace('INR','')}`}
              </span>
            </div>

            <div className="space-y-4">
              <div className="premium-input rounded-lg flex items-center justify-between px-4 py-3 transition-colors">
                <span className="text-textMuted font-mono text-xs">Price</span>
                <span className="font-mono text-sm text-textPrimary">Market</span>
              </div>

              <div className="premium-input rounded-lg flex items-center px-4 py-3 transition-colors">
                <span className="text-textMuted font-mono text-xs w-16">Amount</span>
                <input 
                  type="number" 
                  value={amountInr} 
                  onChange={(e) => {
                    setAmountInr(e.target.value);
                    setSliderPct(0); // detach
                  }}
                  placeholder="0.00" 
                  className="bg-transparent font-mono text-sm text-right flex-1 outline-none text-white placeholder-textMuted w-full" 
                />
                <span className="text-textMuted font-mono text-xs ml-2">INR</span>
              </div>
            </div>

            <QuantitySlider value={sliderPct} onChange={handleSliderChange} />

            <div className="bg-[#151b23] border border-[#1E2D3D] rounded-lg p-3 my-6 space-y-2 font-mono text-[11px]">
              <div className="flex justify-between"><span className="text-textMuted">Est. Qty</span> <span className="text-white">{amountInr ? qtyEstimation.toFixed(6) : '0.000'} {activeSymbol.replace('INR','')}</span></div>
              <div className="flex justify-between"><span className="text-textMuted">Fee (0.1%)</span> <span className="text-white">{amountInr ? (amountInr * 0.001).toFixed(2) : '0.00'} INR</span></div>
            </div>

            <button 
              onClick={() => {
                if (!canExecute) {
                  toast.error(effectivePrice <= 0 ? 'Live price unavailable. Please wait for market data.' : 'Invalid trade amount');
                  return;
                }
                tradeMutation.mutate({
                  coin: activeSymbol.replace('INR', ''),
                  symbol: activeSymbol,
                  type: side,
                  isAmountBased: true,
                  amount: parsedAmount,
                });
              }}
              disabled={!canExecute}
              className={`w-full py-4 rounded-lg font-heading font-bold text-lg tracking-widest uppercase transition-all ${(side === 'BUY' && canExecute) ? 'bg-accent text-bg-base hover:bg-[#00e67a] shadow-[0_0_15px_#00D08440]' : (side === 'SELL' && canExecute) ? 'bg-danger text-white hover:bg-[#ff1a40] shadow-[0_0_15px_#FF3B5C40]' : 'bg-elevated text-textMuted cursor-not-allowed border border-[#1E2D3D]'}`}
            >
              {tradeMutation.isPending ? 'Executing...' : `${side} ${activeSymbol.replace('INR','')}`}
            </button>
            {!canExecute && <p className="mt-2 text-[11px] text-textMuted font-mono text-center">{disabledReason}</p>}

            <div className="mt-6 border border-borderSubtle rounded-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-borderSubtle text-xs uppercase tracking-wider text-textSecondary font-mono">Recent Trades</div>
              <div className="max-h-[180px] overflow-y-auto">
                {recentTrades?.length ? recentTrades.slice(0, 6).map((t) => (
                  <div key={t._id} className="px-3 py-2 border-b border-borderSubtle/50 text-xs flex items-center justify-between">
                    <span className={t.type === 'BUY' ? 'text-accent' : 'text-danger'}>{t.type}</span>
                    <span className="font-mono text-textPrimary">{toNum(t.quantity).toFixed(4)}</span>
                    <span className="font-mono text-textSecondary">₹{formatNum(t.price, 2)}</span>
                  </div>
                )) : <div className="px-3 py-4 text-xs text-textMuted text-center">No recent trades</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default TradePage;
