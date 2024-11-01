import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

function ChatRoom({ room, user }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // Fetch messages when room changes or component mounts
    useEffect(() => {
        setMessages([]);
        setPage(1);
        setHasMore(true);
        setNewMessage('');
        fetchMessages(1);
    }, [room._id]);

    // Socket connection setup
    useEffect(() => {
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        newSocket.emit('join_room', room._id);

        newSocket.on('message', (message) => {
            setMessages(prev => [...prev, message]);
            scrollToBottom();
        });

        newSocket.on('message_sent', (message) => {
            setMessages(prev => [...prev, message]);
            scrollToBottom();
        });

        return () => {
            newSocket.off('message');
            newSocket.off('message_sent');
            newSocket.close();
        };
    }, [room._id]);

    const fetchMessages = async (pageNum) => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:5000/api/messages/${room._id}?page=${pageNum}&limit=50`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (pageNum === 1) {
                setMessages(response.data.messages);
            } else {
                setMessages(prev => [...response.data.messages, ...prev]);
            }

            setHasMore(response.data.hasMore);
            setPage(response.data.page);
        } catch (err) {
            setError('Failed to load messages');
            console.error('Error fetching messages:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            fetchMessages(page + 1);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleScroll = (e) => {
        const container = e.target;
        if (container.scrollTop === 0 && hasMore && !loading) {
            handleLoadMore();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const messageData = {
            content: newMessage,
            chatRoom: room._id,
            sender: user._id
        };

        try {
            socket.emit('message', messageData);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <div className="chat-room">
            <div className="chat-header">
                <div className="room-info">
                    <h3>{room.name}</h3>
                    <span className="member-count">
                        {room.members.length} member{room.members.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            <div 
                className="messages-container" 
                ref={messagesContainerRef}
                onScroll={handleScroll}
            >
                {loading && page === 1 && (
                    <div className="loading-messages">Loading messages...</div>
                )}
                
                {hasMore && (
                    <div className="load-more-messages">
                        {loading ? 'Loading more...' : 'Scroll up to load more'}
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        {error}
                        <button onClick={() => fetchMessages(page)}>Retry</button>
                    </div>
                )}

                {messages.map((message, index) => (
                    <div 
                        key={message._id || index}
                        className={`message ${message.sender._id === user._id ? 'own-message' : ''}`}
                    >
                        <span className="message-sender">{message.sender.username}</span>
                        <p className="message-content">{message.content}</p>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="message-input">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                />
                <button type="submit">
                    Send
                </button>
            </form>
        </div>
    );
}

export default ChatRoom;
