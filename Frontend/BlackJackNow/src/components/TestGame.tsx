import { useEffect, useState } from 'react';
import { useSocket } from '../customHooks/useSocket';
import { StartGame } from '@shared-types/db/Game';
import { RoomData } from '@shared-types/db/Room';
import { UserRoom } from '@shared-types/db/UserRoom';
import { JoinRoom } from '@shared-types/db/Room';
import { ActionEvent } from '@shared-types/Action';
import { UserSeat } from '@shared-types/db/UserSeat';
import { ActionType } from '@shared-types/ActionType';
import { GameState } from '@shared-types/GameState';
import { Card } from '@shared-types/Card';
import { computeHandCount } from '@shared-types/Hand';

const TestGame = () => {
  const { socket } = useSocket();
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [seats, setSeats] = useState<UserSeat[]>([]);
  const [userRoomData, setUserRoomData] = useState<UserRoom | null>(null);
  const [joinRoomData, setJoinRoomData] = useState<JoinRoom | null>(null);
  const [betAmount, setBetAmount] = useState(0);
  const [startBetting, setStartBetting] = useState(false);
  const [cardsDealt, setCardsDealt] = useState(false);
  const [userCards, setUserCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);

  useEffect(() => {
    if (!socket) return;
    socket.on('roomCreated', (data: StartGame) => {
      const { roomDb, userRoomDb, userSeatDb } = data;
      setRoomData(roomDb);
      setUserRoomData(userRoomDb);
      setSeats([userSeatDb]);
      console.log('Room created: ', data);
    });
    socket.on('roomJoined', (data: UserRoom) => {
      if (data.name === socket.id) {
        setUserRoomData(data);
      }
      console.log('Room joined: ', data);
    });
    socket.on('gameStarted', () => {
      console.log('Game started');
      setStartBetting(true);
    });
    socket.on('betsPlaced', () => {
      console.log('Bets placed');
      setStartBetting(false);
    });
    socket.on('cardsDealt', () => {
      console.log('Cards dealt');
      setCardsDealt(true);
    });
    socket.on('gameState', (gs: GameState) => {
      console.log('Received game state:', gs);
      if (!gs) return;
      setUserCards(gs.seats[0].hands[0].cards);
      setDealerCards(gs.dealerHand);
    });
  }, [socket]);

  if (!socket) {
    return <div>No socket</div>;
  }
  const createRoom = async () => {
    socket.emit('createRoom');
  };

  const startGame = async () => {
    if (!roomData || !userRoomData) return;
    const startGame: StartGame = {
      roomDb: roomData,
      userRoomDb: userRoomData,
      userSeatDb: seats[0],
    };
    console.log('Starting game: ', startGame);
    socket.emit('startGame', startGame);
  };

  const joinRoom = async () => {
    if (!joinRoomData) return;
    console.log('Joining room: ', joinRoomData);
    socket.emit('joinRoom', joinRoomData);
  };

  const takeAction = async (actionType: ActionType) => {
    if (!roomData || !userRoomData) return;
    let action: ActionEvent;
    if (actionType === 'Bet') {
      console.log('Action Bet: ', actionType, betAmount);
      const bettingSeat = seats[0];
      action = {
        roomUrl: roomData.url,
        actionType: actionType,
        bet: { betAmount: betAmount, bettingSeat: bettingSeat.position },
      };
    } else if (actionType === 'Hit') {
      console.log('Action Hit: ', actionType);
      action = {
        roomUrl: roomData.url,
        actionType: actionType,
        bet: null,
      };
    } else if (actionType === 'Stand') {
      console.log('Action Stand: ', actionType);
      action = {
        roomUrl: roomData.url,
        actionType: actionType,
        bet: null,
      };
    } else {
      return;
    }
    console.log('Emitting action: ', action);
    socket.emit('takeAction', action);
  };

  const handleBetAmount = (amount: string) => {
    setBetAmount(parseInt(amount));
  };

  return (
    <div>
      <h1>Test Game</h1>
      {!roomData && !userRoomData && (
        <>
          <button onClick={() => createRoom()}>Create Room</button>
          <button onClick={() => joinRoom()}>Join Room</button>
          <input
            type="text"
            onChange={(e) => setJoinRoomData({ roomUrl: e.target.value })}
          />
        </>
      )}
      {roomData && userRoomData && !startBetting && !cardsDealt && (
        <button onClick={() => startGame()}>Start Game</button>
      )}

      {startBetting && (
        <div>
          <button onClick={() => takeAction('Bet')}>Bet</button>
          <input
            type="number"
            onChange={(e) => handleBetAmount(e.target.value)}
          />
        </div>
      )}
      {cardsDealt && (
        <>
          <div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <h2>Dealer Count: {computeHandCount(dealerCards)}</h2>
              {dealerCards.map((card, index) => (
                <div
                  key={card.suit + card.card + index}
                  style={{ display: 'flex' }}
                >
                  <p>{card.suit}</p>
                  <p>{card.card}</p>
                </div>
              ))}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <h2>Player Count: {computeHandCount(userCards)}</h2>
              {userCards.map((card, index) => (
                <div
                  key={card.suit + card.card + index}
                  style={{ display: 'flex' }}
                >
                  <p>{card.suit}</p>
                  <p>{card.card}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <button onClick={() => takeAction('Hit')}>Hit</button>
            <button onClick={() => takeAction('Stand')}>Stand</button>
          </div>
        </>
      )}
    </div>
  );
};

export default TestGame;

