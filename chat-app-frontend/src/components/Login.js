import React, { useState } from 'react';
import axios from 'axios';

function Login({ setUser }) {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                username: formData.username,
                password: formData.password
            });
            const { token, user } = response.data;
            
            // Store token in localStorage
            localStorage.setItem('token', token);
            
            // Update user state
            setUser(user);
        } catch (error) {
            setError(error.response?.data?.message || 'Login failed');
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="error-message">{error}</div>}
            <div className="form-group">
                <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Username"
                    required
                />
            </div>
            <div className="form-group">
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    required
                />
            </div>
            <button type="submit" className="auth-button">Login</button>
        </form>
    );
}

export default Login;