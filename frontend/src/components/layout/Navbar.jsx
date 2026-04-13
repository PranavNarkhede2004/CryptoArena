import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import usePriceStore from '../../store/priceStore';
import { Activity, LayoutDashboard, Briefcase, TrendingUp, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const { connectionStatus } = usePriceStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link to="/" className="text-xl font-bold tracking-wider text-white flex items-center gap-2">
          <Activity className="text-accent" />
          CRYPTO<span className="text-accent">ARENA</span>
        </Link>
        <div className="hidden md:flex gap-6">
          <Link to="/dashboard" className="text-textMuted hover:text-white flex items-center gap-2 transition-colors">
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link to="/market" className="text-textMuted hover:text-white flex items-center gap-2 transition-colors">
            <TrendingUp size={18} /> Market
          </Link>
          <Link to="/portfolio" className="text-textMuted hover:text-white flex items-center gap-2 transition-colors">
            <Briefcase size={18} /> Portfolio
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className={`flex items-center gap-2 text-xs font-mono uppercase ${connectionStatus === 'connected' ? 'text-accent' : 'text-danger'}`}>
          <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-accent' : 'bg-danger'} animate-pulse`} />
          {connectionStatus}
        </div>
        {user ? (
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-textMuted text-xs">BALANCE</span>
              <div className="font-mono text-accent">₹{user.virtualBalance?.toLocaleString()}</div>
            </div>
            <button onClick={handleLogout} className="text-textMuted hover:text-danger p-2 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <div className="flex gap-4">
            <Link to="/login" className="text-sm font-semibold text-textPrimary hover:text-white transition-colors py-2 px-4">Login</Link>
            <Link to="/register" className="text-sm font-semibold bg-accent text-background hover:bg-[#00e67a] transition-colors py-2 px-4 rounded">Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
