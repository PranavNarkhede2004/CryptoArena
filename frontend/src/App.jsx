import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import usePriceSocket from './hooks/usePriceSocket';
import useAuthStore from './store/authStore';

// Layouts and Pages
import Topbar from './components/layout/Topbar';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Market from './pages/Market';
import TradePage from './pages/TradePage';
import Portfolio from './pages/Portfolio';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
// New Pages
import Watchlist from './pages/Watchlist';
import Alerts from './pages/Alerts';
import Leaderboard from './pages/Leaderboard';

const PrivateRoute = ({ children }) => {
  const { user } = useAuthStore();
  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  usePriceSocket(); // Initialize socket connection globally

  const { user } = useAuthStore();

  return (
    <BrowserRouter>
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            fontFamily: 'var(--font-sans)',
            fontSize: '14px'
          },
          success: { iconTheme: { primary: 'var(--accent-green)', secondary: 'var(--bg-elevated)' } },
          error: { iconTheme: { primary: 'var(--accent-red)', secondary: 'var(--bg-elevated)' } }
        }}
      />
      
      {/* If logged in, show Pro Terminal Layout, else minimal layout */}
      {user ? (
        <div className="flex h-screen bg-[var(--bg-base)] text-[var(--text-primary)] overflow-hidden font-body selection:bg-accent selection:text-background">
          <Sidebar />
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <Topbar />
            <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-20">
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/market" element={<Market />} />
                <Route path="/trade/:symbol" element={<TradePage />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/watchlist" element={<Watchlist />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      )}
    </BrowserRouter>
  );
}

export default App;
