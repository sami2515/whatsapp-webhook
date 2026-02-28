import React, { useState, useEffect, Component } from 'react';
import './App.css';
import ChatDashboard from './components/ChatDashboard';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#ffebee', color: '#c62828', fontFamily: 'monospace', height: '100vh', overflow: 'auto' }}>
          <h2>React Crash Report</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>Click to view error details (Please screenshot this!)</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const isLogged = localStorage.getItem('chat_dashboard_auth') === 'true';
    if (isLogged) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const correctPassword = import.meta.env.VITE_DASHBOARD_PASSWORD;
    if (passwordInput === correctPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('chat_dashboard_auth', 'true');
      setError('');
    } else {
      setError('Incorrect Password!');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <form className="login-form" onSubmit={handleLogin}>
          <h2>WhatsApp Admin</h2>
          <p>Please enter your password to access the dashboard.</p>
          <input
            type="password"
            placeholder="Enter Password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
          />
          {error && <p className="error-text">{error}</p>}
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="App">
      <ErrorBoundary>
        <ChatDashboard />
      </ErrorBoundary>
    </div>
  )
}

export default App;
