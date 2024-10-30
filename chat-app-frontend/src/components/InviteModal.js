import React, { useState } from 'react';
import axios from 'axios';

function InviteModal({ onClose, onInviteSent }) {
  const [username, setUsername] = useState('');
  const [roomName, setRoomName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/chatrooms/invite',
        { 
          username,
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
      setError(error.response?.data?.message || 'Error sending invitation');
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Invite User to Chat</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username to invite"
              required
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Room Name"
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Send Invite</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InviteModal; 