const LiveDot = ({ connected }) => {
  return (
    <div className="relative flex h-2 w-2">
      {connected ? (
        <>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
        </>
      ) : (
        <span className="relative inline-flex rounded-full h-2 w-2 bg-danger"></span>
      )}
    </div>
  );
};
export default LiveDot;
