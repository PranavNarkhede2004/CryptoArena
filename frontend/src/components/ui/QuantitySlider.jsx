const QuantitySlider = ({ value, onChange }) => {
  const steps = [25, 50, 75, 100];
  
  return (
    <div className="w-full mt-4 mb-2 select-none relative">
      <div className="absolute left-0 right-0 top-[6px] h-[2px] bg-borderSubtle rounded-full" />
      <div className="absolute left-0 top-[6px] h-[2px] bg-accent rounded-full transition-all" style={{ width: `${value}%` }} />
      <input 
        type="range" 
        min="0" max="100" 
        value={value} 
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 bg-transparent rounded-lg appearance-none cursor-pointer z-10 relative"
        style={{
          background: 'transparent'
        }}
      />
      
      <div className="flex justify-between mt-2">
        {steps.map(step => (
          <button 
            key={step}
            type="button"
            onClick={(e) => { e.preventDefault(); onChange(step); }}
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors ${value >= step ? 'bg-accent text-bg-base font-bold' : 'bg-elevated text-textMuted hover:text-white border border-borderSubtle'}`}
          >
            {step}%
          </button>
        ))}
      </div>
    </div>
  );
};
export default QuantitySlider;
