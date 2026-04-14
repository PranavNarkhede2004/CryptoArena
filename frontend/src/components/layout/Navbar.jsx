import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '../api/axios';
import useAuthStore from '../../store/authStore';
import usePriceStore from '../../store/priceStore';
import { Activity, LayoutDashboard, Briefcase, TrendingUp, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout, updateBalance } = useAuthStore();
  const { connectionStatus } = usePriceStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch real-time user data to get updated balance
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
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

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const handleMobileLink = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="border-b border-border bg-surface px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between relative">
        <div className="flex items-center justify-between w-full">
          <Link to="/" className="text-lg sm:text-xl font-bold tracking-wider text-white flex items-center gap-2">
            <Activity className="text-accent" size={24} />
            <span className="hidden xs:block">CRYPTO<span className="text-accent">ARENA</span></span>
            <span className="xs:block">CA</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex gap-6">
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
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 text-xs font-mono uppercase ${connectionStatus === 'connected' ? 'text-accent' : 'text-danger'}`}>
                <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-accent' : 'bg-danger'} animate-pulse`} />
                <span className="hidden sm:inline">{connectionStatus}</span>
                <span className="sm:hidden">●</span>
              </div>
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="text-sm hidden lg:block">
                    <span className="text-textMuted text-xs">BALANCE</span>
                    <div className="font-mono text-accent text-sm">₹{(currentBalance / 1000).toFixed(1)}K</div>
                  </div>
                  <div className="text-sm lg:hidden">
                    <div className="font-mono text-accent text-sm">₹{(currentBalance / 1000).toFixed(1)}K</div>
                  </div>
                  <button onClick={handleLogout} className="text-textMuted hover:text-danger p-2 transition-colors">
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" className="text-sm font-semibold text-textPrimary hover:text-white transition-colors py-2 px-3">Login</Link>
                  <Link to="/register" className="text-sm font-semibold bg-accent text-background hover:bg-[#00e67a] transition-colors py-2 px-3 rounded">Sign Up</Link>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 text-xs font-mono uppercase ${connectionStatus === 'connected' ? 'text-accent' : 'text-danger'}`}>
                  <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-accent' : 'bg-danger'} animate-pulse`} />
                </div>
                <div className="text-sm">
                  <div className="font-mono text-accent text-sm">₹{(currentBalance / 1000).toFixed(1)}K</div>
                </div>
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-textMuted hover:text-white p-2 transition-colors"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-surface border-b border-border shadow-lg z-50">
            <div className="px-4 py-3 space-y-2">
              <Link 
                to="/dashboard" 
                onClick={handleMobileLink}
                className="flex items-center gap-3 text-textMuted hover:text-white py-2 transition-colors"
              >
                <LayoutDashboard size={18} /> Dashboard
              </Link>
              <Link 
                to="/market" 
                onClick={handleMobileLink}
                className="flex items-center gap-3 text-textMuted hover:text-white py-2 transition-colors"
              >
                <TrendingUp size={18} /> Market
              </Link>
              <Link 
                to="/portfolio" 
                onClick={handleMobileLink}
                className="flex items-center gap-3 text-textMuted hover:text-white py-2 transition-colors"
              >
                <Briefcase size={18} /> Portfolio
              </Link>
              
              {!user && (
                <div className="pt-2 border-t border-border flex gap-2">
                  <Link 
                    to="/login" 
                    onClick={handleMobileLink}
                    className="flex-1 text-sm font-semibold text-textPrimary hover:text-white transition-colors py-2 text-center"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    onClick={handleMobileLink}
                    className="flex-1 text-sm font-semibold bg-accent text-background hover:bg-[#00e67a] transition-colors py-2 text-center rounded"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
              
              {user && (
                <div className="pt-2 border-t border-border">
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 text-textMuted hover:text-danger py-2 transition-colors w-full"
                  >
                    <LogOut size={18} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
