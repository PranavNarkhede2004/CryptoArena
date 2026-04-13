import { useEffect, useRef, useState } from 'react';

const PriceFlash = ({ val, children, className = '' }) => {
  const [flash, setFlash] = useState(null);
  const prevVal = useRef(val);

  useEffect(() => {
    if (prevVal.current !== undefined && val !== prevVal.current) {
      if (val > prevVal.current) setFlash('flash-green');
      else if (val < prevVal.current) setFlash('flash-red');
      
      const timer = setTimeout(() => setFlash(null), 300);
      return () => clearTimeout(timer);
    }
    prevVal.current = val;
  }, [val]);

  return (
    <span className={`${className} ${flash ? flash : ''} rounded px-0.5 transition-colors`}>
      {children}
    </span>
  );
};

export default PriceFlash;
