import { Fragment, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import CoinLogo from '../components/ui/CoinLogo';
import PercentageBadge from '../components/ui/PercentageBadge';
import PriceFlash from '../components/ui/PriceFlash';
import {
  Activity,
  Award,
  Clock3,
  Coins,
  Download,
  Gauge,
  ListOrdered,
  PanelRight,
  Percent,
  PlusCircle,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  X,
  Wallet,
  Zap,
} from 'lucide-react';
import usePriceStore from '../store/priceStore';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const spark = (seed = 1) => Array.from({ length: 7 }, (_, i) => 8 + Math.sin(seed + i * 0.9) * 5 + i);
const fmt = (v, d = 2) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: d });
const topLine = ['#00d97e', '#3B82F6', '#FF3B5C', '#8B5CF6', '#00d97e', '#F59E0B'];
const chartPalette = ['#00d97e', '#3B82F6', '#F59E0B', '#8B5CF6', '#FF3B5C', '#14B8A6', '#A855F7', '#EAB308', '#22C55E', '#F97316'];

const MiniSpark = ({ data, color = '#00d97e' }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / 6) * 90},${26 - ((v - min) / range) * 22}`).join(' ');
  return (
    <svg width="90" height="28" viewBox="0 0 90 28" fill="none">
      <polyline points={points} stroke={color} strokeWidth="2" fill="none" />
    </svg>
  );
};

const AnimatedNumber = ({ value = 0, duration = 800, decimals = 2, prefix = '', suffix = '' }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let rafId;
    let startTs = null;
    const from = 0;
    const to = Number(value || 0);
    const step = (ts) => {
      if (!startTs) startTs = ts;
      const progress = Math.min((ts - startTs) / duration, 1);
      const eased = 1 - ((1 - progress) ** 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [value, duration]);

  return <>{prefix}{fmt(display, decimals)}{suffix}</>;
};

const MetricCard = ({ title, icon: Icon, accent, valueNode, sub }) => (
  <div className="premium-card rounded-xl p-4 border-t-2" style={{ borderTopColor: accent }}>
    <div className="flex items-center justify-between mb-2">
      <div className="text-[10px] uppercase tracking-[0.16em] text-textMuted">{title}</div>
      <Icon size={14} style={{ color: accent }} />
    </div>
    <div className="font-mono text-[1.35rem] text-white leading-none">{valueNode}</div>
    <div className="mt-2 text-xs text-textSecondary">{sub}</div>
  </div>
);

const SummaryCard = ({ idx, title, value, sub, tone = 'text-[#E8EDF5]', onClick }) => (
  <button
    onClick={onClick}
    className="premium-card rounded-xl p-4 text-left transition-all hover:-translate-y-1"
    style={{ borderTopColor: topLine[idx % topLine.length] }}
  >
    <div className="text-[10px] uppercase tracking-[0.16em] text-textMuted mb-2">{title}</div>
    <div className={`font-mono text-[1.7rem] leading-none ${tone}`}>{value}</div>
    <div className="mt-2 text-xs text-textSecondary flex items-center justify-between">
      <span>{sub}</span>
      <MiniSpark data={spark(idx + 1)} color={topLine[idx % topLine.length]} />
    </div>
  </button>
);

const sortValue = (row, key) => {
  if (key === 'asset') return row.symbol;
  if (key === 'holdings') return Number(row.quantity || 0);
  if (key === 'entry') return Number(row.avgBuyPrice || 0);
  if (key === 'live') return Number(row.currentPrice || 0);
  if (key === 'value') return Number(row.currentValue || 0);
  if (key === 'pnl') return Number(row.pnl || 0);
  if (key === 'pnlPct') return Number(row.pnlPercent || 0);
  if (key === 'change24h') return Number(row.change24h || 0);
  if (key === 'weight') return Number(row.weight || 0);
  return 0;
};

const Portfolio = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [hideSmall, setHideSmall] = useState(false);
  const [sortKey, setSortKey] = useState('value');
  const [sortDir, setSortDir] = useState('desc');
  const [expanded, setExpanded] = useState(null);
  const [highlightedSymbol, setHighlightedSymbol] = useState(null);
  const [range, setRange] = useState('1M');
  const [showRealized, setShowRealized] = useState(true);
  const [showUnrealized, setShowUnrealized] = useState(true);
  const [tradePage, setTradePage] = useState(1);
  const [tradeCoin, setTradeCoin] = useState('ALL');
  const [tradeSide, setTradeSide] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('orders');
  const { prices, connectionStatus } = usePriceStore();

  const { data: portfolio, isLoading: isPortfolioLoading } = useQuery({ queryKey: ['portfolioData'], queryFn: async () => (await axios.get('/portfolio')).data });
  const { data: summary, isLoading: isSummaryLoading } = useQuery({ queryKey: ['portfolioSummary'], queryFn: async () => (await axios.get('/portfolio/summary')).data });
  const { data: tickers } = useQuery({ queryKey: ['marketTickers'], queryFn: async () => (await axios.get('/market/tickers')).data, staleTime: 7000 });
  const { data: trades } = useQuery({
    queryKey: ['recentTrades'],
    queryFn: async () => (await axios.get('/trades/history')).data,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });
  const { data: watchlistData, isLoading: isWatchlistLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => (await axios.get('/watchlist')).data,
  });

  const holdings = portfolio?.holdings || [];
  const realized = Number(summary?.realizedPnl || portfolio?.realizedPnl || 0);
  const invested = Number(summary?.invested || portfolio?.totalInvested || 0);

  const tickerMap = useMemo(() => {
    const map = new Map();
    (tickers || []).forEach((t) => map.set(t.symbol, t));
    return map;
  }, [tickers]);

  const livePriceMap = useMemo(() => {
    const map = new Map();
    Object.values(prices || {}).forEach((p) => {
      if (p?.symbol) map.set(p.symbol, p);
    });
    return map;
  }, [prices]);

  const tradesBySymbol = useMemo(() => {
    const map = new Map();
    (trades || []).forEach((t) => {
      if (!map.has(t.symbol)) map.set(t.symbol, []);
      map.get(t.symbol).push(t);
    });
    return map;
  }, [trades]);

  const sortedTrades = useMemo(() => {
    const list = Array.isArray(trades) ? [...trades] : [];
    return list.sort((a, b) => new Date(b.createdAt || b.date || b.updatedAt || 0) - new Date(a.createdAt || a.date || a.updatedAt || 0));
  }, [trades]);

  const tradeCoins = useMemo(() => {
    const uniq = new Set(sortedTrades.map((t) => t.symbol).filter(Boolean));
    return ['ALL', ...Array.from(uniq)];
  }, [sortedTrades]);

  const filteredTrades = useMemo(() => {
    const fromTs = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const toTs = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null;
    return sortedTrades.filter((t) => {
      const tTs = new Date(t.createdAt || t.date || 0).getTime();
      const byCoin = tradeCoin === 'ALL' || t.symbol === tradeCoin;
      const bySide = tradeSide === 'ALL' || t.type === tradeSide;
      const byFrom = fromTs === null || tTs >= fromTs;
      const byTo = toTs === null || tTs <= toTs;
      return byCoin && bySide && byFrom && byTo;
    });
  }, [sortedTrades, tradeCoin, tradeSide, fromDate, toDate]);

  const watchlistCoins = watchlistData?.coins || [];
  const addWatchMut = useMutation({
    mutationFn: async (symbol) => axios.post('/watchlist/add', { symbol }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  });
  const removeWatchMut = useMutation({
    mutationFn: async (symbol) => axios.delete(`/watchlist/${symbol}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
  });

  const tradesPerPage = 10;
  const totalTradePages = Math.max(1, Math.ceil(filteredTrades.length / tradesPerPage));
  const safeTradePage = Math.min(tradePage, totalTradePages);
  const pagedTrades = useMemo(() => {
    const start = (safeTradePage - 1) * tradesPerPage;
    return filteredTrades.slice(start, start + tradesPerPage);
  }, [filteredTrades, safeTradePage]);

  const tradeSummary = useMemo(() => {
    const totalFees = filteredTrades.reduce((acc, t) => acc + Number(t.fee || 0), 0);
    const totalRealized = filteredTrades.reduce((acc, t) => {
      if (t.type !== 'SELL') return acc;
      return acc + Number(t.profitLoss ?? t.pnl ?? 0);
    }, 0);
    return { totalFees, totalRealized, totalCount: filteredTrades.length };
  }, [filteredTrades]);

  const exportTradesCsv = () => {
    const headers = ['Date/Time', 'Coin', 'Side', 'Quantity', 'Price', 'Total INR', 'Fee', 'PnL', 'Status'];
    const rows = filteredTrades.map((t) => [
      new Date(t.createdAt || t.date || Date.now()).toLocaleString(),
      t.symbol || '',
      t.type || '',
      Number(t.quantity || 0),
      Number(t.price || 0),
      Number(t.total || 0),
      Number(t.fee || 0),
      t.type === 'SELL' ? Number(t.profitLoss ?? t.pnl ?? 0) : '',
      t.status || 'COMPLETED',
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetTradeFilters = () => {
    setTradeCoin('ALL');
    setTradeSide('ALL');
    setFromDate('');
    setToDate('');
    setTradePage(1);
  };

  const visiblePageButtons = useMemo(() => {
    const maxButtons = 5;
    const start = Math.max(1, safeTradePage - 2);
    const end = Math.min(totalTradePages, start + maxButtons - 1);
    const adjustedStart = Math.max(1, end - maxButtons + 1);
    return Array.from({ length: end - adjustedStart + 1 }, (_, i) => adjustedStart + i);
  }, [safeTradePage, totalTradePages]);

  const liveRows = useMemo(() => {
    const rows = holdings.map((h) => {
      const socketTicker = livePriceMap.get(h.symbol);
      const fallbackTicker = tickerMap.get(h.symbol);
      const live = Number(socketTicker?.lastPrice ?? fallbackTicker?.lastPrice ?? h.currentPrice ?? 0);
      const quantity = Number(h.quantity || 0);
      const avgBuyPrice = Number(h.avgBuyPrice || 0);
      const currentValue = live * quantity;
      const pnl = currentValue - (avgBuyPrice * quantity);
      const pnlPercent = avgBuyPrice > 0 ? ((live - avgBuyPrice) / avgBuyPrice) * 100 : 0;
      const change24h = Number(socketTicker?.change24h ?? fallbackTicker?.change24h ?? h.change24h ?? 0);
      return { ...h, currentPrice: live, currentValue, pnl, pnlPercent, change24h };
    });
    const total = rows.reduce((acc, h) => acc + Number(h.currentValue || 0), 0) || 1;
    return rows.map((h) => {
      const weight = (Number(h.currentValue || 0) / total) * 100;
      return { ...h, weight };
    });
  }, [holdings, livePriceMap, tickerMap]);

  const tableRows = useMemo(() => {
    const rows = [...liveRows];
    const filtered = rows.filter((r) => {
      const hit = r.symbol.toLowerCase().includes(search.toLowerCase());
      const keepBySize = !hideSmall || Number(r.currentValue || 0) >= 10;
      return hit && keepBySize;
    });
    filtered.sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return filtered;
  }, [liveRows, search, hideSmall, sortKey, sortDir]);

  const quickWatchCoins = useMemo(() => {
    const seed = [...watchlistCoins, ...liveRows.map((r) => r.symbol)];
    return Array.from(new Set(seed)).slice(0, 12);
  }, [watchlistCoins, liveRows]);

  const liveCurrentValue = liveRows.reduce((acc, h) => acc + Number(h.currentValue || 0), 0);
  const unrealized = liveCurrentValue - invested;
  const unrealizedPct = invested > 0 ? (unrealized / invested) * 100 : 0;
  const totalReturnPct = invested > 0 ? ((unrealized + realized) / invested) * 100 : 0;

  const performanceMetrics = useMemo(() => {
    const tradeList = sortedTrades;
    const sideOf = (t) => String(t?.type || '').toUpperCase();
    const pnlOf = (t) => Number(t?.profitLoss ?? t?.pnl ?? t?.realizedPnl ?? 0);
    const timeOf = (t) => t?.createdAt || t?.timestamp || t?.date || t?.updatedAt || null;

    const sellTrades = tradeList.filter((t) => sideOf(t) === 'SELL');
    const sellPnls = sellTrades.map((t) => pnlOf(t));
    const winning = sellPnls.filter((p) => p > 0).length;
    const totalScored = sellPnls.length;
    const winRate = totalScored > 0 ? (winning / totalScored) * 100 : 0;
    const bestTrade = sellTrades.reduce((best, t) => {
      const pnl = pnlOf(t);
      if (!best || pnl > best.pnl) return { symbol: t.symbol, pnl, date: timeOf(t) };
      return best;
    }, null);
    const worstTrade = sellTrades.reduce((worst, t) => {
      const pnl = pnlOf(t);
      if (!worst || pnl < worst.pnl) return { symbol: t.symbol, pnl, date: timeOf(t) };
      return worst;
    }, null);
    const bySymbolCount = new Map();
    tradeList.forEach((t) => bySymbolCount.set(t.symbol, (bySymbolCount.get(t.symbol) || 0) + 1));
    const mostTraded = Array.from(bySymbolCount.entries()).sort((a, b) => b[1] - a[1])[0];
    const symbolBuyQueues = new Map();
    const holdDurationsMs = [];
    [...tradeList].sort((a, b) => new Date(timeOf(a) || 0) - new Date(timeOf(b) || 0)).forEach((t) => {
      const symbol = t.symbol;
      const ts = new Date(timeOf(t) || 0).getTime();
      if (!symbolBuyQueues.has(symbol)) symbolBuyQueues.set(symbol, []);
      if (sideOf(t) === 'BUY') symbolBuyQueues.get(symbol).push(ts);
      else if (sideOf(t) === 'SELL') {
        const q = symbolBuyQueues.get(symbol);
        if (q.length) {
          const buyTs = q.shift();
          if (ts > buyTs) holdDurationsMs.push(ts - buyTs);
        }
      }
    });
    const avgHoldMs = holdDurationsMs.length ? holdDurationsMs.reduce((a, b) => a + b, 0) / holdDurationsMs.length : 0;
    const avgHoldHours = avgHoldMs / (1000 * 60 * 60);
    const largestPosition = [...liveRows].sort((a, b) => Number(b.weight || 0) - Number(a.weight || 0))[0];
    const totalFeesPaid = tradeList.reduce((acc, t) => acc + Number(t.fee ?? t.fees ?? (Number(t.total || 0) * 0.001)), 0);
    const mean = sellPnls.length ? sellPnls.reduce((a, b) => a + b, 0) / sellPnls.length : 0;
    const variance = sellPnls.length ? sellPnls.reduce((acc, v) => acc + ((v - mean) ** 2), 0) / sellPnls.length : 0;
    const volatility = Math.sqrt(variance);
    const sharpeStyle = volatility > 0 ? mean / volatility : 0;
    return { winRate, bestTrade, worstTrade, avgHoldHours, mostTraded, largestPosition, totalFeesPaid, sharpeStyle };
  }, [sortedTrades, liveRows]);

  const cards = [
    { title: 'Total Invested', value: `₹${fmt(invested, 2)}`, sub: `Entry: ${new Date().toLocaleDateString()}` },
    { title: 'Current Value', value: `₹${fmt(liveCurrentValue, 2)}`, sub: connectionStatus === 'connected' ? 'Live price feed ●' : 'Fallback price feed ●' },
    { title: 'Unrealized PnL', value: `${unrealized >= 0 ? '+' : '-'}₹${fmt(Math.abs(unrealized), 2)}`, sub: `${unrealizedPct >= 0 ? '+' : ''}${unrealizedPct.toFixed(2)}%`, tone: unrealized >= 0 ? 'text-accent' : 'text-danger' },
    { title: 'Realized PnL', value: `${realized >= 0 ? '+' : '-'}₹${fmt(Math.abs(realized), 2)}`, sub: 'From closed trades', tone: realized >= 0 ? 'text-accent' : 'text-danger' },
    { title: 'Total Portfolio Return %', value: `${totalReturnPct >= 0 ? '+' : ''}${totalReturnPct.toFixed(2)}%`, sub: 'All-time return', tone: totalReturnPct >= 0 ? 'text-accent' : 'text-danger' },
    { title: 'Available Balance', value: `₹${fmt(summary?.balance, 2)}`, sub: 'Click to deposit more', onClick: () => navigate('/market') },
  ];

  const allocationRows = useMemo(() => {
    const total = tableRows.reduce((acc, h) => acc + Number(h.currentValue || 0), 0);
    return tableRows.map((h, idx) => ({
      ...h,
      color: chartPalette[idx % chartPalette.length],
      allocPct: total > 0 ? (Number(h.currentValue || 0) / total) * 100 : 0,
    }));
  }, [tableRows]);

  const totalPortfolioValue = allocationRows.reduce((acc, h) => acc + Number(h.currentValue || 0), 0);

  const donutData = useMemo(() => ({
    labels: allocationRows.map((h) => h.symbol),
    datasets: [
      {
        data: allocationRows.map((h) => Number(h.currentValue || 0)),
        backgroundColor: allocationRows.map((h) => h.color),
        borderColor: '#060810',
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  }), [allocationRows]);

  const donutOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    animation: { animateRotate: true, duration: 1000 },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const value = Number(ctx.raw || 0);
            const pct = totalPortfolioValue > 0 ? (value / totalPortfolioValue) * 100 : 0;
            return `${ctx.label}: ₹${fmt(value, 2)} (${pct.toFixed(2)}%)`;
          },
        },
      },
    },
    onClick: (_event, elements) => {
      if (!elements?.length) return;
      const idx = elements[0].index;
      setHighlightedSymbol(allocationRows[idx]?.symbol || null);
    },
  }), [allocationRows, totalPortfolioValue]);

  const pnlSeries = useMemo(() => {
    const rangeMap = { '1D': 24, '1W': 7, '1M': 30, '3M': 90, ALL: 180 };
    const points = rangeMap[range] || 30;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const realizedNow = Number(realized || 0);
    const unrealizedNow = Number(unrealized || 0);
    const tradesList = Array.isArray(trades) ? trades : [];
    const tradeImpact = tradesList.reduce((acc, t) => acc + Number(t.profitLoss || 0), 0);

    return Array.from({ length: points }, (_, i) => {
      const age = points - i;
      const ts = now - age * (range === '1D' ? 60 * 60 * 1000 : dayMs);
      const wave = Math.sin(i * 0.35) * 0.08 + Math.cos(i * 0.21) * 0.04;
      const realizedVal = realizedNow * (i / Math.max(points - 1, 1)) + tradeImpact * 0.02 * wave;
      const unrealizedVal = unrealizedNow * (0.45 + i / Math.max(points - 1, 1) * 0.55) + unrealizedNow * wave * 0.25;
      const total = realizedVal + unrealizedVal;
      return {
        label: range === '1D'
          ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        date: new Date(ts).toLocaleString(),
        realized: Number(realizedVal.toFixed(2)),
        unrealized: Number(unrealizedVal.toFixed(2)),
        total: Number(total.toFixed(2)),
      };
    });
  }, [range, realized, unrealized, trades]);

  const positiveArea = pnlSeries.map((p) => (p.total >= 0 ? p.total : null));
  const negativeArea = pnlSeries.map((p) => (p.total < 0 ? p.total : null));
  const lineData = useMemo(() => ({
    labels: pnlSeries.map((p) => p.label),
    datasets: [
      {
        label: 'Total PnL (+)',
        data: positiveArea,
        borderColor: '#00d97e',
        backgroundColor: 'rgba(0, 217, 126, 0.18)',
        tension: 0.35,
        fill: true,
        pointRadius: 0,
      },
      {
        label: 'Total PnL (-)',
        data: negativeArea,
        borderColor: '#FF3B5C',
        backgroundColor: 'rgba(255, 59, 92, 0.16)',
        tension: 0.35,
        fill: true,
        pointRadius: 0,
      },
      ...(showRealized ? [{
        label: 'Realized',
        data: pnlSeries.map((p) => p.realized),
        borderColor: '#3B82F6',
        tension: 0.3,
        fill: false,
        pointRadius: 0,
        borderWidth: 2,
      }] : []),
      ...(showUnrealized ? [{
        label: 'Unrealized',
        data: pnlSeries.map((p) => p.unrealized),
        borderColor: '#F59E0B',
        tension: 0.3,
        fill: false,
        pointRadius: 0,
        borderWidth: 2,
      }] : []),
    ],
  }), [pnlSeries, positiveArea, negativeArea, showRealized, showUnrealized]);

  const lineOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { labels: { color: '#A7B3C2' } },
      tooltip: {
        callbacks: {
          title: (ctx) => pnlSeries[ctx[0]?.dataIndex || 0]?.date || '',
          label: (ctx) => `${ctx.dataset.label}: ₹${fmt(ctx.parsed.y, 2)}`,
        },
      },
    },
    scales: {
      x: { ticks: { color: '#7F8A9A' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: {
        ticks: { color: '#7F8A9A', callback: (value) => `₹${fmt(value, 0)}` },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
    },
  }), [pnlSeries]);

  const onSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const isLoading = isPortfolioLoading || isSummaryLoading;

  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  return (
    <>
    <div className="w-full max-w-[1650px] mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-[#E8EDF5]">Portfolio Terminal</h1>
          <p className="text-textMuted text-sm mt-1">Dark terminal portfolio analytics with live metrics</p>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-borderSubtle text-textSecondary hover:text-white hover:border-accent transition-colors text-xs"
        >
          <PanelRight size={14} />
          Orders / Watchlist
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="premium-card rounded-xl px-3 pt-2 pb-0">
          <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'holdings', label: 'Holdings' },
              { id: 'history', label: 'Trade History' },
              { id: 'analytics', label: 'Analytics' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-1 sm:px-2 py-2.5 text-xs sm:text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? 'text-white border-accent' : 'text-textMuted border-transparent'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {cards.map((c, i) => (
              <SummaryCard key={c.title} idx={i} title={c.title} value={c.value} sub={c.sub} tone={c.tone} onClick={c.onClick} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="premium-card rounded-xl p-3 sm:p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-textMuted mb-3">Asset Allocation</div>
              <div className="relative h-[280px] sm:h-[320px]">
                <Doughnut data={donutData} options={donutOptions} />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-[10px] sm:text-[11px] text-textMuted uppercase">Total Value</div>
                    <div className="text-lg sm:text-xl font-mono text-white">₹{fmt(totalPortfolioValue, 2)}</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allocationRows.map((h) => (
                  <button
                    key={`legend-${h.symbol}`}
                    onClick={() => setHighlightedSymbol(h.symbol)}
                    className={`text-left px-2 py-1.5 rounded border transition-colors ${highlightedSymbol === h.symbol ? 'border-accent bg-[#102016]' : 'border-borderSubtle bg-[#0c1320]'}`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: h.color }} />
                        {h.symbol}
                      </span>
                      <span className="text-textMuted">{h.allocPct.toFixed(2)}%</span>
                    </div>
                    <div className="text-[11px] font-mono text-textSecondary">₹{fmt(h.currentValue, 2)}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="premium-card rounded-xl p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs uppercase tracking-[0.16em] text-textMuted">PnL History</div>
                <div className="flex gap-1 flex-wrap">
                  {['1D', '1W', '1M', '3M', 'ALL'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setRange(tab)}
                      className={`px-2 py-1 text-[10px] rounded border ${range === tab ? 'border-accent text-accent' : 'border-borderSubtle text-textSecondary'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 mb-2 text-xs text-textSecondary">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={showRealized} onChange={(e) => setShowRealized(e.target.checked)} />
                  Realized
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={showUnrealized} onChange={(e) => setShowUnrealized(e.target.checked)} />
                  Unrealized
                </label>
              </div>
              <div className="h-[280px] sm:h-[320px]">
                <Line data={lineData} options={lineOptions} />
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'holdings' && (
        <>
          <div className="premium-card rounded-xl p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search holdings..."
            className="premium-input rounded-lg px-3 py-2 text-sm w-full sm:w-72"
          />
          <label className="text-xs text-textSecondary flex items-center gap-2">
            <input type="checkbox" checked={hideSmall} onChange={(e) => setHideSmall(e.target.checked)} />
            Hide small balances (&lt; ₹10)
          </label>
        </div>
        
        {/* Mobile Card View */}
        <div className="block lg:hidden">
          <div className="space-y-3">
            {tableRows.map((h) => (
              <div key={h.symbol} className="premium-card rounded-lg p-3 border border-borderSubtle">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 font-heading font-semibold">
                    <CoinLogo symbol={h.symbol} />
                    <div>
                      <div>{h.symbol.replace('INR', '').replace('USDT', '')}</div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#111a2a] border border-borderSubtle text-textSecondary">{h.symbol}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm text-white">₹{fmt(h.currentValue, 2)}</div>
                    <div className={`text-xs ${h.pnl >= 0 ? 'text-accent' : 'text-danger'}`}>
                      {h.pnl >= 0 ? '+' : '-'}₹{fmt(Math.abs(h.pnl), 2)}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-textMuted">Holdings:</span>
                    <span className="font-mono text-white ml-2">{Number(h.quantity || 0).toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="text-textMuted">Entry:</span>
                    <span className="font-mono text-white ml-2">₹{fmt(h.avgBuyPrice, 2)}</span>
                  </div>
                  <div>
                    <span className="text-textMuted">Live:</span>
                    <span className="font-mono text-white ml-2">₹{fmt(h.currentPrice, 2)}</span>
                  </div>
                  <div>
                    <span className="text-textMuted">PnL%:</span>
                    <span className="ml-2"><PercentageBadge val={h.pnlPercent || 0} /></span>
                  </div>
                </div>
                
                <div className="flex justify-end mt-3">
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/trade/${h.symbol}`); }} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-accent text-accent hover:bg-accent hover:text-[#060810] text-xs font-bold transition-all">
                    <Zap size={11} /> TRADE
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm min-w-[1400px]">
          <thead className="bg-[#0d1320] border-b border-borderSubtle">
            <tr className="text-textSecondary">
              <th className="p-4 text-left cursor-pointer" onClick={() => onSort('asset')}>Asset</th>
              <th className="p-4 text-right cursor-pointer" onClick={() => onSort('holdings')}>Holdings</th>
              <th className="p-4 text-right cursor-pointer" onClick={() => onSort('entry')}>Avg Entry Price</th>
              <th className="p-4 text-right cursor-pointer" onClick={() => onSort('live')}>Live Price</th>
              <th className="p-4 text-right cursor-pointer" onClick={() => onSort('value')}>Current Value</th>
              <th className="p-4 text-right cursor-pointer" onClick={() => onSort('pnl')}>PnL ₹</th>
              <th className="p-4 text-right cursor-pointer" onClick={() => onSort('pnlPct')}>PnL %</th>
              <th className="p-4 text-right cursor-pointer" onClick={() => onSort('change24h')}>24h Change %</th>
              <th className="p-4 text-right cursor-pointer" onClick={() => onSort('weight')}>Weight %</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderSubtle/70">
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td colSpan="10" className="p-4">
                  <div className="h-10 rounded shimmer" />
                </td>
              </tr>
            ))}
            {!isLoading && tableRows.map((h) => {
              const symbolTrades = tradesBySymbol.get(h.symbol) || [];
              const buyTrades = symbolTrades.filter((t) => t.type === 'BUY');
              const avgHistory = buyTrades.slice(0, 4).map((t) => `₹${fmt(t.price, 2)}`).join(' • ') || '—';
              const totals = symbolTrades.map((t) => Number(t.total || 0));
              const bestTrade = totals.length ? Math.max(...totals) : 0;
              const worstTrade = totals.length ? Math.min(...totals) : 0;
              return (
              <Fragment key={h.symbol}>
              <tr key={h.symbol} className={`hover:bg-[#111a2a] transition-colors cursor-pointer ${highlightedSymbol === h.symbol ? 'bg-[#102016]' : ''}`} onClick={() => setExpanded((e) => (e === h.symbol ? null : h.symbol))}>
                <td className="p-4">
                  <div className="flex items-center gap-3 font-heading font-semibold">
                    <CoinLogo symbol={h.symbol} />
                    <div>
                      <div>{h.symbol.replace('INR', '').replace('USDT', '')}</div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#111a2a] border border-borderSubtle text-textSecondary">{h.symbol}</span>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-right font-mono">{Number(h.quantity || 0).toFixed(6)}</td>
                <td className="p-4 text-right font-mono">₹{fmt(h.avgBuyPrice, 2)}</td>
                <td className="p-4 text-right font-mono">
                  <PriceFlash val={h.currentPrice}>
                    ₹{fmt(h.currentPrice, 2)}
                  </PriceFlash>
                </td>
                <td className="p-4 text-right font-mono">₹{fmt(h.currentValue, 2)}</td>
                <td className={`p-4 text-right font-mono ${h.pnl >= 0 ? 'text-accent' : 'text-danger'}`}>{h.pnl >= 0 ? '+' : '-'}₹{fmt(Math.abs(h.pnl), 2)}</td>
                <td className="p-4 text-right"><PercentageBadge val={h.pnlPercent || 0} /></td>
                <td className="p-4 text-right"><PercentageBadge val={h.change24h || 0} /></td>
                <td className="p-4 text-right">
                  <div className="inline-block w-28 h-2 rounded bg-[#101726] overflow-hidden align-middle mr-2">
                    <div className="h-full bg-accent" style={{ width: `${Math.min(100, Math.max(0, h.weight || 0))}%` }} />
                  </div>
                  <span className="font-mono text-xs">{(h.weight || 0).toFixed(2)}%</span>
                </td>
                <td className="p-4 text-center">
                  <div className="inline-flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/trade/${h.symbol}`); }} className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-accent text-accent hover:bg-accent hover:text-[#060810] text-[10px] font-bold transition-all">
                    <Zap size={11} /> TRADE
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/trade/${h.symbol}`); }} className="px-2 py-1 rounded-md border border-[#3B82F6] text-[#3B82F6] hover:bg-[#3B82F6] hover:text-[#060810] text-[10px] font-bold transition-all">ADD</button>
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/trade/${h.symbol}?side=SELL&pct=100`); }} className="px-2 py-1 rounded-md border border-danger text-danger hover:bg-danger hover:text-[#060810] text-[10px] font-bold transition-all">SELL ALL</button>
                  </div>
                </td>
              </tr>
              {expanded === h.symbol && (
                <tr className="bg-[#0d1320]">
                  <td colSpan="10" className="px-4 py-3 text-xs text-textSecondary font-mono">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div><span className="text-textMuted">Avg buy price history:</span> {avgHistory}</div>
                      <div><span className="text-textMuted">Trade count:</span> {symbolTrades.length}</div>
                      <div><span className="text-textMuted">Best trade:</span> ₹{fmt(bestTrade, 2)}</div>
                      <div><span className="text-textMuted">Worst trade:</span> ₹{fmt(worstTrade, 2)}</div>
                    </div>
                  </td>
                </tr>
              )}
              </Fragment>
              );
            })}
            {!isLoading && !tableRows.length && (
              <tr>
                <td colSpan="10" className="p-10 text-center text-textMuted">
                  <div className="flex items-center justify-center gap-2">
                    <PlusCircle size={16} />
                    No holdings match your filters.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Win Rate %"
          icon={Percent}
          accent="#00d97e"
          valueNode={<AnimatedNumber value={performanceMetrics.winRate} suffix="%" />}
          sub={`${sortedTrades.filter((t) => t.type === 'SELL').filter((t) => Number(t.profitLoss ?? t.pnl ?? 0) > 0).length} winning trades`}
        />
        <MetricCard
          title="Best Trade"
          icon={TrendingUp}
          accent="#22c55e"
          valueNode={
            performanceMetrics.bestTrade
              ? <>{performanceMetrics.bestTrade.symbol} +₹<AnimatedNumber value={Math.abs(performanceMetrics.bestTrade.pnl)} /></>
              : '—'
          }
          sub={performanceMetrics.bestTrade?.date ? new Date(performanceMetrics.bestTrade.date).toLocaleString() : 'No sell trades yet'}
        />
        <MetricCard
          title="Worst Trade"
          icon={TrendingDown}
          accent="#FF3B5C"
          valueNode={
            performanceMetrics.worstTrade
              ? <>{performanceMetrics.worstTrade.symbol} -₹<AnimatedNumber value={Math.abs(performanceMetrics.worstTrade.pnl)} /></>
              : '—'
          }
          sub={performanceMetrics.worstTrade?.date ? new Date(performanceMetrics.worstTrade.date).toLocaleString() : 'No sell trades yet'}
        />
        <MetricCard
          title="Avg Hold Time"
          icon={Clock3}
          accent="#3B82F6"
          valueNode={<><AnimatedNumber value={performanceMetrics.avgHoldHours} decimals={1} />h</>}
          sub="Average BUY to SELL duration"
        />
        <MetricCard
          title="Most Traded Coin"
          icon={Coins}
          accent="#A855F7"
          valueNode={performanceMetrics.mostTraded ? `${performanceMetrics.mostTraded[0]}` : '—'}
          sub={performanceMetrics.mostTraded ? `${performanceMetrics.mostTraded[1]} trades` : 'No trades yet'}
        />
        <MetricCard
          title="Largest Position"
          icon={Wallet}
          accent="#F59E0B"
          valueNode={performanceMetrics.largestPosition ? `${performanceMetrics.largestPosition.symbol}` : '—'}
          sub={performanceMetrics.largestPosition ? `${Number(performanceMetrics.largestPosition.weight || 0).toFixed(2)}% of portfolio` : 'No holdings'}
        />
        <MetricCard
          title="Total Fees Paid"
          icon={Activity}
          accent="#ef4444"
          valueNode={<><AnimatedNumber value={performanceMetrics.totalFeesPaid} prefix="₹" /></>}
          sub="Accumulated exchange fees"
        />
        <MetricCard
          title="Sharpe-style Score"
          icon={Gauge}
          accent="#14B8A6"
          valueNode={<AnimatedNumber value={performanceMetrics.sharpeStyle} decimals={2} />}
          sub="Mean realized PnL / PnL volatility"
        />
      </div>
        </>
      )}

      {activeTab === 'history' && (
        <div className="premium-card rounded-xl p-4">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg text-white">Trade History</h3>
            <button
              onClick={exportTradesCsv}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-accent text-accent hover:bg-accent hover:text-[#060810] text-xs font-bold transition-all"
            >
              <Download size={13} />
              Export CSV
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={tradeCoin}
              onChange={(e) => { setTradeCoin(e.target.value); setTradePage(1); }}
              className="premium-input rounded-md px-2 py-1.5 text-xs"
            >
              {tradeCoins.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={tradeSide}
              onChange={(e) => { setTradeSide(e.target.value); setTradePage(1); }}
              className="premium-input rounded-md px-2 py-1.5 text-xs"
            >
              <option value="ALL">ALL</option>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setTradePage(1); }}
              className="premium-input rounded-md px-2 py-1.5 text-xs"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setTradePage(1); }}
              className="premium-input rounded-md px-2 py-1.5 text-xs"
            />
            <button
              onClick={resetTradeFilters}
              className="px-2.5 py-1.5 rounded-md border border-borderSubtle text-textSecondary hover:text-white text-xs"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1250px]">
            <thead className="bg-[#0d1320] border-b border-borderSubtle">
              <tr className="text-textSecondary">
                <th className="p-3 text-left">Date/Time</th>
                <th className="p-3 text-left">Coin</th>
                <th className="p-3 text-left">Side</th>
                <th className="p-3 text-right">Quantity</th>
                <th className="p-3 text-right">Price</th>
                <th className="p-3 text-right">Total ₹</th>
                <th className="p-3 text-right">Fee</th>
                <th className="p-3 text-right">PnL</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderSubtle/70">
              {pagedTrades.map((t) => {
                const pnl = Number(t.profitLoss ?? t.pnl ?? 0);
                const fee = Number(t.fee ?? t.fees ?? (Number(t.total || 0) * 0.001));
                return (
                  <tr key={t._id || `${t.symbol}-${t.createdAt}-${t.type}`} className="hover:bg-[#111a2a] transition-colors">
                    <td className="p-3 text-xs font-mono text-textSecondary">{new Date(t.createdAt || t.date || Date.now()).toLocaleString()}</td>
                    <td className="p-3 font-semibold">{t.symbol}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${t.type === 'BUY' ? 'border-accent text-accent bg-accent/10' : 'border-danger text-danger bg-danger/10'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono">{Number(t.quantity || 0).toFixed(6)}</td>
                    <td className="p-3 text-right font-mono">₹{fmt(t.price, 2)}</td>
                    <td className="p-3 text-right font-mono">₹{fmt(t.total, 2)}</td>
                    <td className="p-3 text-right font-mono text-danger">₹{fmt(fee, 2)}</td>
                    <td className={`p-3 text-right font-mono ${t.type === 'SELL' ? (pnl >= 0 ? 'text-accent' : 'text-danger') : 'text-textMuted'}`}>
                      {t.type === 'SELL' ? `${pnl >= 0 ? '+' : '-'}₹${fmt(Math.abs(pnl), 2)}` : '—'}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded border border-borderSubtle text-[10px] text-textSecondary">
                        {t.status || 'COMPLETED'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!pagedTrades.length && (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-textMuted">No trades match current filters.</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-borderSubtle bg-[#0d1320]">
                <td colSpan="5" className="p-3 text-right text-xs uppercase tracking-wider text-textMuted font-semibold">Summary</td>
                <td className="p-3 text-right text-xs text-textSecondary">Trades: <span className="font-mono text-white">{tradeSummary.totalCount}</span></td>
                <td className="p-3 text-right text-xs text-textSecondary">Fees: <span className="font-mono text-danger">₹{fmt(tradeSummary.totalFees, 2)}</span></td>
                <td className={`p-3 text-right text-xs ${tradeSummary.totalRealized >= 0 ? 'text-accent' : 'text-danger'}`}>
                  Realized: <span className="font-mono">{tradeSummary.totalRealized >= 0 ? '+' : '-'}₹{fmt(Math.abs(tradeSummary.totalRealized), 2)}</span>
                </td>
                <td className="p-3" />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex items-center justify-between mt-3 text-xs text-textSecondary">
          <span>Page {safeTradePage} / {totalTradePages}</span>
          <div className="flex gap-1 items-center">
            <button
              onClick={() => setTradePage((p) => Math.max(1, p - 1))}
              disabled={safeTradePage <= 1}
              className="px-2 py-1 rounded border border-borderSubtle disabled:opacity-40"
            >
              Prev
            </button>
            {visiblePageButtons.map((p) => (
              <button
                key={p}
                onClick={() => setTradePage(p)}
                className={`px-2 py-1 rounded border text-[11px] ${p === safeTradePage ? 'border-accent text-accent' : 'border-borderSubtle text-textSecondary'}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setTradePage((p) => Math.min(totalTradePages, p + 1))}
              disabled={safeTradePage >= totalTradePages}
              className="px-2 py-1 rounded border border-borderSubtle disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      )}

      {activeTab === 'analytics' && (
        <div className="premium-card rounded-xl p-12 border border-dashed border-borderSubtle text-center">
          <Activity size={34} className="mx-auto text-textMuted mb-3" />
          <div className="font-heading text-xl text-white mb-2">Analytics Coming Soon</div>
          <div className="text-sm text-textMuted">Advanced portfolio analytics and strategy insights will appear here.</div>
        </div>
      )}
    </div>
    {sidebarOpen && (
      <button
        aria-label="Close sidebar overlay"
        onClick={() => setSidebarOpen(false)}
        className="fixed inset-0 bg-black/60 z-40 md:hidden"
      />
    )}
    <aside
      className={`fixed top-0 right-0 h-screen w-[320px] max-w-[92vw] z-50 border-l border-borderSubtle bg-[#0b111b] shadow-2xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="h-full flex flex-col">
        <div className="p-3 border-b border-borderSubtle flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.14em] text-textMuted">Portfolio Side Panel</div>
          <button onClick={() => setSidebarOpen(false)} className="p-1 rounded border border-borderSubtle text-textSecondary hover:text-white">
            <X size={14} />
          </button>
        </div>
        <div className="p-2 border-b border-borderSubtle flex gap-2">
          <button
            onClick={() => setSidebarTab('orders')}
            className={`flex-1 text-xs py-1.5 rounded border ${sidebarTab === 'orders' ? 'border-accent text-accent' : 'border-borderSubtle text-textSecondary'}`}
          >
            Open Orders
          </button>
          <button
            onClick={() => setSidebarTab('watchlist')}
            className={`flex-1 text-xs py-1.5 rounded border ${sidebarTab === 'watchlist' ? 'border-accent text-accent' : 'border-borderSubtle text-textSecondary'}`}
          >
            Watchlist
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {sidebarTab === 'orders' && (
            <div className="space-y-3">
              <div className="rounded-lg border border-borderSubtle overflow-hidden">
                <div className="grid grid-cols-7 gap-1 px-2 py-2 text-[10px] uppercase tracking-wide text-textMuted bg-[#101726]">
                  <span>Coin</span><span>Type</span><span>Side</span><span>Qty</span><span>Limit</span><span>Status</span><span>Cancel</span>
                </div>
                <div className="p-6 text-center">
                  <ListOrdered size={18} className="mx-auto text-textMuted mb-2" />
                  <div className="text-sm text-textSecondary mb-3">No open orders</div>
                  <button
                    onClick={() => { setSidebarOpen(false); navigate('/trade/BTCINR'); }}
                    className="px-3 py-1.5 rounded-md border border-accent text-accent text-xs hover:bg-accent hover:text-[#060810] transition-colors"
                  >
                    Go to Trade Page
                  </button>
                </div>
              </div>
            </div>
          )}
          {sidebarTab === 'watchlist' && (
            <div className="space-y-2">
              {isWatchlistLoading && (
                <div className="text-xs text-textMuted p-3">Loading watchlist...</div>
              )}
              {!isWatchlistLoading && !watchlistCoins.length && (
                <div className="rounded-lg border border-borderSubtle p-6 text-center">
                  <Star size={18} className="mx-auto text-textMuted mb-2" />
                  <div className="text-sm text-textSecondary mb-3">Add coins to watchlist</div>
                  <button
                    onClick={() => { setSidebarOpen(false); navigate('/watchlist'); }}
                    className="px-3 py-1.5 rounded-md border border-accent text-accent text-xs hover:bg-accent hover:text-[#060810] transition-colors"
                  >
                    Open Watchlist
                  </button>
                </div>
              )}
              {quickWatchCoins.map((sym) => {
                const live = prices[sym];
                const isInWatchlist = watchlistCoins.includes(sym);
                return (
                  <div key={sym} className="rounded-lg border border-borderSubtle bg-[#0f1624] p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <CoinLogo symbol={sym} />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate">{sym}</div>
                          <div className="text-[11px] text-textMuted font-mono">
                            ₹{fmt(live?.lastPrice || 0, 2)} {' '}
                            <span className={(Number(live?.change24h || 0) >= 0) ? 'text-accent' : 'text-danger'}>
                              {Number(live?.change24h || 0) >= 0 ? '+' : ''}{Number(live?.change24h || 0).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setSidebarOpen(false); navigate(`/trade/${sym}`); }}
                          className="px-2 py-1 rounded border border-accent text-accent text-[10px] font-bold hover:bg-accent hover:text-[#060810]"
                        >
                          TRADE
                        </button>
                        <button
                          onClick={() => (isInWatchlist ? removeWatchMut.mutate(sym) : addWatchMut.mutate(sym))}
                          className="px-2 py-1 rounded border border-borderSubtle text-textSecondary text-[10px] hover:text-white"
                        >
                          {isInWatchlist ? 'REMOVE' : 'ADD'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
    </>
  );
};

export default Portfolio;
