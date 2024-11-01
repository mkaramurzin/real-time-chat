import React from 'react';
import axios from 'axios';
import './Notifications.css';

function Notifications({ invites, onAccept, onDecline }) {
  const handleAccept = async (roomId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/chatrooms/${roomId}/accept`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Fetch the room data after accepting
      const response = await axios.get(
        `http://localhost:5000/api/chatrooms/my-rooms`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      const acceptedRoom = response.data.find(room => room._id === roomId);
      onAccept(roomId, acceptedRoom);
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  if (!invites.length) return null;

  return (
    <div className="notifications">
      <h3>Pending Invites</h3>
      <div className="invites-list">
        {invites.map((invite) => (
          <div key={invite.roomId} className="invite-item">
            <div className="invite-info">
              <span className="inviter">{invite.inviter}</span>
              <span>invited you to join</span>
              <span className="room-name">{invite.roomName}</span>
            </div>
            <div className="invite-actions">
              <button 
                className="accept-btn"
                onClick={() => handleAccept(invite.roomId)}
              >
                Accept
              </button>
              <button 
                className="decline-btn"
                onClick={() => onDecline(invite.roomId)}
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Notifications; 