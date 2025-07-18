import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientPage from './pages/PatientPage';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  useGlobalStyles();

  return (
    <div style={styles.app}>
      <Routes>
        {/* Public route */}
        <Route path="/" element={<LoginPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/patient/:id" element={<PatientPage />} />
        </Route>
      </Routes>
    </div>
  );
};

// Inject global styles once
function useGlobalStyles() {
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      body {
        margin: 0;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f4f6f8;
        color: #333;
      }

      h1, h2, h3 {
        color: #2c3e50;
      }

      button {
        background-color: #3498db;
        color: white;
        border: none;
        padding: 10px 16px;
        margin: 5px;
        border-radius: 4px;
        cursor: pointer;
      }

      button:hover {
        background-color: #2980b9;
      }

      input, select {
        padding: 8px;
        margin: 5px 0;
        border-radius: 4px;
        border: 1px solid #ccc;
        width: 100%;
        box-sizing: border-box;
      }

      .container {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        margin-bottom: 20px;
      }

      .list-item {
        padding: 10px;
        border-bottom: 1px solid #eee;
      }

      .list-item:last-child {
        border-bottom: none;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
}

const styles: { [key: string]: React.CSSProperties } = {
  app: {
    maxWidth: '1200px',
    margin: 'auto',
    padding: '20px',
  },
};

export default App;