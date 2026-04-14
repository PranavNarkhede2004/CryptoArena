import { useQuery } from '@tanstack/react-query';
import axios from '../api/axios';
import { Trophy, Medal, AlertCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useEffect } from 'react';

const Leaderboard = () => {
  const { user } = useAuthStore();

  const { data: leaders, isLoading, refetch } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => (await axios.get('/users/leaderboard')).data,
    refetchInterval: 10 * 60 * 1000, // 10 minutes in milliseconds
    refetchIntervalInBackground: true, // Continue refreshing when tab is not active
    staleTime: 9 * 60 * 1000, // Consider data stale after 9 minutes
  });

  // Manual refresh effect for additional control
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [refetch]);

  if (isLoading) return <div className="p-8 font-mono text-textMuted uppercase tracking-widest text-center">Fetching rankings...</div>;

  const top3 = leaders?.slice(0, 3) || [];
  const rest = leaders?.slice(3) || [];

  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-8">
      
      <div className="text-center py-6">
        <h1 className="text-4xl font-heading font-bold text-white tracking-tight flex items-center justify-center gap-3 mb-2">
          <Trophy className="text-warning fill-warning" size={32} /> Global Leaderboard
        </h1>
        <p className="text-textMuted text-sm">Top 50 traders by absolute portfolio value + PnL</p>
      </div>

      {/* Podium Section for top 3 */}
      {top3.length > 0 && (
        <div className="flex justify-center items-end gap-2 md:gap-6 h-[250px] mb-12 px-4 select-none">
          
          {/* 2nd Place */}
          {top3[1] && (
            <div className="flex flex-col items-center group">
              <div className="w-16 h-16 rounded-full bg-elevated border-2 border-[#C0C0C0] flex items-center justify-center font-bold text-white mb-3 shadow-[0_0_15px_#C0C0C040]">
                {top3[1].username.charAt(0).toUpperCase()}
              </div>
              <div className="font-heading font-bold text-white">{top3[1].username}</div>
              <div className="font-mono text-xs text-textMuted mb-2">₹{top3[1].currentValue.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
              <div className="w-24 h-28 bg-surface border-t-4 border-[#C0C0C0] rounded-t-lg flex justify-center pt-2 from-[#131922] to-transparent bg-gradient-to-b">
                <span className="font-heading font-bold text-xl text-[#C0C0C0]">2</span>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {top3[0] && (
            <div className="flex flex-col items-center group relative z-10">
              <Trophy size={28} className="text-warning fill-warning absolute -top-9" />
              <div className="w-20 h-20 rounded-full bg-elevated border-4 border-warning flex items-center justify-center font-bold text-xl text-white mb-3 shadow-[0_0_30px_#F59E0B60]">
                {top3[0].username.charAt(0).toUpperCase()}
              </div>
              <div className="font-heading font-bold text-lg text-white">{top3[0].username}</div>
              <div className="font-mono text-sm text-accent mb-2">₹{top3[0].currentValue.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
              <div className="w-28 h-36 bg-surface border-t-4 border-warning rounded-t-lg flex justify-center pt-2 from-[#1a1910] to-transparent bg-gradient-to-b">
                <span className="font-heading font-bold text-3xl text-warning">1</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div className="flex flex-col items-center group">
              <div className="w-14 h-14 rounded-full bg-elevated border-2 border-[#CD7F32] flex items-center justify-center font-bold text-white mb-3 shadow-[0_0_15px_#CD7F3240]">
                {top3[2].username.charAt(0).toUpperCase()}
              </div>
              <div className="font-heading font-bold text-white">{top3[2].username}</div>
              <div className="font-mono text-xs text-textMuted mb-2">₹{top3[2].currentValue.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
              <div className="w-24 h-20 bg-surface border-t-4 border-[#CD7F32] rounded-t-lg flex justify-center pt-2 from-[#181512] to-transparent bg-gradient-to-b">
                <span className="font-heading font-bold text-xl text-[#CD7F32]">3</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Table */}
      <div className="bg-surface border border-borderSubtle rounded-xl shadow-card overflow-hidden">
         <table className="w-full text-left font-sans text-sm border-collapse min-w-[800px]">
          <thead className="bg-[#10151c] border-b border-borderSubtle">
            <tr>
              <th className="p-4 text-textSecondary font-medium text-center w-16">Rank</th>
              <th className="p-4 text-textSecondary font-medium">Trader</th>
              <th className="p-4 text-textSecondary font-medium text-right">Portfolio Value</th>
              <th className="p-4 text-textSecondary font-medium text-right">Total PnL (₹)</th>
              <th className="p-4 text-textSecondary font-medium text-right">PnL (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderSubtle">
            {rest.map((trader, idx) => (
              <tr key={trader._id} className={`hover:bg-elevated transition-colors ${trader._id === user?.userId ? 'bg-[#151b23] border-l-2 border-l-accent' : ''}`}>
                <td className="p-4 text-center font-mono text-textMuted">#{idx + 4}</td>
                <td className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-overlay border border-borderBright flex items-center justify-center font-bold text-xs">
                    {trader.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="font-bold text-white tracking-wide">{trader.username} {trader._id === user?.userId && <span className="ml-2 text-[10px] bg-accent text-bg-base px-1.5 py-0.5 rounded font-mono uppercase">You</span>}</div>
                </td>
                <td className="p-4 text-right font-mono text-white">₹{trader.currentValue.toLocaleString(undefined, {maximumFractionDigits:0})}</td>
                <td className={`p-4 text-right font-mono ${trader.totalPnL >= 0 ? 'text-accent' : 'text-danger'}`}>
                  {trader.totalPnL >= 0 ? '+' : ''}₹{trader.totalPnL.toLocaleString(undefined, {maximumFractionDigits:0})}
                </td>
                <td className={`p-4 text-right font-mono ${trader.pnlPercent >= 0 ? 'text-accent' : 'text-danger'}`}>
                  {trader.pnlPercent >= 0 ? '+' : ''}{trader.pnlPercent.toLocaleString(undefined, {maximumFractionDigits:2})}%
                </td>
              </tr>
            ))}
            {!rest.length && top3.length===0 && (
              <tr><td colSpan="5" className="p-8 text-center text-textMuted">No ranking data available</td></tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Leaderboard;
