import React from 'react';
import OnlineStatus from './OnlineStatus';

function ChatRoomList({ rooms, selectedRoom, onSelectRoom, onlineUsers }) {
    return (
        <div className="chat-room-list">
            {rooms.map(room => (
                <div
                    key={room._id}
                    className={`chat-room-item ${selectedRoom?._id === room._id ? 'active' : ''}`}
                    onClick={() => onSelectRoom(room)}
                >
                    <div className="room-info">
                        <span className="room-name">{room.name}</span>
                        <div className="room-members">
                            {room.members.map(member => (
                                <span key={member._id} className="member-name">
                                    {member.username}
                                    <OnlineStatus isOnline={onlineUsers.has(member._id)} />
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default ChatRoomList; 