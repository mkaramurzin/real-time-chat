import React, { useState } from 'react';
import axios from 'axios';
import './Notifications.css';

function Notifications({ invites, onAccept, onDecline }) {
  const [acceptError, setAcceptError] = useState(null);
  const [retryCount, setRetryCount] = useState({});
  const MAX_RETRIES = 3;

  console.log('Current invites:', invites);

  const handleAccept = async (roomId) => {
    console.log('Starting accept process for room:', roomId);
    
    try {
        setAcceptError(null);
        const token = localStorage.getItem('token');
        
        if (!token) {
            console.error('No token found');
            setAcceptError('Authentication required');
            return;
        }

        console.log('Making accept request...');
        const response = await axios.post(
            `http://localhost:5000/api/chatrooms/${roomId}/accept`,
            {},
            {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Accept response:', response.data);

        if (response.data && response.data.room) {
            console.log('Updating UI with new room data');
            onAccept(roomId, response.data.room);
        } else {
            throw new Error('Invalid response format');
        }

    } catch (error) {
        console.error('Accept error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });

        setAcceptError(
            error.response?.data?.message || 
            error.message || 
            'Failed to accept invitation'
        );
    }
  };

  const handleAcceptWithRetry = async (roomId) => {
    const currentRetries = retryCount[roomId] || 0;
    
    if (currentRetries >= MAX_RETRIES) {
        setAcceptError(`Failed to accept invitation after ${MAX_RETRIES} attempts`);
        return;
    }

    try {
        await handleAccept(roomId);
    } catch (error) {
        console.error(`Attempt ${currentRetries + 1} failed:`, error);
        setRetryCount(prev => ({
            ...prev,
            [roomId]: currentRetries + 1
        }));
        
        // Retry after delay
        setTimeout(() => handleAcceptWithRetry(roomId), 1000);
    }
  };

  if (!invites.length) return null;

  return (
    <div className="notifications">
      <h3>Pending Invites</h3>
      {acceptError && (
        <div className="error-message">
          {acceptError}
          <button 
            onClick={() => {
              setAcceptError(null);
              setRetryCount({});
            }}
            className="retry-btn"
          >
            Retry
          </button>
        </div>
      )}
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
                onClick={() => handleAcceptWithRetry(invite.roomId)}
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