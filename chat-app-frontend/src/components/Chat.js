import React, { useState, useEffect } from 'react';
import ChatRoomList from './ChatRoomList';
import ChatRoom from './ChatRoom';
import './Chat.css';
import axios from 'axios';
import { io } from 'socket.io-client';
import UserInfo from './UserInfo';
import OnlineStatus from './OnlineStatus';
import UserSearchModal from './UserSearchModal';

function Chat({ user, setUser }) {
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [showUserSearchModal, setShowUserSearchModal] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);

    useEffect(() => {
        const newSocket = io('http://localhost:5000', {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });
        
        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });
        
        // Authenticate socket with user ID
        newSocket.emit('auth', user._id);

        // Add listener for chat updates
        newSocket.on('chat-updated', (updatedChat) => {
            handleChatUpdate(updatedChat);
        });

        // Listen for user status updates
        newSocket.on('user_status', ({ userId, status }) => {
            setOnlineUsers(prev => {
                const updated = new Set(prev);
                if (status === 'online') {
                    updated.add(userId);
                } else {
                    updated.delete(userId);
                }
                return updated;
            });
        });

        // Add listeners for chat acceptance/declining
        newSocket.on('new-chat-request', (chat) => {
            setChats(prev => [...prev, chat]);
        });

        newSocket.on('chat-accepted', (updatedChat) => {
            handleChatUpdate(updatedChat);
        });

        newSocket.on('chat-declined', (chatId) => {
            setChats(prev => prev.filter(chat => chat._id !== chatId));
            if (selectedChat?._id === chatId) {
                setSelectedChat(null);
            }
        });

        newSocket.on('user-left-chat', (data) => {
            setChats(prev => prev.filter(chat => chat._id !== data.chatId));
            if (selectedChat?._id === data.chatId) {
                setSelectedChat(null);
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.off('chat-updated');
            newSocket.off('connect_error');
            newSocket.off('disconnect');
            newSocket.off('user_status');
            newSocket.off('new-chat-request');
            newSocket.off('chat-accepted');
            newSocket.off('chat-declined');
            newSocket.off('user-left-chat');
            newSocket.close();
        };
    }, [user._id]);

    useEffect(() => {
        fetchChats();
    }, []);

    const fetchChats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                'http://localhost:5000/api/chatrooms/my-chats',
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setChats(response.data);
        } catch (error) {
            console.error('Error fetching chats:', error);
        }
    };

    const handleChatUpdate = (updatedChat) => {
        setChats(prevChats => {
            return prevChats.map(chat => 
                chat._id === updatedChat._id ? updatedChat : chat
            );
        });
        
        // If this is the currently selected chat, update it
        if (selectedChat?._id === updatedChat._id) {
            setSelectedChat(updatedChat);
        }
    };

    const startNewChat = async (recipientId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:5000/api/chatrooms/dm',
                { recipientId },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setChats(prev => [...prev, response.data]);
            setSelectedChat(response.data);
        } catch (error) {
            console.error('Error starting new chat:', error);
        }
    };

    const handleSelectUser = async (selectedUser) => {
        await startNewChat(selectedUser._id);
        setShowUserSearchModal(false);
    };

    const handleAcceptChat = async (chatId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `http://localhost:5000/api/chatrooms/${chatId}/accept`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            handleChatUpdate(response.data);
            setSelectedChat(response.data);
        } catch (error) {
            console.error('Error accepting chat:', error);
        }
    };

    const handleDeclineChat = async (chatId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `http://localhost:5000/api/chatrooms/${chatId}/decline`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setChats(prev => prev.filter(chat => chat._id !== chatId));
            if (selectedChat?._id === chatId) {
                setSelectedChat(null);
            }
        } catch (error) {
            console.error('Error declining chat:', error);
        }
    };

    const handleLeaveChat = async (chatId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `http://localhost:5000/api/chatrooms/${chatId}/leave`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setChats(prev => prev.filter(chat => chat._id !== chatId));
            if (selectedChat?._id === chatId) {
                setSelectedChat(null);
            }
        } catch (error) {
            console.error('Error leaving chat:', error);
        }
    };

    const toggleSidebar = () => {
        setIsSidebarVisible(!isSidebarVisible);
    };

    return (
        <div className="chat-layout">
            <div className={`sidebar ${isSidebarVisible ? 'active' : ''}`}>
                <div className="sidebar-header">
                    <h2>Messages</h2>
                    <button 
                        className="new-message-btn"
                        onClick={() => setShowUserSearchModal(true)}
                    >
                        New Message
                    </button>
                </div>
                <ChatRoomList 
                    rooms={chats}
                    selectedRoom={selectedChat}
                    onSelectRoom={(room) => {
                        setSelectedChat(room);
                        setIsSidebarVisible(false); // Close sidebar after selection on mobile
                    }}
                    onlineUsers={onlineUsers}
                    user={user}
                    onAcceptChat={handleAcceptChat}
                    onDeclineChat={handleDeclineChat}
                />
            </div>
            <div className="main-content">
                <div className="user-info">
                    <button className="menu-toggle" onClick={toggleSidebar}>
                        ☰
                    </button>
                    <span className="username">{user.username}</span>
                    <button className="logout-btn" onClick={() => setUser(null)}>
                        Logout
                    </button>
                </div>
                {selectedChat ? (
                    <ChatRoom 
                        room={selectedChat}
                        user={user}
                        onRoomUpdate={handleChatUpdate}
                        onLeaveRoom={handleLeaveChat}
                    />
                ) : (
                    <div className="no-chat-selected">
                        <h3>Select a conversation to start messaging</h3>
                    </div>
                )}
            </div>
            {showUserSearchModal && (
                <UserSearchModal
                    onClose={() => setShowUserSearchModal(false)}
                    onSelectUser={handleSelectUser}
                    currentUser={user}
                />
            )}
        </div>
    );
}

export default Chat;
