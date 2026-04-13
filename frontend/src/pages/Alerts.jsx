import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';
import usePriceStore from '../store/priceStore';
import { Bell, Trash2, Crosshair, TrendingUp, TrendingDown } from 'lucide-react';
import CoinLogo from '../components/ui/CoinLogo';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Alerts = () => {
  const [symbol, setSymbol] = useState('BTC');
  const [condition, setCondition] = useState('ABOVE');
  const [target, setTarget] = useState('');
  const queryClient = useQueryClient();
  const { prices } = usePriceStore();

  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => (await axios.get('/alerts')).data
  });

  const createMut = useMutation({
    mutationFn: async (payload) => axios.post('/alerts', payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
      toast.success('Alert active');
      setTarget('');
    }
  });

  const delMut = useMutation({
    mutationFn: async (id) => axios.delete(`/alerts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
      toast.success('Alert removed');
    }
  });

  const triggerMut = useMutation({
    mutationFn: async (id) => axios.patch(`/alerts/${id}/trigger`),
    onSuccess: () => queryClient.invalidateQueries(['alerts'])
  });

  // Client side checker
  useEffect(() => {
    if(!alerts) return;
    const active = alerts.filter(a => a.isActive);
    active.forEach(a => {
      const live = prices[a.symbol]?.lastPrice;
      if (!live) return;
      let triggered = false;
      if (a.condition === 'ABOVE' && live >= a.targetPrice) triggered = true;
      if (a.condition === 'BELOW' && live <= a.targetPrice) triggered = true;

      if(triggered) {
        toast(`[TRIGGERED] ${a.symbol} is ${a.condition} ₹${a.targetPrice.toLocaleString()}`, { icon: '🔔', duration: 8000 });
        if(Notification.permission === 'granted') new Notification(`CryptoArena Alert: ${a.symbol} Triggered!`);
        triggerMut.mutate(a._id);
      }
    });
  }, [prices, alerts, triggerMut]);

  useEffect(() => {
    if (Notification.permission === 'default') Notification.requestPermission();
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    const sym = symbol.toUpperCase() + 'INR';
    if (!prices[sym]) { toast.error('Symbol invalid'); return; }
    if (!target || isNaN(target)) { toast.error('Invalid target'); return; }
    createMut.mutate({ symbol: sym, condition, targetPrice: parseFloat(target) });
  };

  const activeAlerts = alerts?.filter(a => a.isActive) || [];
  const historyAlerts = alerts?.filter(a => !a.isActive) || [];

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-white tracking-tight flex items-center gap-3">
          <Bell className="text-purple fill-purple" size={28} /> Price Alerts
        </h1>
        <p className="text-textMuted text-sm mt-1">Get notified via browser toasts when a coin crosses your target.</p>
      </div>

      <div className="bg-surface border border-borderSubtle shadow-card rounded-xl overflow-hidden p-6">
        <h2 className="font-heading font-bold text-lg mb-4">Create Condition</h2>
        <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-1/4">
            <label className="text-xs uppercase font-mono text-textMuted mb-2 block">Asset Symbol</label>
            <input value={symbol} onChange={e=>setSymbol(e.target.value)} className="w-full bg-elevated border border-borderSubtle focus:border-purple rounded py-3 px-4 font-mono text-white outline-none uppercase" placeholder="Ext: BTC" />
          </div>
          <div className="w-full md:w-1/5">
             <label className="text-xs uppercase font-mono text-textMuted mb-2 block">Condition</label>
             <select value={condition} onChange={e=>setCondition(e.target.value)} className="w-full bg-elevated border border-borderSubtle focus:border-purple rounded py-3 px-4 font-mono text-white outline-none cursor-pointer">
               <option value="ABOVE">ABOVE &ge;</option>
               <option value="BELOW">BELOW &le;</option>
             </select>
          </div>
          <div className="w-full md:w-1/3">
             <label className="text-xs uppercase font-mono text-textMuted mb-2 block">Target Price (INR)</label>
             <input type="number" value={target} onChange={e=>setTarget(e.target.value)} className="w-full bg-elevated border border-borderSubtle focus:border-purple rounded py-3 px-4 font-mono text-white outline-none" placeholder="0.00" />
          </div>
          <button type="submit" disabled={createMut.isPending} className="w-full md:w-auto flex-1 bg-purple text-white font-bold uppercase tracking-widest py-3 px-6 rounded shadow-[0_0_15px_#8B5CF640] hover:bg-[#9f79f7] transition-all hover:scale-[0.98]">
             {createMut.isPending ? 'Setting...' : '+ Set Alert'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div>
            <h2 className="font-heading font-bold text-lg mb-4 text-white flex items-center gap-2"><Crosshair size={20} className="text-accent"/> Active Monitors</h2>
            <div className="space-y-3">
              <AnimatePresence>
                {activeAlerts.map(a => {
                  const live = prices[a.symbol]?.lastPrice || 0;
                  // progress calculation
                  const pct = a.condition==='ABOVE' ? Math.min(100, (live/a.targetPrice)*100) : (live<=a.targetPrice?100: Math.max(0, 100-((live-a.targetPrice)/a.targetPrice)*100));

                  return (
                  <motion.div layout initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} exit={{opacity:0, scale:0.95}} key={a._id} className="bg-surface border border-borderSubtle rounded-xl p-4 shadow-sm flex items-center gap-4">
                    <CoinLogo symbol={a.symbol} size={40} />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                         <span className="font-bold text-white font-heading">{a.symbol.replace('INR','')}</span>
                         <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${a.condition==='ABOVE'?'bg-accentDim text-accent':'bg-dangerDim text-danger'}`}>{a.condition} ₹{a.targetPrice.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 w-full bg-elevated rounded-full overflow-hidden mt-2 relative border border-[#1E2D3D]">
                        <div className="absolute top-0 left-0 h-full bg-purple transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                      </div>
                      <div className="flex justify-between mt-1 text-[10px] font-mono text-textMuted uppercase">
                        <span>Live: ₹{live.toLocaleString()}</span>
                        <span>{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <button onClick={() => delMut.mutate(a._id)} className="p-2 text-textMuted hover:text-danger hover:bg-elevated rounded-full transition-colors"><Trash2 size={16} /></button>
                  </motion.div>
                )})}
              </AnimatePresence>
              {!activeAlerts.length && <div className="text-sm font-mono text-textMuted p-6 border border-borderSubtle border-dashed rounded-xl text-center">No active alerts running.</div>}
            </div>
         </div>

         <div>
            <h2 className="font-heading font-bold text-lg mb-4 text-textMuted flex items-center gap-2">History Log</h2>
            <div className="space-y-3 opacity-70">
              {historyAlerts.map(a => (
                  <div key={a._id} className="bg-elevated border border-borderSubtle rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-borderSubtle flex items-center justify-center text-textMuted"><Bell size={14}/></div>
                      <div>
                        <div className="text-sm font-bold text-white"><span className="text-textMuted font-normal mr-1">Triggered</span> {a.symbol}</div>
                        <div className="text-[10px] font-mono text-textMuted">{new Date(a.triggeredAt).toLocaleString()} • {a.condition} ₹{a.targetPrice.toLocaleString()}</div>
                      </div>
                    </div>
                    <button onClick={() => delMut.mutate(a._id)} className="text-textMuted hover:text-danger"><Trash2 size={14} /></button>
                  </div>
              ))}
              {!historyAlerts.length && <div className="text-sm font-mono text-textMuted p-6 border border-borderSubtle border-dashed rounded-xl text-center">No alert history.</div>}
            </div>
         </div>
      </div>

    </div>
  );
};

export default Alerts;
