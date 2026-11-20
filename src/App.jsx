import React, { useState, useEffect } from 'react';
import './App.css';
import ChatDashboard from './components/ChatDashboard';
import SplashScreen from './components/SplashScreen';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // If no password is configured, default to authenticated
    const configuredPassword = import.meta.env.VITE_DASHBOARD_PASSWORD;
    if (!configuredPassword) return true;
    return sessionStorage.getItem('chat_dashboard_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const correctPassword = import.meta.env.VITE_DASHBOARD_PASSWORD;
    if (!correctPassword || passwordInput === correctPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('chat_dashboard_auth', 'true');
      setError('');
    } else {
      setError('Incorrect Password!');
    }
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <form className="login-form" onSubmit={handleLogin}>
          <h2>WhatsApp Live Chat</h2>
          <p>Please enter password to access dashboard</p>
          <input
            type="password"
            placeholder="Enter Password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
          />
          {error && <p className="error-text">{error}</p>}
          <button type="submit">Access Dashboard</button>
        </form>
      </div>
    );
  }

  return (
    <div className="App">
      <ChatDashboard />
    </div>
  );
}

export default App;
