import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

function ChatRoom({ room, user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    
    // Join the room
    newSocket.emit('join room', room._id);

    // Listen for new messages
    newSocket.on('message', (message) => {
      setMessages(prevMessages => [...prevMessages, message]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave room', room._id);
      newSocket.close();
    };
  }, [room._id]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      const messageData = {
        content: newMessage,
        chatRoom: room._id,
        sender: {
          _id: user._id,
          username: user.username
        }
      };
      
      socket.emit('message', messageData);
      setMessages(prevMessages => [...prevMessages, messageData]);
      setNewMessage('');
    }
  };

  return (
    <div className="chat-room">
      <div className="chat-header">
        <div className="room-info">
          <h3>{room?.name}</h3>
          <span className="member-count">{room?.members?.length} members</span>
        </div>
      </div>
      <div className="messages-container">
        {messages.map((msg, index) => (
          <div 
            key={index}
            className={`message ${msg.sender._id === user._id ? 'own-message' : ''}`}
          >
            <span className="sender">{msg.sender.username}</span>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="message-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default ChatRoom;
