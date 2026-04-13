import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const PercentageBadge = ({ val, className = '' }) => {
  const isPositive = val >= 0;
  
  return (
    <div className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md border font-mono text-xs font-bold ${isPositive ? 'bg-[#00D08426] text-accent border-[#00D08440]' : 'bg-[#FF3B5C22] text-danger border-[#FF3B5C55]'} ${className}`}>
      {isPositive ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
      {Math.abs(val).toFixed(2)}%
    </div>
  );
};

export default PercentageBadge;
