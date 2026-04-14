import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import usePriceStore from '../../store/priceStore';
import { Search, LogOut, ChevronRight, Moon, Sun } from 'lucide-react';
import PriceFlash from '../ui/PriceFlash';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '../../api/axios';

const Topbar = () => {
  const { user, logout, updateBalance } = useAuthStore();
  const { connectionStatus, prices } = usePriceStore();
  const navigate = useNavigate();

  // Fetch real-time user data to get updated balance
  const { data: currentUser } = useQuery({
    queryKey: ['currentUserTopbar'],
    queryFn: async () => (await axios.get('/users/current')).data,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 25000, // Consider stale after 25 seconds
    onSuccess: (data) => {
      // Update the auth store with fresh balance
      if (data?.virtualBalance !== undefined) {
        updateBalance(data.virtualBalance);
      }
    }
  });

  // Use the real-time balance if available, otherwise fall back to stored user data
  const currentBalance = currentUser?.virtualBalance || user?.virtualBalance || 0;
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [showMenu, setShowMenu] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [search, setSearch] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const location = useLocation();
  const { data: tickersFallback = [] } = useQuery({
    queryKey: ['marketTickersTopbar'],
    queryFn: async () => (await axios.get('/market/tickers')).data,
    staleTime: 10000,
  });
  const { data: binanceTickers = [] } = useQuery({
    queryKey: ['binanceTickersTopbar'],
    queryFn: async () => {
      const res = await fetch('https://api.binance.com/api/v3/ticker/24hr');
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data
        .filter((t) => String(t.symbol || '').endsWith('USDT'))
        .map((t) => ({
          symbol: t.symbol,
          lastPrice: Number(t.lastPrice || 0),
          change24h: Number(t.priceChangePercent || 0),
          source: 'BINANCE',
        }));
    },
    staleTime: 60000,
  });

  useEffect(() => {
    const int = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(int);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('themeMode') || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved === 'light' ? 'light' : 'dark');
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('themeMode', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const topCoins = Object.values(prices).slice(0, 10);
  const mergedCoins = Object.values(prices).length ? Object.values(prices) : tickersFallback;
  const sourceList = binanceTickers.length ? binanceTickers : mergedCoins;
  const suggestions = sourceList
    .filter((c) => String(c?.symbol || '').toUpperCase().includes(search.toUpperCase()))
    .slice(0, 6);
  const pathName = location.pathname.split('/')[1] || 'dashboard';

  return (
    <header className="h-[58px] border-b border-borderSubtle backdrop-blur-xl flex items-center justify-between px-4 shrink-0 relative z-40" style={{ background: 'var(--topbar-bg)' }}>
      
      {/* Left Axis: Breadcrumb & Search */}
      <div className="flex items-center gap-6 w-1/4">
        <div className="flex items-center text-textMuted text-xs font-mono uppercase">
          Arena <ChevronRight size={14} className="mx-1" />
          <span className="text-textPrimary font-bold">{pathName}</span>
        </div>
        
        <div className="hidden md:block relative">
          <div className="flex items-center bg-elevated border border-borderDefault hover:border-borderBright focus-within:border-accent px-3 py-1.5 rounded text-xs text-textSecondary w-48 transition-colors">
            <Search size={14} className="mr-2" />
            <input
              value={search}
              onFocus={() => setShowSearchDropdown(true)}
              onBlur={() => setTimeout(() => setShowSearchDropdown(false), 120)}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSearchDropdown(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && suggestions[0]?.symbol) {
                  navigate(`/trade/${suggestions[0].symbol}`);
                  setShowSearchDropdown(false);
                  setSearch('');
                }
              }}
              placeholder="Search..."
              className="bg-transparent outline-none flex-1 text-textPrimary"
            />
            <span className="ml-2 bg-overlay px-1.5 rounded text-[10px] text-textMuted">&nbsp;&nbsp;K</span>
          </div>
          {showSearchDropdown && search && (
            <div className="absolute top-10 left-0 w-72 premium-card rounded-lg p-2 z-50">
              {suggestions.length ? suggestions.map((coin) => (
                <button
                  key={coin.symbol}
                  onMouseDown={() => {
                    navigate(`/trade/${coin.symbol}`);
                    setShowSearchDropdown(false);
                    setSearch('');
                  }}
                  className="w-full text-left px-2 py-2 rounded hover:bg-elevated flex items-center justify-between"
                >
                  <span className="text-xs font-mono text-textPrimary">{coin.symbol}</span>
                  <span className={`text-[11px] ${Number(coin.change24h || 0) >= 0 ? 'text-accent' : 'text-danger'}`}>
                    {binanceTickers.length ? '$' : '₹'}{Number(coin.lastPrice || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </button>
              )) : (
                <div className="px-2 py-2 text-xs text-textMuted">No matching market symbols</div>
              )}
            </div>
          )}
        </div>
        <span className="hidden xl:block text-[10px] text-textMuted font-mono">{time}</span>
      </div>

      {/* Center Marquee */}
      <div className="hidden lg:flex flex-1 overflow-hidden relative h-full">
        <div className="flex items-center h-full animate-marquee whitespace-nowrap gap-3 text-xs font-mono absolute left-0">
          {[...topCoins, ...topCoins].map((coin, i) => (
             <div key={i} className="flex items-center gap-2">
               <span className="text-textMuted font-bold">{coin.symbol.replace('INR','')}</span>
               <PriceFlash val={coin.lastPrice} className="text-textPrimary">
                 ₹{coin.lastPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
               </PriceFlash>
               <span className={coin.change24h >= 0 ? 'text-accent' : 'text-danger'}>
                 {coin.change24h > 0 ? '▲' : '▼'} {Math.abs(coin.change24h).toFixed(2)}%
               </span>
               <span className="text-textMuted/70">|</span>
             </div>
          ))}
        </div>
        <style>{`
          @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-52%); } }
          .animate-marquee { animation: marquee 34s linear infinite; }
          .animate-marquee:hover { animation-play-state: paused; }
        `}</style>
      </div>

      {/* Right Axis: Status, Balance, Profile */}
      <div className="flex items-center justify-end gap-6 w-1/4">
        <button
          onClick={toggleTheme}
          className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-md border border-borderSubtle text-textSecondary hover:text-textPrimary"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-textMuted uppercase bg-elevated px-2 py-1 rounded border border-borderDefault">
          <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-accent animate-[pulse_1.6s_ease-in-out_infinite] shadow-glowGreen' : 'bg-danger'}`} />
          Realtime
        </div>
        
        <div className="hidden md:block text-right">
          <div className="text-[10px] text-textMuted uppercase font-heading font-medium tracking-[0.14em]">Available Balance</div>
          <div className="text-sm font-mono text-accent glow-green font-semibold">
            ₹{currentBalance.toLocaleString()}
          </div>
        </div>

        <div className="flex items-center gap-3 border-l border-borderSubtle pl-6 relative">
          <button onClick={() => setShowMenu((prev) => !prev)} className="w-8 h-8 rounded-full bg-[linear-gradient(135deg,#00D084,#3B82F6)] text-white flex items-center justify-center font-bold text-sm shadow-[0_0_16px_rgba(0,208,132,0.3)]">
            {user?.username?.charAt(0).toUpperCase()}
          </button>
          {showMenu && (
            <div className="absolute top-11 right-0 w-52 premium-card rounded-lg p-3">
              <div className="font-heading font-semibold text-sm">{user?.username}</div>
              <div className="text-xs text-textMuted mt-1 mb-3">{user?.email || 'user@cryptoarena.app'}</div>
              <button onClick={() => { logout(); window.location.href = '/login'; }} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-borderSubtle text-textSecondary hover:text-danger hover:border-danger/40 transition-all">
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
