# CryptoArena ⚡️

[![Live Deployment](https://img.shields.io/badge/Live_Deployment-View_Site-00D084?style=for-the-badge&logo=vercel)](https://crypto-arena-black.vercel.app/)

A premium, full-stack cryptocurrency paper-trading platform designed to mirror real market dynamics without financial risk. Built with the MERN stack and real-time WebSocket integrations, CryptoArena empowers users to practice crypto trading using live data straight from Binance.


## Features
- **Real-Time Market Data**: Live crypto price feeds updating instantly via WebSocket connections to Binance.
- **Zero-Risk Trading**: Start with a virtual ₹10,00,000 balance and execute trades with zero fees.
- **Pro Trading Terminal**: A premium user interface featuring dynamic order books, lightweight charts, and real-time PnL analytics.
- **Leaderboards**: Compete globally with other paper-traders and track rankings dynamically.
- **Watchlists & Alerts**: Track your favorite assets and configure price alerts.
- **Institutional Styling**: A sleek, dark-themed UI matching professional terminal aesthetics natively powered by Tailwind CSS v4 and Framer Motion.

## Tech Stack
### Frontend
- **React (Vite)**
- **Tailwind CSS v4**
- **Zustand** (State Management)
- **Framer Motion** (Animations)
- **Chart.js** & **TradingView Lightweight Charts**

### Backend
- **Node.js** & **Express**
- **MongoDB** & **Mongoose**
- **Socket.io** (WebSockets for Real-Time data)
- **JSON Web Tokens** (Security & Auth)

## Quick Start
### Prerequisites
- Node.js v18+
- MongoDB instance (local or Atlas)

### Installation
1. Navigate into the directories and install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. Set up environment variables inside your `backend/.env` file:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_key
   ```

### Running the Application
1. Start the Backend API & WebSocket server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the Frontend Vite server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open `http://localhost:5173` in your web browser.

## Disclaimers
This platform is strictly for **educational and simulation purposes**. The virtual balances and prices shown do not reflect actual real-world capital or guarantee the outcomes of trades made on live exchanges.

## License
MIT License
