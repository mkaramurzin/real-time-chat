import React, { useState, useEffect } from 'react';
import ChatRoomList from './ChatRoomList';
import ChatRoom from './ChatRoom';
import InviteModal from './InviteModal';
import './Chat.css';
import axios from 'axios';
import { io } from 'socket.io-client';
import Notifications from './Notifications';
import UserInfo from './UserInfo';

function Chat({ user, setUser }) {
    const [chatRooms, setChatRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [invites, setInvites] = useState([]);
    const [socket, setSocket] = useState(null);

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
        
        console.log('Current user:', user);
        
        // Authenticate socket with user ID
        newSocket.emit('auth', user._id);

        // Listen for room invites
        newSocket.on('room-invite', (invite) => {
            console.log('Received invite:', invite);
            setInvites(prev => [...prev, invite]);
        });

        // Add listener for room updates
        newSocket.on('room-updated', (updatedRoom) => {
            handleRoomUpdate(updatedRoom);
        });

        // Add listener for when user leaves a room
        newSocket.on('room-left', (roomId) => {
            setChatRooms(prevRooms => prevRooms.filter(room => room._id !== roomId));
            if (selectedRoom?._id === roomId) {
                setSelectedRoom(null);
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.off('room-updated');
            newSocket.off('connect_error');
            newSocket.off('disconnect');
            newSocket.off('room-left');
            newSocket.close();
        };
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

    const handleRoomUpdate = (updatedRoom) => {
        setChatRooms(prevRooms => {
            return prevRooms.map(room => 
                room._id === updatedRoom._id ? updatedRoom : room
            );
        });
        
        // If this is the currently selected room, update it
        if (selectedRoom?._id === updatedRoom._id) {
            setSelectedRoom(updatedRoom);
        }
    };

    const handleLeaveRoom = (roomId) => {
        setChatRooms(prevRooms => prevRooms.filter(room => room._id !== roomId));
        setSelectedRoom(null);
    };

    return (
        <div className="chat-layout">
            <UserInfo user={user} onLogout={() => setUser(null)} />
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
                        onRoomUpdate={handleRoomUpdate}
                        onLeaveRoom={handleLeaveRoom}
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
