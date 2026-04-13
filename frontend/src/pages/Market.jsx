import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import usePriceStore from '../store/priceStore';
import axios from '../api/axios';
import { Search, X, Zap } from 'lucide-react';
import CoinLogo from '../components/ui/CoinLogo';
import PercentageBadge from '../components/ui/PercentageBadge';
import PriceFlash from '../components/ui/PriceFlash';
import MiniSparkline from '../components/ui/MiniSparkline';
import { motion, AnimatePresence } from 'framer-motion';

const toNum = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const formatInr = (value, digits = 2) =>
  toNum(value).toLocaleString(undefined, { maximumFractionDigits: digits });
const cleanSymbol = (symbol = '') => String(symbol || '');
const avatarGradients = [
  'linear-gradient(135deg, #00D084, #3B82F6)',
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
  'linear-gradient(135deg, #F59E0B, #EF4444)',
];

const Drawer = ({ onClose, coin }) => {
  const navigate = useNavigate();
  // We use Framer Motion AnimatePresence wrapper around Drawer invocation in parent
  return (
    <>
      <motion.div 
        className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div 
        className="fixed top-0 right-0 w-full md:w-[400px] h-full premium-card border-l border-borderSubtle z-[70] flex flex-col shadow-2xl"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {coin && (
          <>
            <div className="flex items-center justify-between p-6 border-b border-borderSubtle">
              <div className="flex items-center gap-4">
                <CoinLogo symbol={coin.symbol} size={40} />
                <div>
                  <h2 className="text-xl font-heading font-bold text-white">{coin.symbol.replace('INR','')}</h2>
                  <div className="text-xs text-textMuted font-mono">Rank #1</div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 bg-elevated hover:bg-borderDefault rounded transition-colors group">
                <X size={20} className="text-textMuted group-hover:text-white" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="mb-8">
                <div className="text-sm text-textMuted uppercase font-mono mb-2 tracking-[0.15em]">Live Price</div>
                <PriceFlash val={toNum(coin.lastPrice)}>
                  <div className="text-4xl font-mono font-medium text-white mb-2 tracking-tight glow-green">₹{formatInr(coin.lastPrice, 2)}</div>
                </PriceFlash>
                <PercentageBadge val={toNum(coin.change24h)} />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="premium-card p-4 rounded-lg">
                  <div className="text-xs text-textMuted font-mono uppercase">24H High</div>
                  <div className="font-mono text-sm mt-1">₹{formatInr(coin.high, 2)}</div>
                </div>
                <div className="premium-card p-4 rounded-lg">
                  <div className="text-xs text-textMuted font-mono uppercase">24H Low</div>
                  <div className="font-mono text-sm mt-1">₹{formatInr(coin.low, 2)}</div>
                </div>
                <div className="premium-card p-4 rounded-lg col-span-2">
                  <div className="text-xs text-textMuted font-mono uppercase">Volume (24H)</div>
                  <div className="font-mono text-sm mt-1">{formatInr(coin.volume, 0)} {coin.symbol.replace('INR','')}</div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-borderSubtle bg-[#0f1622]">
               <button 
                 onClick={() => navigate(`/trade/${coin.symbol}`)}
                 className="w-full bg-accent hover:bg-[#00e67a] text-bg-base font-bold uppercase tracking-widest py-4 rounded-lg transition-all active:scale-[0.97] shadow-glowGreen flex justify-center items-center gap-2"
               >
                 <Zap size={20} /> Execute Trade
               </button>
            </div>
          </>
        )}
      </motion.div>
    </>
  );
}

const Market = () => {
  const navigate = useNavigate();
  const { prices, connectionStatus } = usePriceStore();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedCoin, setSelectedCoin] = useState(null);
  const { data: tickerFallback = [], isLoading: isFallbackLoading } = useQuery({
    queryKey: ['marketTickers'],
    queryFn: async () => (await axios.get('/market/tickers')).data,
    refetchInterval: 10000,
  });

  const buildSpark = (price, change, symbol) => {
    const safePrice = Math.max(toNum(price, 0), 0.000001);
    const safeChange = toNum(change, 0);
    const safeSymbol = cleanSymbol(symbol);
    const seed = safeSymbol.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const arr = [safePrice];
    let curr = safePrice / (1 + safeChange / 100);
    for (let i = 0; i < 6; i += 1) {
      const drift = ((Math.sin(seed + i * 1.7) + 1) / 2 - 0.4) * 0.02;
      curr += curr * drift * (safeChange > 0 ? 1 : -1);
      arr.push(curr);
    }
    return arr.reverse();
  };

  const tabs = ['All', 'Gainers', 'Losers', 'Volume'];

  const mergedMarket = useMemo(() => {
    const baseMap = new Map();
    (Array.isArray(tickerFallback) ? tickerFallback : []).forEach((t) => {
      if (t?.symbol) baseMap.set(cleanSymbol(t.symbol), t);
    });
    Object.values(prices || {}).forEach((p) => {
      if (p?.symbol) baseMap.set(cleanSymbol(p.symbol), { ...baseMap.get(cleanSymbol(p.symbol)), ...p });
    });
    return Array.from(baseMap.values());
  }, [tickerFallback, prices]);
  
  const coinList = useMemo(() => {
    const base = mergedMarket.filter((c) => {
      const sym = cleanSymbol(c?.symbol);
      return sym && sym.toLowerCase().includes(search.toLowerCase());
    });
    if (filter === 'Gainers') return base.filter((c) => c.change24h > 0).sort((a, b) => b.change24h - a.change24h);
    if (filter === 'Losers') return base.filter((c) => c.change24h < 0).sort((a, b) => a.change24h - b.change24h);
    return base.sort((a, b) => b.volume - a.volume);
  }, [mergedMarket, search, filter]);

  return (
    <div className="w-full max-w-[1600px] mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
        <h1 className="text-3xl font-heading font-bold text-textPrimary tracking-tight">Market Explorer</h1>
        <div className="relative group w-full md:w-64">
           <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted group-focus-within:text-accent transition-colors" />
           <input 
             value={search}
             onChange={e => setSearch(e.target.value)}
             placeholder="Search markets..." 
             className="w-full bg-surface border border-borderSubtle focus:border-accent rounded-full py-2 pl-9 pr-4 text-sm font-sans outline-none transition-colors"
           />
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-borderSubtle pb-4 shrink-0 overflow-x-auto no-scrollbar">
        {tabs.map(t => (
          <button 
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === t ? 'bg-accent text-bg-base font-bold' : 'bg-elevated text-textSecondary hover:bg-borderDefault hover:text-white'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {connectionStatus !== 'connected' && (
        <div className="mb-3 text-xs text-textMuted font-mono">
          Live socket disconnected - showing fallback market snapshot.
        </div>
      )}

      <div className="flex-1 premium-card rounded-xl overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left font-sans text-sm border-collapse min-w-[980px]">
              <thead className="bg-elevated sticky top-0 z-10 shadow-sm border-b border-borderSubtle">
                <tr>
                  <th className="p-4 text-textSecondary font-medium w-16 text-center">#</th>
                  <th className="p-4 text-textSecondary font-medium min-w-[200px]">Asset</th>
                  <th className="p-4 text-textSecondary font-medium text-right min-w-[120px]">Price</th>
                  <th className="p-4 text-textSecondary font-medium text-right w-[120px]">24H Change</th>
                  <th className="p-4 text-textSecondary font-medium text-right hidden lg:table-cell w-[180px]">24H High / Low</th>
                  <th className="p-4 text-textSecondary font-medium text-right w-[130px]">Volume</th>
                  <th className="p-4 text-textSecondary font-medium text-center w-[120px]">7D Trend</th>
                  <th className="p-4 text-textSecondary font-medium text-center w-[100px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderSubtle">
                {isFallbackLoading && !coinList.length && Array.from({ length: 10 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td colSpan="8" className="px-4 py-3">
                      <div className="h-9 rounded shimmer" />
                    </td>
                  </tr>
                ))}
                {coinList.map((coin, i) => (
                  <tr 
                    key={cleanSymbol(coin.symbol)} 
                    onClick={() => setSelectedCoin(coin)}
                    className="hover:bg-elevated cursor-pointer transition-colors group relative"
                  >
                    <td className="px-4 py-[14px] text-textMuted text-center font-mono text-xs">{i + 1}</td>
                    <td className="px-4 py-[14px] flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ background: avatarGradients[i % avatarGradients.length] }}
                      >
                        {cleanSymbol(coin.symbol).charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-textPrimary tracking-wide">{cleanSymbol(coin.symbol).replace('INR', '')}</div>
                        <div className="text-xs text-textMuted uppercase font-mono">{cleanSymbol(coin.symbol)}</div>
                      </div>
                    </td>
                    <td className="px-4 py-[14px] text-right">
                      <PriceFlash val={toNum(coin.lastPrice)} className="block w-full h-full">
                        <span className="font-mono text-textPrimary tracking-tight">₹{formatInr(coin.lastPrice, 2)}</span>
                      </PriceFlash>
                    </td>
                    <td className="px-4 py-[14px] text-right">
                       <PercentageBadge val={toNum(coin.change24h)} />
                    </td>
                    <td className="px-4 py-[14px] text-right font-mono text-xs text-textMuted hidden lg:table-cell">
                      <div>H: {toNum(coin.high) > 0 ? formatInr(coin.high, 2) : '—'}</div>
                      <div>L: {toNum(coin.low) > 0 ? formatInr(coin.low, 2) : '—'}</div>
                    </td>
                    <td className="px-4 py-[14px] text-right font-mono text-xs text-textSecondary">{formatInr(coin.volume, 0)}</td>
                    <td className="px-4 py-[14px] flex justify-center">
                       <MiniSparkline data={buildSpark(coin.lastPrice, coin.change24h, cleanSymbol(coin.symbol))} color={toNum(coin.change24h) >= 0 ? '#00D084' : '#FF3B5C'} width={100} height={36} strokeWidth={2} />
                    </td>
                    <td className="px-4 py-[14px] text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/trade/${cleanSymbol(coin.symbol)}`); }}
                        className="opacity-0 group-hover:opacity-100 px-3 py-1 rounded-full border border-accent text-accent hover:bg-accent hover:text-bg-base text-[11px] font-bold transition-all"
                      >
                        TRADE
                      </button>
                    </td>
                  </tr>
                ))}
                {!isFallbackLoading && !coinList.length && (
                  <tr>
                    <td colSpan="8" className="px-4 py-10 text-center text-textMuted">
                      No market pairs available right now. Check backend `/market/tickers` response.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </div>

      <AnimatePresence>
        {selectedCoin && <Drawer coin={selectedCoin} onClose={() => setSelectedCoin(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default Market;
