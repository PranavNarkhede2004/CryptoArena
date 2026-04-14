import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '../api/axios';
import useAuthStore from '../store/authStore';
import usePriceStore from '../store/priceStore';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, ArrowRight, ReceiptText } from 'lucide-react';
import PercentageBadge from '../components/ui/PercentageBadge';
import OrderBadge from '../components/ui/OrderBadge';

const gradientCycle = [
  'linear-gradient(135deg, #00D084, #3B82F6)',
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
  'linear-gradient(135deg, #F59E0B, #EF4444)',
  'linear-gradient(135deg, #3B82F6, #00D084)',
];
const toTvSymbolCandidates = (symbol = 'BTCINR') => {
  const clean = String(symbol || 'BTCINR').toUpperCase().replace(/[^A-Z0-9]/g, '');
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

const useCountUp = (value) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    let frameId;
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setCount(value * progress);
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return count;
};

const StatCard = ({ title, value, percent, trend, index, sparkle = false }) => {
  const animated = useCountUp(Number(value) || 0);
  return (
    <div
      className="premium-card rounded-xl p-7 relative overflow-hidden h-[168px] dashboard-fade-in hover:-translate-y-1 transition-transform"
      style={{ animationDelay: `${(index + 1) * 0.1}s` }}
    >
      {sparkle && <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(0,208,132,0.08),transparent)] pointer-events-none" />}
      <div className="text-[10px] text-textMuted uppercase tracking-[0.15em]">{title}</div>
      <div className="mt-3 text-[2rem] font-mono font-bold text-textPrimary">
        <span className="text-accent text-[34px] align-middle">₹</span>
        {(Number(value) ? animated : 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </div>
      <div className="mt-2 flex items-center justify-between">
        {percent !== undefined ? (
          <div className="text-xs flex items-center gap-2">
            <PercentageBadge val={percent} className="premium-pill" />
            <span className="text-textMuted">vs yesterday</span>
          </div>
        ) : (
          <span />
        )}
        {trend !== undefined && (
          <button className="w-8 h-8 rounded-full bg-accentDim border border-[#00D08433] text-accent flex items-center justify-center shadow-glowGreen hover:shadow-[0_0_16px_rgba(0,208,132,0.35)] transition-all">
            <TrendingUp size={16} />
          </button>
        )}
      </div>
      {title === 'Portfolio Value' && (
        <svg className="absolute right-4 bottom-3" width="90" height="24" viewBox="0 0 90 24" fill="none">
          <polyline points="4,14 18,14 30,14 42,14 54,14 66,14 82,14" stroke="#4A5568" strokeWidth="2" fill="none" />
          {[4, 18, 30, 42, 54, 66, 82].map((x) => <circle key={x} cx={x} cy="14" r="1.8" fill="#4A5568" />)}
        </svg>
      )}
    </div>
  );
};

const ChartPanel = ({ symbol, livePrice, change24h }) => {
  const [timeframe, setTimeframe] = useState('1D');
  const [sourceIdx, setSourceIdx] = useState(0);
  const candidates = toTvSymbolCandidates(symbol);
  const tvSymbol = candidates[Math.min(sourceIdx, candidates.length - 1)];

  useEffect(() => {
    setSourceIdx(0);
  }, [symbol]);

  return (
    <div className="premium-card rounded-xl overflow-hidden dashboard-fade-in" style={{ animationDelay: '0.2s' }}>
      <div className="px-5 py-4 border-b border-borderSubtle flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-heading font-bold text-lg">BTC/INR Overview</span>
          <span className="font-mono text-accent font-semibold glow-green">₹{Number(livePrice || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          <span className={`premium-pill ${Number(change24h) < 0 ? 'danger-pill' : ''}`}>{Number(change24h) >= 0 ? '▲' : '▼'} {Math.abs(Number(change24h || 0)).toFixed(2)}%</span>
        </div>
        <Link to="/trade/BTCINR" className="px-3 py-1.5 rounded-full border border-accent text-accent hover:bg-accent hover:text-bg-base transition-all text-xs font-semibold">
          Trading Terminal →
        </Link>
        {candidates.length > 1 && (
          <button
            onClick={() => setSourceIdx((i) => (i + 1) % candidates.length)}
            className="px-3 py-1.5 rounded-full border border-borderSubtle text-textSecondary hover:text-textPrimary transition-all text-xs font-semibold"
          >
            Source: {tvSymbol.split(':')[0]}
          </button>
        )}
      </div>
      <div className="px-5 py-3 border-b border-borderSubtle flex gap-2">
        {['1H', '4H', '1D', '1W'].map((tf) => (
          <button key={tf} onClick={() => setTimeframe(tf)} className={`px-3 py-1 rounded-full text-xs border transition-all ${timeframe === tf ? 'bg-accent border-accent text-bg-base' : 'border-borderSubtle text-textSecondary hover:text-textPrimary'}`}>
            {tf}
          </button>
        ))}
      </div>
      <div className="p-4 relative">
        <div className="relative rounded-xl overflow-hidden border border-borderSubtle" style={{ height: '380px', minHeight: '380px' }}>
          <iframe
            key={`${symbol}-${tvSymbol}`}
            title="dashboard-tradingview"
            src={`https://s.tradingview.com/widgetembed/?symbol=${tvSymbol}&interval=${timeframe === '1W' ? 'W' : timeframe === '1D' ? 'D' : timeframe === '4H' ? '240' : '60'}&theme=dark&style=1&toolbarbg=080B11&hide_top_toolbar=0&hide_legend=0&saveimage=0`}
            width="100%"
            height="100%"
            frameBorder="0"
          />
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuthStore();
  const { prices } = usePriceStore();
  const navigate = useNavigate();
  const [side, setSide] = useState('BUY');
  const [selectedCoin, setSelectedCoin] = useState('BTCINR');
  const [amount, setAmount] = useState('');

  const { data: summary } = useQuery({
    queryKey: ['portfolioSummary'],
    queryFn: async () => (await axios.get('/portfolio/summary')).data
  });

  const { data: history } = useQuery({
    queryKey: ['recentTrades'],
    queryFn: async () => (await axios.get('/trades/history')).data
  });

  const marketArr = useMemo(() => Object.values(prices).sort((a, b) => b.volume - a.volume), [prices]);
  const gainers = useMemo(() => [...marketArr].sort((a, b) => b.change24h - a.change24h).slice(0, 5), [marketArr]);
  const quickCoin = marketArr.find((m) => m.symbol === selectedCoin) || marketArr[0];
  const qty = Number(amount || 0);
  const total = qty * Number(quickCoin?.lastPrice || 0);

  return (
    <div className="w-full max-w-[1680px] mx-auto space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <StatCard title="Available Balance" value={summary?.balance ?? 1000000} index={0} sparkle />
        <StatCard title="Portfolio Value" value={summary?.currentValue} index={1} />
        <StatCard title="Unrealized PnL" value={summary?.pnl} percent={summary?.pnlPercent ?? 0} index={2} />
        <StatCard title="24H Revenue" value={summary?.dayRevenue ?? summary?.pnl ?? 1268} percent={1.2} trend={1} index={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <div className="lg:col-span-8">
          <ChartPanel symbol="BTCINR" livePrice={prices.BTCINR?.lastPrice} change24h={prices.BTCINR?.change24h} />
        </div>
        <div className="lg:col-span-4 premium-card rounded-xl overflow-hidden flex flex-col dashboard-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-borderSubtle font-heading text-[16px] sm:text-[18px] font-bold">
            Top Gainers 🚀
          </div>
          <div className="flex-1">
            {gainers.map((coin, idx) => (
              <div key={coin.symbol} onClick={() => navigate(`/trade/${coin.symbol}`)} className={`flex items-center justify-between px-2 sm:px-3 py-2 sm:py-3 mx-1 sm:mx-2 hover:bg-white/3 rounded-[8px] sm:rounded-[10px] cursor-pointer transition-all ${idx === gainers.length - 1 ? '' : 'border-b border-borderSubtle'}`}>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-semibold text-white text-xs sm:text-sm" style={{ background: gradientCycle[idx % gradientCycle.length] }}>
                    {coin.symbol.charAt(0)}
                  </div>
                  <div>
                    <div className="font-heading font-semibold text-textPrimary text-sm sm:text-base">{coin.symbol.replace('INR', '')}</div>
                    <div className="text-[10px] sm:text-[11px] text-textMuted">Vol: {coin.volume < 1000 ? coin.volume.toFixed(1) : `${(coin.volume / 1000).toFixed(1)}K`}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold text-xs sm:text-sm">₹{coin.lastPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                  <span className="inline-flex items-center gap-1 mt-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-bold border border-[#00D08440] bg-[#00D08426] text-accent">▲ {coin.change24h.toFixed(2)}%</span>
                </div>
              </div>
            ))}
            {!gainers.length && <div className="m-2 sm:m-4 h-32 sm:h-40 rounded-xl shimmer bg-[#101821]" />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <div className="lg:col-span-8 premium-card rounded-xl overflow-hidden dashboard-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-borderSubtle font-heading font-bold text-base sm:text-lg flex justify-between items-center">
            Recent Executions
            <Link to="/portfolio" className="text-xs text-textSecondary hover:text-accent flex items-center">View all <ArrowRight size={14} className="ml-1" /></Link>
          </div>
          {history?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead className="bg-[#10151c] text-[10px] sm:text-xs text-textSecondary uppercase tracking-wider">
                  <tr>
                    <th className="px-3 sm:px-5 py-2 sm:py-3">Time</th>
                    <th className="px-3 sm:px-5 py-2 sm:py-3">Pair</th>
                    <th className="px-3 sm:px-5 py-2 sm:py-3">Type</th>
                    <th className="px-3 sm:px-5 py-2 sm:py-3 text-right hidden sm:table-cell">Price</th>
                    <th className="px-3 sm:px-5 py-2 sm:py-3 text-right hidden sm:table-cell">Quantity</th>
                    <th className="px-3 sm:px-5 py-2 sm:py-3 text-right">Total</th>
                    <th className="px-3 sm:px-5 py-2 sm:py-3 text-right hidden sm:table-cell">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 7).map((trade, idx) => (
                    <tr key={trade._id} className={`border-b border-borderSubtle/70 hover:bg-white/3 ${idx % 2 === 1 ? 'bg-[#0a111a]' : ''}`}>
                      <td className="px-3 sm:px-5 py-2 sm:py-3 text-textSecondary font-mono text-xs">{new Date(trade.timestamp).toLocaleTimeString()}</td>
                      <td className="px-3 sm:px-5 py-2 sm:py-3 font-heading font-semibold text-xs sm:text-sm">{trade.symbol}</td>
                      <td className="px-3 sm:px-5 py-2 sm:py-3"><OrderBadge type={trade.type} /></td>
                      <td className="px-3 sm:px-5 py-2 sm:py-3 text-right font-mono text-xs hidden sm:table-cell">₹{trade.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td className="px-3 sm:px-5 py-2 sm:py-3 text-right font-mono text-xs hidden sm:table-cell">{trade.quantity.toFixed(6)}</td>
                      <td className="px-3 sm:px-5 py-2 sm:py-3 text-right font-mono text-xs">₹{(trade.price * trade.quantity).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td className="px-3 sm:px-5 py-2 sm:py-3 text-right hidden sm:table-cell"><span className="text-[10px] border border-borderSubtle px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md text-textSecondary">Filled</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-[200px] sm:h-[250px] flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-borderSubtle bg-[#111a24] flex items-center justify-center text-textMuted mb-3">
                <ReceiptText size={20} className="sm:size-26" />
              </div>
              <h4 className="font-heading text-base sm:text-lg mb-1">No trades yet</h4>
              <p className="text-sm text-textMuted mb-4">Execute your first trade from the Markets page</p>
              <Link to="/market" className="px-4 py-2 rounded-lg bg-accent text-bg-base font-semibold shadow-glowGreen hover:brightness-110 active:scale-[0.97] transition-all">Explore Markets →</Link>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 premium-card rounded-xl p-5 dashboard-fade-in" style={{ animationDelay: '0.5s' }}>
          <h3 className="font-heading text-xl font-bold mb-4">Quick Trade</h3>
          <select value={selectedCoin} onChange={(e) => setSelectedCoin(e.target.value)} className="premium-input w-full rounded-lg px-3 py-2 text-sm mb-4">
            {marketArr.slice(0, 12).map((coin) => (
              <option key={coin.symbol} value={coin.symbol}>{coin.symbol}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2 mb-4 rounded-lg p-1 bg-[#0b121a] border border-borderSubtle">
            <button onClick={() => setSide('BUY')} className={`py-2 rounded-md text-sm font-semibold transition-all ${side === 'BUY' ? 'bg-accent text-bg-base shadow-glowGreen' : 'text-textSecondary border border-transparent'}`}>BUY</button>
            <button onClick={() => setSide('SELL')} className={`py-2 rounded-md text-sm font-semibold transition-all ${side === 'SELL' ? 'bg-danger text-white shadow-glowRed' : 'text-textSecondary border border-transparent'}`}>SELL</button>
          </div>
          <div className="relative mb-2">
            <span className="absolute left-3 top-2.5 text-textSecondary">₹</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Amount" className="premium-input w-full rounded-lg pl-7 pr-3 py-2" />
          </div>
          <p className="text-xs text-textMuted mb-4">Available: ₹{Number(user?.virtualBalance || 0).toLocaleString()}</p>
          <div className="rounded-lg border border-borderSubtle bg-[#0b121a] p-3 mb-4">
            <div className="text-xs text-textMuted">Live Total</div>
            <div className="font-mono text-lg mt-1">₹{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          </div>
          <button className={`w-full py-3 rounded-lg font-semibold active:scale-[0.97] transition-all ${side === 'BUY' ? 'bg-accent text-bg-base shadow-glowGreen hover:brightness-110' : 'bg-danger text-white shadow-glowRed hover:brightness-110'}`}>
            Execute {side}
          </button>
        </div>
      </div>

      <div className="premium-card rounded-xl p-4 dashboard-fade-in" style={{ animationDelay: '0.6s' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-lg font-bold">Market Overview</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {marketArr.slice(0, 12).map((coin, idx) => (
            <div key={coin.symbol} className="min-w-[160px] border border-borderSubtle rounded-xl p-3 bg-surface hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(0,0,0,0.55)] transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full text-xs font-semibold text-white flex items-center justify-center" style={{ background: gradientCycle[idx % gradientCycle.length] }}>
                  {coin.symbol.charAt(0)}
                </div>
                <span className="font-heading text-sm">{coin.symbol.replace('INR', '')}</span>
              </div>
              <div className="font-mono text-sm mb-1">₹{coin.lastPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] border ${coin.change24h >= 0 ? 'text-accent bg-accentDim border-[#00D08440]' : 'text-danger bg-dangerDim border-[#FF3B5C55]'}`}>
                {coin.change24h >= 0 ? '▲' : '▼'} {Math.abs(coin.change24h).toFixed(2)}%
              </span>
              <svg className="mt-2" width="130" height="24" viewBox="0 0 130 24" fill="none">
                <polyline points="2,18 18,14 34,15 50,12 66,14 84,10 104,12 126,9" stroke={coin.change24h >= 0 ? '#00D084' : '#FF3B5C'} strokeWidth="1.7" fill="none" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
