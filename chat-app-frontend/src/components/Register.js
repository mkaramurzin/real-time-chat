import React, { useState } from 'react';
import axios from 'axios';

function Register({ setUser }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post('http://localhost:5000/api/auth/register', {
        username,
        email,
        password
      });
      alert('Registration successful. Please log in.');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during registration');
      console.error(err.response?.data?.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <input 
        placeholder="Username" 
        onChange={(e) => setUsername(e.target.value)} 
        value={username}
      />
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
      <button type="submit">Register</button>
    </form>
  );
}

export default Register;
