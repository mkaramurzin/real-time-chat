import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function Chat({ user }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on('getMessage', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off();
    };
  }, []);

  const sendMessage = () => {
    socket.emit('sendMessage', {
      senderId: user.id,
      text: message,
    });
    setMessages((prev) => [...prev, { senderId: user.id, text: message }]);
    setMessage('');
  };

  return (
    <div>
      <h2>Chat Room</h2>
      <div>
        {messages.map((msg, index) => (
          <p key={index}>
            <strong>{msg.senderId === user.id ? 'You' : 'Other'}:</strong> {msg.text}
          </p>
        ))}
      </div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write a message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default Chat;
