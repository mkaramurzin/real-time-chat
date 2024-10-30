import React, { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import './styles/Auth.css';

function App() {
  const [user, setUser] = useState(null);
  const [isLoginView, setIsLoginView] = useState(true);

  if (user) {
    return <Chat user={user} />;
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
