import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import RoomDisplay from './components/roomDisplay';
import { SocketProvider } from './providers/Socketprovider';
// import SocketMessage from './components/SocketMessage';
import { auth } from './services/auth/firebaseAuthConfig';
import { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInAnonymously,
  UserCredential,
} from 'firebase/auth';
import TestGame from './components/TestGame';
import BlackjackTable from './components/blackjacktable';
// import SocketLoadTest from './components/SocketLoadTest';

const queryClient = new QueryClient();

function App() {
  const [user, setUser] = useState<UserCredential | null>(null);

  // Sign in a user with an anonymous credential
  useEffect(() => {
    onAuthStateChanged(auth, async () => {
      const user = await signInAnonymously(auth);
      setUser(user);
    });
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <div className="App App-with-background">
          <BlackjackTable />
        </div>
        <p className="read-the-docs">
          Click on the Vite and React logos to learn more
        </p>
      </SocketProvider>
    </QueryClientProvider>
  );
}

export default App;

