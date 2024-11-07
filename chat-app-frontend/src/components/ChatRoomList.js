import React from 'react';
import OnlineStatus from './OnlineStatus';

function ChatRoomList({ rooms = [], selectedRoom, onSelectRoom, onlineUsers, user, onAcceptChat, onDeclineChat }) {
    // Early return if rooms is not available
    if (!rooms || !user) return null;

    // Get the other participant's info for each chat
    const getOtherParticipant = (room) => {
        if (!room.participants) return null;
        return room.participants.find(p => p._id !== user._id) || null;
    };

    return (
        <div className="chat-room-list">
            {rooms.map(room => {
                const otherUser = getOtherParticipant(room);
                if (!otherUser) return null;

                const isPending = room.status === 'pending' && room.initiator !== user._id;

                return (
                    <div
                        key={room._id}
                        className={`chat-room-item ${selectedRoom?._id === room._id ? 'active' : ''}`}
                    >
                        <div className="room-info" onClick={() => !isPending && onSelectRoom(room)}>
                            <span className="room-name">
                                {otherUser.username}
                                <OnlineStatus isOnline={onlineUsers.has(otherUser._id)} />
                            </span>
                            {isPending ? (
                                <div className="chat-actions">
                                    <button 
                                        className="accept-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAcceptChat(room._id);
                                        }}
                                    >
                                        Accept
                                    </button>
                                    <button 
                                        className="decline-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeclineChat(room._id);
                                        }}
                                    >
                                        Decline
                                    </button>
                                </div>
                            ) : (
                                room.lastMessage && (
                                    <span className="last-message">
                                        {room.lastMessage.content}
                                    </span>
                                )
                            )}
                        </div>
                    </div>
                );
            })}
            {rooms.length === 0 && (
                <div className="no-chats-message">
                    No conversations yet
                </div>
            )}
        </div>
    );
}

export default ChatRoomList; 