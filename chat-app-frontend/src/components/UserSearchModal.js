import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import debounce from 'lodash/debounce';

function UserSearchModal({ onClose, onSelectUser, currentUser }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const debouncedSearch = useCallback(
        debounce(async (term) => {
            if (!term || term.length < 2) {
                setUsers([]);
                return;
            }

            setLoading(true);
            setError(null);
            
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    `http://localhost:5000/api/users/search?term=${term}`,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                setUsers(response.data.filter(user => user._id !== currentUser._id));
            } catch (error) {
                setError('Error searching users. Please try again.');
                console.error('Error searching users:', error);
            } finally {
                setLoading(false);
            }
        }, 300),
        [currentUser._id]
    );

    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        debouncedSearch(e.target.value);
    };

    return (
        <div className="modal" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>New Message</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <input
                    type="text"
                    placeholder="Type a username to search..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="search-input"
                    autoFocus
                />
                <div className="user-list">
                    {loading && <div className="loading">Searching...</div>}
                    {error && <div className="error-message">{error}</div>}
                    {!loading && !error && users.length === 0 && searchTerm.length >= 2 && (
                        <div className="no-results">No users found</div>
                    )}
                    {users.map(user => (
                        <div
                            key={user._id}
                            className="user-item"
                            onClick={() => onSelectUser(user)}
                        >
                            <span className="username">{user.username}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default UserSearchModal; 