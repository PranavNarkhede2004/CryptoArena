import { useEffect } from 'react';
import { io } from 'socket.io-client';
import usePriceStore from '../store/priceStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const usePriceSocket = () => {
  const { setPrices, setStatus } = usePriceStore();

  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      setStatus('connected');
    });

    socket.on('disconnect', () => {
      setStatus('disconnected');
    });

    socket.on('price_update', (data) => {
      setPrices(data);
    });

    return () => {
      socket.disconnect();
    };
  }, [setPrices, setStatus]);
};

export default usePriceSocket;
