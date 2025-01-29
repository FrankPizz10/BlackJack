// import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import RoomDisplay from './components/roomDisplay';
import { SocketProvider } from './providers/Socketprovider';
import SocketMessage from './components/SocketMessage';

const queryClient = new QueryClient();

function App() {
  // const [count, setCount] = useState(0);

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <div>
          <a href="https://vite.dev" target="_blank">
            <img src={viteLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>
        <h1>Vite + React</h1>
        <div className="card">
          {/* <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button> */}
          {/* <RoomDisplay /> */}
          <SocketMessage />
        </div>
        <p className="read-the-docs">
          Click on the Vite and React logos to learn more
        </p>
      </SocketProvider>
    </QueryClientProvider>
  );
}

export default App;

