import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import axios from 'axios';
import './styles/Auth.css';

function App() {
  const [user, setUser] = useState(null);
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(true);

  // Check for stored token and validate it on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Configure axios defaults for all requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        const response = await axios.get('http://localhost:5000/api/auth/verify');
        if (response.data.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (user) {
    return <Chat user={user} setUser={setUser} />;
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h1>Chat App</h1>
          <div className="auth-tabs">
            <button 
              className={`tab-btn ${isLoginView ? 'active' : ''}`}
              onClick={() => setIsLoginView(true)}
            >
              Login
            </button>
            <button 
              className={`tab-btn ${!isLoginView ? 'active' : ''}`}
              onClick={() => setIsLoginView(false)}
            >
              Register
            </button>
          </div>
        </div>
        {isLoginView ? (
          <Login setUser={setUser} />
        ) : (
          <Register setUser={setUser} />
        )}
      </div>
    </div>
  );
}

export default App;
