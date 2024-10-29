import React, { useState } from 'react';
import axios from 'axios';

function Register({ setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/register', { username, password });
      alert('Registration successful. Please log in.');
    } catch (err) {
      console.error(err.response.data.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
      <input placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
      <input placeholder="Password" type="password" onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Register</button>
    </form>
  );
}

export default Register;
