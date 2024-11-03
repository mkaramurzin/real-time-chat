import React, { useState } from 'react';
import axios from 'axios';

function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { 
        email, 
        password 
      });
      console.log('Login response:', res.data);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <input 
          className="form-input"
          type="email"
          placeholder="Email" 
          onChange={(e) => setEmail(e.target.value)} 
          value={email}
          required
        />
      </div>

      <div className="form-group">
        <input 
          className="form-input"
          type="password"
          placeholder="Password" 
          onChange={(e) => setPassword(e.target.value)} 
          value={password}
          required
        />
      </div>

      <button 
        className="submit-btn" 
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

export default Login;