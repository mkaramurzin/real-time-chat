import React, { useState, useEffect } from 'react';
import ChatRoomList from './ChatRoomList';
import ChatRoom from './ChatRoom';
import InviteModal from './InviteModal';
import './Chat.css';
import axios from 'axios';
import { io } from 'socket.io-client';
import Notifications from './Notifications';

function Chat({ user }) {
    const [chatRooms, setChatRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [invites, setInvites] = useState([]);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io('http://localhost:5000');
        
        // Authenticate socket with user ID
        newSocket.emit('auth', user._id);

        // Listen for room invites
        newSocket.on('room-invite', (invite) => {
            setInvites(prev => [...prev, invite]);
        });

        setSocket(newSocket);

        return () => newSocket.close();
    }, [user._id]);

    const handleAcceptInvite = async (roomId, acceptedRoom) => {
        setInvites(prev => prev.filter(invite => invite.roomId !== roomId));
        await fetchChatRooms();
        
        // Select the accepted room
        if (acceptedRoom) {
            setSelectedRoom(acceptedRoom);
        }
    };

    const handleDeclineInvite = (roomId) => {
        setInvites(prev => prev.filter(invite => invite.roomId !== roomId));
    };

    useEffect(() => {
        fetchChatRooms();
    }, []);

    const fetchChatRooms = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                'http://localhost:5000/api/chatrooms/my-rooms',
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setChatRooms(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching chat rooms:', error);
            setLoading(false);
        }
    };

    return (
        <div className="chat-layout">
            <Notifications 
                invites={invites}
                onAccept={handleAcceptInvite}
                onDecline={handleDeclineInvite}
            />
            <div className="sidebar">
                <div className="sidebar-header">
                    <h2>Chat Rooms</h2>
                    <button 
                        className="create-room-btn"
                        onClick={() => setShowInviteModal(true)}
                    >
                        Create Room
                    </button>
                </div>
                <ChatRoomList 
                    rooms={chatRooms}
                    selectedRoom={selectedRoom}
                    onSelectRoom={setSelectedRoom}
                />
            </div>
            
            <div className="main-content">
                {selectedRoom ? (
                    <ChatRoom 
                        room={selectedRoom}
                        user={user}
                        onInvite={() => setShowInviteModal(true)}
                    />
                ) : (
                    <div className="no-room-selected">
                        <h3>Select a chat room to start messaging</h3>
                    </div>
                )}
            </div>

            {showInviteModal && (
                <InviteModal 
                    onClose={() => setShowInviteModal(false)}
                    onInviteSent={fetchChatRooms}
                />
            )}
        </div>
    );
}

export default Chat;
