import React from 'react';

function ChatRoomList({ rooms, selectedRoom, onSelectRoom }) {
  return (
    <div className="chat-room-list">
      {rooms.map(room => (
        <div
          key={room._id}
          className={`chat-room-item ${selectedRoom?._id === room._id ? 'active' : ''}`}
          onClick={() => onSelectRoom(room)}
        >
          <span className="room-name">{room.name}</span>
        </div>
      ))}
    </div>
  );
}

export default ChatRoomList; 