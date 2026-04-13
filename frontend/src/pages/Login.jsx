import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import useAuthStore from '../store/authStore';
import { Eye, EyeOff, Mail, Lock, Zap, CheckCircle2, TrendingUp, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showPwd, setShowPwd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Mock Live Stats for atmospheric panel
  const [stats, setStats] = useState({
    btc: { price: 72185.00, change: 1.64 },
    eth: { price: 300784.00, change: 3.88 },
    sol: { price: 1678.00, change: 0.11 }
  });

  const navigate = useNavigate();
  const setCredentials = useAuthStore(state => state.setCredentials);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        btc: { price: prev.btc.price + (Math.random() - 0.5) * 50, change: prev.btc.change + (Math.random() - 0.5) * 0.05 },
        eth: { price: prev.eth.price + (Math.random() - 0.5) * 200, change: prev.eth.change + (Math.random() - 0.5) * 0.05 },
        sol: { price: prev.sol.price + (Math.random() - 0.5) * 2, change: prev.sol.change + (Math.random() - 0.5) * 0.02 }
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await axios.post('/auth/login', { email, password });
      const { accessToken, refreshToken, _id, username, virtualBalance } = res.data;
      setCredentials({ userId: _id, username, email, virtualBalance }, accessToken, refreshToken);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#080b11] text-[#E8EDF5] selection:bg-accent selection:text-background font-body overflow-hidden w-full">
      
      {/* LEFT PANEL: Atmospheric Branding (Hidden on mobile) */}
      <div className="hidden md:flex md:w-[60%] relative flex-col justify-between p-12 bg-[#060810] overflow-hidden border-r border-[#151b23]">
        {/* Background Gradients & Patterns */}
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-[rgba(0,217,126,0.08)] blur-[120px] pointer-events-none" />
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none mix-blend-screen" 
          style={{
            backgroundImage: 'radial-gradient(circle at center, rgba(0,217,126,0.3) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />
        
        {/* Top Branding */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="relative z-10 flex items-center gap-2"
        >
          <div className="w-9 h-9 rounded-xl bg-accent text-background flex items-center justify-center shadow-[0_0_15px_rgba(0,208,132,0.4)]">
            <Zap size={20} className="fill-current" />
          </div>
          <span className="font-heading font-bold text-xl tracking-widest uppercase">CryptoArena</span>
        </motion.div>

        {/* Center Content */}
        <div className="relative z-10 max-w-xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-6xl font-heading font-bold leading-tight tracking-tight mb-4"
          >
            Welcome Back,<br />
            <span className="text-accent">Trader<span className="animate-cursor-blink inline-block w-4 h-1 bg-accent ml-1 align-baseline rounded-sm" /></span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-textSecondary mb-10"
          >
            Your positions are live. Markets don't wait.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-[#0b0e14]/80 backdrop-blur-md border border-borderSubtle rounded-2xl p-5 mb-10 shadow-2xl"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-textMuted uppercase tracking-wider mb-4">
              <TrendingUp size={14} className="text-accent" /> Live Market Preview
            </div>
            <div className="flex gap-4">
              <div className="bg-surface border border-borderSubtle rounded-lg px-4 py-2 flex-1">
                <div className="text-xs text-textSecondary mb-1 font-mono">BTC/INR</div>
                <div className="font-mono font-bold">₹{stats.btc.price.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} <span className="text-accent text-xs ml-1">▲{stats.btc.change.toFixed(2)}%</span></div>
              </div>
              <div className="bg-surface border border-borderSubtle rounded-lg px-4 py-2 flex-1">
                <div className="text-xs text-textSecondary mb-1 font-mono">ETH/INR</div>
                <div className="font-mono font-bold">₹{stats.eth.price.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} <span className="text-accent text-xs ml-1">▲{stats.eth.change.toFixed(2)}%</span></div>
              </div>
              <div className="bg-surface border border-borderSubtle rounded-lg px-4 py-2 flex-1">
                <div className="text-xs text-textSecondary mb-1 font-mono">SOL/INR</div>
                <div className="font-mono font-bold">₹{stats.sol.price.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} <span className="text-accent text-xs ml-1">▲{stats.sol.change.toFixed(2)}%</span></div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-3 text-textSecondary font-medium">
              <CheckCircle2 size={18} className="text-accent" /> Real Binance price feed
            </div>
            <div className="flex items-center gap-3 text-textSecondary font-medium">
              <CheckCircle2 size={18} className="text-accent" /> ₹10,00,000 virtual balance on signup
            </div>
            <div className="flex items-center gap-3 text-textSecondary font-medium">
              <CheckCircle2 size={18} className="text-accent" /> Zero risk — practice trading
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.5 }}
          className="relative z-10"
        >
          <Link to="/register" className="text-sm font-medium text-textSecondary hover:text-textPrimary transition-colors group">
            New here? <span className="text-accent group-hover:underline">Create free account →</span>
          </Link>
        </motion.div>
      </div>

      {/* RIGHT PANEL: Login Form Center Container */}
      <div className="w-full md:w-[40%] flex flex-col justify-center items-center p-6 lg:p-12 relative min-h-screen">
        
        {/* Mobile Branding (Visible only on mobile) */}
        <div className="md:hidden flex items-center justify-center gap-2 mb-8 mt-4">
          <div className="w-8 h-8 rounded-lg bg-accent text-background flex items-center justify-center shadow-[0_0_15px_rgba(0,208,132,0.4)]">
            <Zap size={18} className="fill-current" />
          </div>
          <span className="font-heading font-bold text-lg tracking-widest uppercase">CryptoArena</span>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 40 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          {/* Main Form Card */}
          <div className="bg-[#0b0e14] border border-borderSubtle bg-gradient-to-b from-[#0e121a] to-[#080b11] rounded-2xl p-8 shadow-2xl">
            <div className="mb-8 text-center">
              <div className="text-xs font-mono font-bold text-accent tracking-widest uppercase mb-2">Sign In</div>
              <h2 className="text-[28px] font-heading font-bold leading-tight">Access Terminal</h2>
              <p className="text-sm text-textMuted mt-1 font-medium">Enter your credentials to continue</p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="bg-danger/10 border border-danger/30 rounded-lg p-3 mb-6 flex items-start gap-3"
              >
                <XCircle size={18} className="text-danger mt-0.5 shrink-0" />
                <span className="text-sm text-danger font-medium leading-tight">{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail size={18} className="text-textMuted group-focus-within:text-accent transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full bg-[#060810] border border-borderSubtle text-textPrimary text-sm rounded-lg pl-10 pr-4 py-3.5 focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(0,217,126,0.15)] transition-all placeholder:text-textMuted"
                    required
                  />
                </div>
              </div>
              
              <div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock size={18} className="text-textMuted group-focus-within:text-accent transition-colors" />
                  </div>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full bg-[#060810] border border-borderSubtle text-textPrimary text-sm rounded-lg pl-10 pr-12 py-3.5 focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(0,217,126,0.15)] transition-all placeholder:text-textMuted"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-textMuted hover:text-textPrimary transition-colors"
                  >
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 pb-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" className="peer appearance-none w-4 h-4 border border-borderSubtle rounded bg-[#060810] checked:bg-accent checked:border-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 focus:ring-offset-1 focus:ring-offset-[#080b11]" />
                    <CheckCircle2 size={12} className="absolute text-background opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" strokeWidth={4} />
                  </div>
                  <span className="text-xs font-medium text-textMuted group-hover:text-textSecondary transition-colors">Remember this device</span>
                </label>

                <a href="#" className="text-xs font-medium text-textMuted hover:text-accent transition-colors">
                  Forgot password?
                </a>
              </div>

              <button 
                disabled={isSubmitting} 
                type="submit" 
                className="w-full bg-accent text-background font-bold text-sm tracking-widest uppercase py-3.5 rounded-lg hover:bg-[#00e67a] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_4px_14px_rgba(0,217,126,0.25)] flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> AUTHENTICATING</> : 'INITIALIZE SESSION →'}
              </button>
            </form>

          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm font-medium text-textMuted hover:text-textPrimary transition-colors">
              Back to landing page ←
            </Link>
          </div>
        </motion.div>
      </div>

    </div>
  );
};

export default Login;
