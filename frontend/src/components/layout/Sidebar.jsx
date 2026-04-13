import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutGrid, BarChart2, Zap, PieChart, Star, Bell, Trophy, Settings, Activity } from 'lucide-react';

const Sidebar = () => {
  const [isHovered, setIsHovered] = useState(false);

  const menuItems = [
    { icon: LayoutGrid, label: 'Dashboard', path: '/dashboard' },
    { icon: BarChart2, label: 'Markets', path: '/market' },
    { icon: Zap, label: 'Trade', path: '/trade/BTCINR' },
    { icon: PieChart, label: 'Portfolio', path: '/portfolio' },
    { icon: Star, label: 'Watchlist', path: '/watchlist' },
    { icon: Bell, label: 'Alerts', path: '/alerts' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
  ];

  return (
    <aside
      className="h-full bg-surface border-r border-borderSubtle flex flex-col z-50 shrink-0"
      style={{ width: isHovered ? 220 : 72, transition: 'width 0.3s ease' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="h-14 flex items-center px-4 border-b border-borderSubtle overflow-hidden">
        <Activity className="text-accent shrink-0 drop-shadow-[0_0_10px_rgba(0,208,132,0.5)]" size={24} />
        <AnimatePresence>
          {isHovered && (
             <motion.span 
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -10 }}
               className="font-heading font-bold text-lg tracking-wider ml-3 whitespace-nowrap"
             >
               CRYPTO<span className="text-accent">ARENA</span>
             </motion.span>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 py-4 px-2 flex flex-col gap-1 overflow-x-hidden">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={item.label}
            className={({ isActive }) => 
              `flex items-center h-12 px-3 rounded-lg transition-all duration-200 relative group border-l-[3px] overflow-visible
              ${isActive ? 'text-accent bg-[linear-gradient(90deg,rgba(0,208,132,0.15),transparent)] border-l-accent shadow-[inset_0_0_0_1px_rgba(0,208,132,0.1)]' : 'text-[#8899AA] border-l-transparent hover:text-[#E8EDF5] hover:bg-[rgba(255,255,255,0.03)]'}`
            }
          >
            <item.icon size={20} className="shrink-0 text-inherit" />
            <AnimatePresence>
              {isHovered ? (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition:{ delay: 0.1 } }}
                  exit={{ opacity: 0, transition:{ duration: 0.1 } }}
                  className="font-sans font-medium ml-4 whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              ) : (
                /* Tooltip when collapsed */
                <div className="absolute left-[70px] bg-elevated text-white text-xs px-2 py-1 rounded shadow-card opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-borderSubtle">
        <button className="flex items-center text-textMuted hover:text-textPrimary transition-colors w-full h-10 px-1 truncate">
          <Settings size={20} className="shrink-0" />
          {isHovered && <span className="ml-4 font-sans font-medium">Settings</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
