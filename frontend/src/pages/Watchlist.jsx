import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import usePriceStore from '../store/priceStore';
import CoinLogo from '../components/ui/CoinLogo';
import PercentageBadge from '../components/ui/PercentageBadge';
import PriceFlash from '../components/ui/PriceFlash';
import MiniSparkline from '../components/ui/MiniSparkline';
import { Search, Star, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Watchlist = () => {
  const [search, setSearch] = useState('');
  const { prices } = usePriceStore();
  const queryClient = useQueryClient();

  const { data: watchlist, isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => (await axios.get('/watchlist')).data
  });

  const addMut = useMutation({
    mutationFn: async (symbol) => axios.post('/watchlist/add', { symbol }),
    onSuccess: () => {
      queryClient.invalidateQueries(['watchlist']);
      toast.success('Added to watchlist');
    }
  });

  const delMut = useMutation({
    mutationFn: async (symbol) => axios.delete(`/watchlist/${symbol}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['watchlist']);
      toast.success('Removed from watchlist');
    }
  });

  const coins = watchlist ? watchlist.coins : [];

  const handleAdd = (e) => {
    e.preventDefault();
    const sym = search.toUpperCase() + 'INR';
    if (!prices[sym]) {
      toast.error('Coin not found or unsupported');
      return;
    }
    if (coins.includes(sym)) {
      toast.error('Already in watchlist');
      return;
    }
    addMut.mutate(sym);
    setSearch('');
  };

  const buildSpark = (price, change, symbol) => {
    const seed = symbol.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const arr = [price];
    let curr = price / (1 + change / 100);
    for (let i = 0; i < 6; i += 1) {
      const drift = ((Math.sin(seed + i * 1.5) + 1) / 2 - 0.4) * 0.02;
      curr += curr * drift * (change > 0 ? 1 : -1);
      arr.push(curr);
    }
    return arr.reverse();
  };

  if (isLoading) return <div className="p-8 font-mono text-textMuted uppercase tracking-widest text-center">Loading Watchlist...</div>;

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white tracking-tight flex items-center gap-3">
            <Star className="text-warning fill-warning" size={28} /> Watchlist
          </h1>
          <p className="text-textMuted text-sm mt-1">Track your favorite assets in real-time</p>
        </div>
        
        <form onSubmit={handleAdd} className="relative w-full md:w-80 group">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-textMuted group-focus-within:text-accent transition-colors" />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Add coin... (e.g. BTC)" 
            className="w-full bg-surface border border-borderSubtle focus:border-accent rounded-full py-3 pl-10 pr-4 text-sm font-mono outline-none transition-colors uppercase"
          />
        </form>
      </div>

      {!coins.length ? (
        <div className="bg-surface border border-borderSubtle border-dashed shadow-sm rounded-xl p-16 flex flex-col items-center justify-center text-center">
           <div className="w-20 h-20 bg-elevated rounded-full flex items-center justify-center text-warning mb-6">
             <Star size={40} />
           </div>
           <h2 className="text-2xl font-heading font-bold text-white mb-2">Track Your Favorites</h2>
           <p className="text-textMuted text-sm max-w-sm mb-6">Pin top performing assets to your watchlist to monitor live prices, changes, and mini charts effortlessly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {coins.map(sym => {
              const live = prices[sym];
              if (!live) return null;
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={sym}
                  whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}
                  className="premium-card rounded-xl p-5 group relative"
                >
                  <button onClick={() => delMut.mutate(sym)} className="absolute top-4 right-4 text-textSecondary hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-elevated rounded-full border border-borderSubtle">
                    <Trash2 size={14} />
                  </button>

                  <div className="flex items-center gap-4 mb-6 pr-10">
                    <CoinLogo symbol={sym} size={48} />
                    <div>
                      <div className="font-heading font-bold text-xl text-white">{sym.replace('INR','')}</div>
                      <div className="text-xs font-mono text-textMuted">{sym}</div>
                    </div>
                  </div>

                  <div className="flex items-end justify-between mb-4">
                     <div>
                       <div className="text-xs uppercase font-mono text-textMuted mb-1">Live Price</div>
                       <PriceFlash val={live.lastPrice}>
                         <div className="text-2xl font-mono text-white tracking-tight">₹{live.lastPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                       </PriceFlash>
                     </div>
                     <div className="text-right">
                       <PercentageBadge val={live.change24h} />
                     </div>
                  </div>

                  <div className="h-[40px] flex items-end justify-between border-t border-borderSubtle pt-4 mt-2">
                     <MiniSparkline data={buildSpark(live.lastPrice, live.change24h, sym)} color={live.change24h >= 0 ? '#00D084' : '#FF3B5C'} />
                     <Link to={`/trade/${sym}`} className="text-xs font-bold uppercase tracking-wider text-accent hover:underline flex items-center gap-1 group-hover:bg-accentDim p-1 px-2 rounded transition-colors">
                       Trade <ArrowRight size={14} />
                     </Link>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Watchlist;
