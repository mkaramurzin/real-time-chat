import React from 'react';
import './OnlineStatus.css';

function OnlineStatus({ isOnline }) {
    return (
        <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? 'online' : 'offline'}
        </span>
    );
}

export default OnlineStatus; 