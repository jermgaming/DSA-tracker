import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import QuestionsPage from './pages/QuestionsPage';
import HistoryPage from './pages/HistoryPage';
import AdminPage from './pages/AdminPage';
import ProgressPage from './pages/ProgressPage';
import Layout from './components/shared/Layout';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = ({ theme, toggleTheme }) => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout theme={theme} toggleTheme={toggleTheme}>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/questions" element={
        <ProtectedRoute>
          <Layout theme={theme} toggleTheme={toggleTheme}>
            <QuestionsPage />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute>
          <Layout theme={theme} toggleTheme={toggleTheme}>
            <HistoryPage />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute adminOnly>
          <Layout theme={theme} toggleTheme={toggleTheme}>
            <AdminPage />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/progress" element={
        <ProtectedRoute>
          <Layout theme={theme} toggleTheme={toggleTheme}>
            <ProgressPage />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes theme={theme} toggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
