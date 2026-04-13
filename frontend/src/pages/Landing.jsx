import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  ArrowRight, ChartCandlestick, ShieldCheck, Wallet, 
  TrendingUp, TrendingDown, Activity, Trophy, Clock, CheckCircle2,
  ChevronRight, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

const Landing = () => {
  const [mockBtcPrice, setMockBtcPrice] = useState(72185.00);
  const [mockBtcChange, setMockBtcChange] = useState(2.45);

  useEffect(() => {
    const interval = setInterval(() => {
      setMockBtcPrice(prev => {
        const change = (Math.random() - 0.5) * 50;
        return +(prev + change).toFixed(2);
      });
      setMockBtcChange(prev => {
        const change = (Math.random() - 0.5) * 0.1;
        return +(prev + change).toFixed(2);
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const coins = [
    { name: 'BTC', price: '₹72,185', change: '+2.45%' },
    { name: 'ETH', price: '₹3,450', change: '+1.20%' },
    { name: 'SOL', price: '₹145.20', change: '-0.85%' },
    { name: 'BNB', price: '₹590.50', change: '+0.40%' },
    { name: 'XRP', price: '₹0.58', change: '-1.20%' },
    { name: 'ADA', price: '₹0.45', change: '+3.10%' },
    { name: 'DOGE', price: '₹0.15', change: '+5.60%' },
    { name: 'DOT', price: '₹7.20', change: '-0.30%' },
  ];

  const features = [
    { title: 'Live Price Feed', desc: 'Real-time WebSocket data matching Binance prices directly.', icon: <Activity className="text-accent mb-3" size={24} /> },
    { title: 'Portfolio Analytics', desc: 'Visualize your holdings, PnL, and performance over time.', icon: <Wallet className="text-accent mb-3" size={24} /> },
    { title: 'Advanced Charting', desc: 'Professional-grade candlestick charts powered by TradingView Lightweight Charts.', icon: <ChartCandlestick className="text-accent mb-3" size={24} /> },
    { title: 'Price Alerts', desc: 'Never miss a move. Set custom price alerts for your favorite assets.', icon: <Clock className="text-accent mb-3" size={24} /> },
    { title: 'Leaderboard Rankings', desc: 'Compete with others and prove your trading strategies.', icon: <Trophy className="text-accent mb-3" size={24} /> },
    { title: 'Secure Access', desc: 'Enterprise-grade JWT authentication and secure routing.', icon: <ShieldCheck className="text-accent mb-3" size={24} /> },
  ];

  return (
    <div className="min-h-screen bg-[#060810] text-[#E8EDF5] overflow-hidden selection:bg-accent selection:text-background font-body relative">
      
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

      {/* 1. NAVBAR */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-background font-bold shadow-[0_0_15px_rgba(0,208,132,0.4)]">C</div>
          <span className="font-heading font-bold text-xl tracking-wide">CRYPTOARENA</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-textSecondary">
          <a href="#features" className="hover:text-textPrimary transition-colors">Features</a>
          <a href="#markets" className="hover:text-textPrimary transition-colors">Markets</a>
          <a href="#leaderboard" className="hover:text-textPrimary transition-colors">Leaderboard</a>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link to="/login" className="text-textSecondary hover:text-textPrimary transition-colors">Sign In</Link>
          <Link to="/register" className="px-5 py-2.5 rounded-lg bg-accent text-background font-bold hover:bg-accent/90 transition-colors shadow-[0_0_15px_rgba(0,208,132,0.2)]">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-24 grid md:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-sm font-medium text-accent">
            <Sparkles size={14} /> Ultimate Paper Trading Platform
          </div>
          <h1 className="text-6xl lg:text-7xl font-heading font-bold leading-[1.1] tracking-tight">
            Trade Crypto.<br/>
            <span className="text-accent">Without Risk.</span>
          </h1>
          <p className="text-lg text-textSecondary max-w-md leading-relaxed">
            Experience real market dynamics with ₹10L virtual balance. Master your strategies before putting real capital on the line.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <Link to="/register" className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-3.5 rounded-xl bg-accent text-background font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(0,208,132,0.3)]">
              Start Trading Free <ArrowRight size={18} />
            </Link>
            <a href="#markets" className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-3.5 rounded-xl border border-borderDefault text-textPrimary font-semibold hover:border-accent hover:text-accent transition-all">
              View Live Markets
            </a>
          </div>
        </motion.div>

        {/* Hero Form / Mock Terminal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden md:block relative max-w-sm mx-auto w-full perspective-1000"
        >
          {/* Subtle decoration */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-accent/20 to-transparent blur-xl" />
          
          <div className="relative premium-card rounded-2xl p-6 bg-[#0D1117]/80 backdrop-blur-xl border border-borderSubtle shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-sm text-textSecondary font-medium">BTC/INR</div>
                <div className="text-3xl font-mono font-bold mt-1">₹{mockBtcPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className={`text-sm font-medium mt-1 flex items-center gap-1 ${mockBtcChange >= 0 ? 'text-accent' : 'text-danger'}`}>
                  {mockBtcChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {mockBtcChange > 0 ? '+' : ''}{mockBtcChange}%
                </div>
              </div>
              <div className="w-24 h-12 flex items-end justify-between gap-1 opacity-60">
                {[4, 7, 5, 8, 6, 9, 7].map((h, i) => (
                  <div key={i} className="w-full bg-accent rounded-t-sm transition-all duration-300" style={{ height: `${h * 10 + (Math.random() * 20 - 10)}%` }} />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <button className="py-3 rounded-lg bg-accent/10 border border-accent/20 text-accent font-bold hover:bg-accent hover:text-background transition-colors">BUY</button>
              <button className="py-3 rounded-lg bg-danger/10 border border-danger/20 text-danger font-bold hover:bg-danger hover:text-background transition-colors">SELL</button>
            </div>

            <div className="space-y-4">
              <div className="text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">Order Book</div>
              
              <div className="space-y-1">
                {[...Array(5)].map((_, i) => (
                  <div key={`ask-${i}`} className="flex justify-between text-xs font-mono">
                    <span className="text-danger">{(mockBtcPrice + (5 - i) * 2.5).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    <span className="text-textSecondary text-right w-16">{(0.15 + (5 - i) * 0.1).toFixed(3)}</span>
                  </div>
                ))}
              </div>
              <div className="h-px bg-borderSubtle my-2" />
              <div className="space-y-1">
                {[...Array(5)].map((_, i) => (
                  <div key={`bid-${i}`} className="flex justify-between text-xs font-mono">
                    <span className="text-accent">{(mockBtcPrice - (i + 1) * 2.5).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    <span className="text-textSecondary text-right w-16">{(0.15 + (i + 1) * 0.1).toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 3. LIVE TICKER STRIP */}
      <section className="border-y border-borderSubtle bg-[#0D1117] py-3 overflow-hidden flex whitespace-nowrap relative select-none">
        {/* Left/Right Fade out */}
        <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-[#0D1117] to-transparent z-10" />
        <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-[#0D1117] to-transparent z-10" />
        
        <div className="flex animate-marquee gap-12 pr-12">
          {[...coins, ...coins, ...coins, ...coins].map((coin, idx) => (
            <div key={idx} className="flex items-center gap-3 text-sm font-mono opacity-80 hover:opacity-100 transition-opacity">
              <span className="font-semibold text-textPrimary">{coin.name}</span>
              <span className="text-textSecondary">{coin.price}</span>
              <span className={`px-1.5 py-0.5 rounded text-xs ${coin.change.startsWith('+') ? 'bg-accent/10 text-accent' : 'bg-danger/10 text-danger'}`}>
                {coin.change}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. STATS BAR */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-borderSubtle"
        >
          <div className="flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4 transform rotate-3">
              <Wallet size={20} />
            </div>
            <div className="text-xl font-bold font-heading">₹10L+ Virtual Balance</div>
          </div>
          <div className="flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4 transform -rotate-3">
              <Activity size={20} />
            </div>
            <div className="text-xl font-bold font-heading">8 Live Coins</div>
          </div>
          <div className="flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4 transform rotate-3">
              <ChartCandlestick size={20} />
            </div>
            <div className="text-xl font-bold font-heading">Real Binance Exchange</div>
          </div>
          <div className="flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4 transform -rotate-3">
              <CheckCircle2 size={20} />
            </div>
            <div className="text-xl font-bold font-heading">0% Trading Fee Demo</div>
          </div>
        </motion.div>
      </section>

      {/* 5. FEATURES GRID */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-heading font-bold">Trading without limits</h2>
          <p className="text-textSecondary mt-4 max-w-2xl mx-auto text-lg">Our platform provides professional-grade tools in a fully simulated environment without financial risk.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group premium-card bg-[#0D1117] rounded-2xl p-8 hover:-translate-y-1 hover:border-t-accent hover:shadow-[0_8px_30px_rgba(0,208,132,0.1)] transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-[100px] -z-10 group-hover:bg-accent/15 group-hover:scale-110 transition-all duration-500" />
              {feature.icon}
              <h3 className="text-xl font-bold font-heading mb-3">{feature.title}</h3>
              <p className="text-textSecondary text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 6. HOW IT WORKS */}
      <section className="bg-[#0A0D14] py-24 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl md:text-5xl font-heading font-bold">Start Trading in 3 Steps</h2>
          </motion.div>

          <div className="relative flex flex-col md:flex-row justify-between items-center gap-16 md:gap-4">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-[2px] border-t-2 border-dashed border-borderBright -z-10 opacity-50" />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center bg-[#0A0D14] px-4"
            >
              <div className="w-20 h-20 rounded-full border-2 border-borderBright bg-surface flex items-center justify-center text-2xl font-bold text-textSecondary mb-6 relative">
                01
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-borderBright text-background flex items-center justify-center">
                  <ChevronRight size={16} className="ml-0.5" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 text-textPrimary">Create Account</h3>
              <p className="text-sm text-textSecondary max-w-[220px]">Sign up instantly. No KYC or real payments required.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center text-center bg-[#0A0D14] px-4"
            >
              <div className="w-20 h-20 rounded-full border-2 border-borderBright bg-surface flex items-center justify-center text-2xl font-bold text-textSecondary mb-6 relative">
                02
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-borderBright text-background flex items-center justify-center">
                  <Wallet size={14} />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 text-textPrimary">Get Demo Balance</h3>
              <p className="text-sm text-textSecondary max-w-[220px]">Receive ₹10L virtual INR automatically to your account.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center text-center bg-[#0A0D14] px-4"
            >
              <div className="w-20 h-20 rounded-full border-2 border-accent bg-accent/5 flex items-center justify-center text-2xl font-bold text-accent mb-6 relative shadow-[0_0_20px_rgba(0,208,132,0.15)]">
                03
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-accent text-background flex items-center justify-center shadow-[0_0_15px_rgba(0,208,132,0.4)]">
                  <Activity size={14} />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 text-textPrimary">Trade Risk-Free</h3>
              <p className="text-sm text-textSecondary max-w-[220px]">Execute paper trades using live, real-time market data.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 7. LEADERBOARD PREVIEW */}
      <section id="leaderboard" className="max-w-7xl mx-auto px-6 py-24 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-info/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col items-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full max-w-2xl premium-card bg-[#0D1117] rounded-3xl p-8 border border-borderSubtle shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-heading font-bold flex items-center gap-2">
                <Trophy className="text-accent" size={24} /> Top Traders This Week
              </h2>
              <Link to="/leaderboard" className="text-sm font-medium text-accent hover:text-accent/80 transition-colors flex items-center gap-1 bg-accent/10 px-3 py-1.5 rounded-lg">
                View Full <ArrowRight size={14} />
              </Link>
            </div>

            <div className="space-y-3">
              {[
                { rank: 1, user: 'CryptoKing', return: '+45.2%', val: '₹14,52,000' },
                { rank: 2, user: 'MoonWalker', return: '+38.5%', val: '₹13,85,000' },
                { rank: 3, user: 'DiamondHands', return: '+29.1%', val: '₹12,91,000' },
                { rank: 4, user: 'WhaleAlert', return: '+22.4%', val: '₹12,24,000' },
                { rank: 5, user: 'BullRider', return: '+18.8%', val: '₹11,88,000' },
              ].map((row, i) => (
                <div key={i} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${i === 0 ? 'bg-accent/5 border-accent/20' : 'bg-surface border-borderSubtle hover:border-borderDefault'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-accent/20 text-accent ring-1 ring-accent/50' : 'bg-elevated text-textSecondary'}`}>
                      {row.rank}
                    </div>
                    <span className="font-semibold text-textPrimary">{row.user}</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm md:text-base">
                    <span className="text-accent font-semibold">{row.return}</span>
                    <span className="font-mono text-textSecondary w-20 text-right hidden sm:block">{row.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="border-t border-borderSubtle bg-[#060810] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
            <div className="w-8 h-8 rounded-lg border border-textSecondary flex items-center justify-center text-textSecondary font-bold text-xs">C</div>
            <span className="font-heading font-bold text-lg tracking-wide text-textSecondary">CRYPTOARENA</span>
          </div>
          
          <div className="text-center md:text-left text-sm text-textMuted">
            © 2026 CryptoArena. For educational use only. Includes mock functionality.
          </div>
          
          <div className="flex items-center gap-6 text-sm text-textSecondary font-medium">
            <a href="#" className="hover:text-textPrimary transition-colors">Privacy</a>
            <a href="#" className="hover:text-textPrimary transition-colors">Terms</a>
            <a href="#" className="hover:text-textPrimary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
