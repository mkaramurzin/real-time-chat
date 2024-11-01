import React from 'react';

function UserInfo({ user, onLogout }) {
  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout();
  };

  return (
    <div className="user-info">
      <span className="username">{user.username}</span>
      <button onClick={handleLogout} className="logout-btn">
        Logout
      </button>
    </div>
  );
}

export default UserInfo; 