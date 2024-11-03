import React, { useState } from 'react';
import axios from 'axios';

function InviteModal({ onClose, onInviteSent }) {
  const [usernames, setUsernames] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [roomName, setRoomName] = useState('');
  const [error, setError] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const username = inputValue.trim();
      if (username && !usernames.includes(username)) {
        setUsernames([...usernames, username]);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && usernames.length > 0) {
      setUsernames(usernames.slice(0, -1));
    }
  };

  const removeUsername = (usernameToRemove) => {
    setUsernames(usernames.filter(username => username !== usernameToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (usernames.length === 0) {
      setError('Please enter at least one username');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/chatrooms/invite',
        { 
          usernames,
          roomName
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (onInviteSent) {
        onInviteSent();
      }
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Error sending invitations');
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Create Group Chat</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Room Name"
              required
            />
          </div>
          <div className="form-group">
            <div className="username-chips">
              {usernames.map((username) => (
                <span key={username} className="username-chip">
                  {username}
                  <button
                    type="button"
                    onClick={() => removeUsername(username)}
                    className="remove-username"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type usernames and press Enter"
            />
            <small className="help-text">
              Press Enter or comma after each username
            </small>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Create Room</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InviteModal; 