const MiniSparkline = ({ data, color, width = 100, height = 36, strokeWidth = 2 }) => {
  if (!data || data.length === 0) return <div style={{ width, height }} />;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const gradientId = `spark-${Math.abs((color || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0))}`;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        fill={`url(#${gradientId})`}
        points={`${points} ${width},${height} 0,${height}`}
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        className="opacity-80"
      />
    </svg>
  );
};
export default MiniSparkline;
