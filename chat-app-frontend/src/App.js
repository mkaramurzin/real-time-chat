import React, { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';

function App() {
  const [user, setUser] = useState(null);

  return (
    <div>
      {!user ? (
        <>
          <Login setUser={setUser} />
          <Register setUser={setUser} />
        </>
      ) : (
        <Chat user={user} />
      )}
    </div>
  );
}

export default App;
