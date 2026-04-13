const CoinLogo = ({ symbol, size = 32 }) => {
  const base = symbol.replace('INR', '').toLowerCase();
  // using ErikThiart's cdn per requirements
  const url = `https://cdn.jsdelivr.net/gh/ErikThiart/cryptocurrency-icons/32/${base}.png`;

  return (
    <div 
      className="rounded-full bg-elevated border border-borderSubtle flex items-center justify-center shrink-0 overflow-hidden" 
      style={{ width: size, height: size }}
    >
      <img 
        src={url} 
        alt={base} 
        onError={(e) => {
          e.target.onerror = null; 
          e.target.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="%23243447"/><text x="16" y="21" font-family="sans-serif" font-size="12" font-weight="bold" fill="%23E8EDF5" text-anchor="middle">${base.charAt(0).toUpperCase()}</text></svg>`;
        }} 
      />
    </div>
  );
};
export default CoinLogo;
