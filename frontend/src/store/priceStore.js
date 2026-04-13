import { create } from 'zustand';

const usePriceStore = create((set) => ({
  prices: {},
  connectionStatus: 'disconnected', // connecting, connected, disconnected
  lastUpdated: null,
  setPrices: (newPricesArray) => set((state) => {
    const newPricesMap = { ...state.prices };
    newPricesArray.forEach(p => {
      newPricesMap[p.symbol] = p;
    });
    return { prices: newPricesMap, lastUpdated: Date.now() };
  }),
  setStatus: (status) => set({ connectionStatus: status })
}));

export default usePriceStore;
