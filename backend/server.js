import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';

dotenv.config();

// Connect Database
connectDB();

const app = express();
const httpServer = createServer(app);

// Socket.io Setup
export const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

import { initPriceSocket } from './socket/priceSocket.js';
import { startPricePolling } from './services/coinDCXService.js';

initPriceSocket(io);

// Poll CoinDCX and broadcast
startPricePolling(io);

// Middleware
app.use(cors());
app.use(express.json());

import authRoutes from './routes/authRoutes.js';
import marketRoutes from './routes/marketRoutes.js';
import tradeRoutes from './routes/tradeRoutes.js';
import portfolioRoutes from './routes/portfolioRoutes.js';
import watchlistRoutes from './routes/watchlistRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import userRoutes from './routes/userRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('CryptoArena API is running...');
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
