const OrderBadge = ({ type }) => {
  const isBuy = type === 'BUY';
  return (
    <div className={`inline-block px-2.5 py-1 rounded-md border font-mono text-[10px] uppercase font-bold tracking-wider ${isBuy ? 'bg-[#00D08426] border-[#00D084] text-accent' : 'bg-[#FF3B5C22] border-[#FF3B5C] text-danger'}`}>
      {type}
    </div>
  );
};
export default OrderBadge;
