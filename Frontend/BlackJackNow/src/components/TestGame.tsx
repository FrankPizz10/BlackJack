import { useEffect, useState } from 'react';
import { useSocket } from '../customHooks/useSocket';
import { StartGame, RoomJoined } from '@shared-types/db/Game';
import { RoomData } from '@shared-types/db/Room';
import { UserRoom } from '@shared-types/db/UserRoom';
import { JoinRoom } from '@shared-types/db/Room';
import { ActionEvent, Event } from '@shared-types/Game/Action';
import { UserSeat } from '@shared-types/db/UserSeat';
import { ActionType } from '@shared-types/Game/ActionType';
import { GameState } from '@shared-types/Game/GameState';
import { Card } from '@shared-types/Game/Card';
import { computeHandCount } from '@shared-types/Game/Hand';

const positionHelper = (seat: UserSeat | null) => {
  return seat && seat.position ? seat.position - 1 : 0;
};

const TestGame = () => {
  const { socket } = useSocket();
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [userRoomData, setUserRoomData] = useState<UserRoom | null>(null);
  const [userSeatData, setUserSeatData] = useState<UserSeat | null>(null);
  const [joinRoomData, setJoinRoomData] = useState<JoinRoom | null>(null);
  const [betAmount, setBetAmount] = useState(0);
  const [startBetting, setStartBetting] = useState(false);
  const [cardsDealt, setCardsDealt] = useState(false);
  const [userCards, setUserCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<ReadonlyArray<Card>>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    if (!socket) return;
    socket.on('roomCreated', (data: StartGame) => {
      const { roomDb, userRoomDb, userSeatDb } = data;
      setRoomData(roomDb);
      setUserRoomData(userRoomDb);
      setUserSeatData(userSeatDb);
      console.log('Room created: ', data);
    });
    socket.on('roomJoined', (data: RoomJoined) => {
      const { roomDb, userRoomDb } = data;
      setRoomData(roomDb);
      setUserRoomData(userRoomDb);
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
      setUserCards([...gs.seats[positionHelper(userSeatData)].hands[0].cards]);
      setDealerCards(gs.dealerHand);
      setGameState(gs);
    });
  }, [socket]);

  if (!socket) {
    return <div>No socket</div>;
  }
  const createRoom = async () => {
    console.log('Creating room');
    socket.emit('createRoom');
  };

  const startGame = async () => {
    if (!roomData) return;
    const startGame: Event = { roomUrl: roomData.url };
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
      action = {
        roomUrl: roomData.url,
        actionType: actionType,
        bet: {
          betAmount: betAmount,
          bettingSeat: positionHelper(userSeatData),
        },
      };
      console.log('Action Bet: ', action);
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
    } else if (actionType === 'Reset') {
      console.log('Action Reset: ', actionType);
      action = {
        roomUrl: roomData.url,
        actionType: actionType,
        bet: null,
      };
      setStartBetting(true);
      setCardsDealt(false);
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
              {computeHandCount(dealerCards) > 21 && <h2>Dealer Bust</h2>}
              {dealerCards.map((card, index) => (
                <div
                  key={card.suit + card.value + index}
                  style={{ display: 'flex' }}
                >
                  <p>{card.suit}</p>
                  <p>{card.value}</p>
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
              {computeHandCount(userCards) > 21 && <h2>Player Bust</h2>}
              {gameState?.seats[positionHelper(userSeatData)].hands[0]
                .isBlackjack && <h2>BlackJack!</h2>}
              {gameState?.seats[positionHelper(userSeatData)].hands[0].isDone &&
                gameState?.seats[positionHelper(userSeatData)].hands[0]
                  .isWon && <h2>Player Won</h2>}
              {gameState?.seats[positionHelper(userSeatData)].hands[0].isDone &&
                !gameState?.seats[positionHelper(userSeatData)].hands[0]
                  .isWon &&
                !gameState?.seats[positionHelper(userSeatData)].hands[0]
                  .isPush && <h2>Player Lost</h2>}
              {gameState?.seats[positionHelper(userSeatData)].hands[0].isDone &&
                gameState?.seats[positionHelper(userSeatData)].hands[0]
                  .isPush && <h2>Player Push</h2>}
              {userCards.map((card, index) => (
                <div
                  key={card.suit + card.value + index}
                  style={{ display: 'flex' }}
                >
                  <p>{card.suit}</p>
                  <p>{card.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div>
              {!gameState?.roundOver && (
                <>
                  <button onClick={() => takeAction('Hit')}>Hit</button>
                  <button onClick={() => takeAction('Stand')}>Stand</button>
                </>
              )}
            </div>
            {gameState?.roundOver && (
              <button onClick={() => takeAction('Reset')}>Reset</button>
            )}
          </div>
        </>
      )}
      {gameState?.seats[positionHelper(userSeatData)].player.stack && (
        <h1>
          Stack: {gameState?.seats[positionHelper(userSeatData)].player.stack}
        </h1>
      )}
    </div>
  );
};

export default TestGame;

