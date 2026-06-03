import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import useAuth from './hooks/useAuth.js';
import Toast from './components/ui/Toast.jsx';
import Spinner from './components/ui/Spinner.jsx';

// Pages
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CreateLink from './pages/CreateLink.jsx';
import Analytics from './pages/Analytics.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import SafeRedirect from './pages/SafeRedirect.jsx';
import Workspace from './pages/Workspace.jsx';

// ─── Protected Route ──────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" color="indigo" />
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Loading ClickSphere...</p>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

// ─── Public Only Route (redirect to dashboard if logged in) ───
const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Spinner size="lg" color="indigo" />
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" replace /> : children;
};

// ─── Expired page ─────────────────────────────────────────────
const ExpiredPage = () => (
  <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
    <div className="rounded-2xl p-10 max-w-sm w-full text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'var(--surface)' }}>
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#F59E0B" strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
        </svg>
      </div>
      <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Link Expired</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        This link has expired and is no longer active. Please contact the link creator for a new one.
      </p>
      <a
        href="/"
        className="inline-flex items-center justify-center gap-2 bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-600 transition-colors"
      >
        Go to ClickSphere
      </a>
    </div>
  </div>
);

// ─── 404 Not Found ────────────────────────────────────────────
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
    <div className="text-center max-w-sm">
      <p className="text-8xl font-black mb-2" style={{ color: 'var(--border)' }}>404</p>
      <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Page not found</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>The page you're looking for doesn't exist or has been moved.</p>
      <a
        href="/"
        className="inline-flex items-center justify-center gap-2 bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-600 transition-colors"
      >
        Back to Home
      </a>
    </div>
  </div>
);

// ─── App Routes ───────────────────────────────────────────────
const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/safe-redirect" element={<SafeRedirect />} />
        <Route path="/expired" element={<ExpiredPage />} />

        {/* Auth — redirect if already logged in */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <Signup />
            </PublicOnlyRoute>
          }
        />

        {/* Protected dashboard routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/links"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/create"
          element={
            <ProtectedRoute>
              <CreateLink />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/analytics/:urlId"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/workspace"
          element={
            <ProtectedRoute>
              <Workspace />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

// ─── Root App ─────────────────────────────────────────────────
const App = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <Toast />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
