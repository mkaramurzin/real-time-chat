import React, { useState } from 'react';
import axios from 'axios';

function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during login');
      console.error(err.response?.data?.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <input 
        type="email"
        placeholder="Email" 
        onChange={(e) => setEmail(e.target.value)} 
        value={email}
      />
      <input 
        placeholder="Password" 
        type="password" 
        onChange={(e) => setPassword(e.target.value)} 
        value={password}
      />
      <button type="submit">Login</button>
    </form>
  );
}

export default Login;