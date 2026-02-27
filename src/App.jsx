import { useState, useEffect } from 'react'
import './App.css'
import ChatDashboard from './components/ChatDashboard'

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
      <ChatDashboard />
    </div>
  )
}

export default App
