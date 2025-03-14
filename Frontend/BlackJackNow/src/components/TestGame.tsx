import { useEffect, useState } from 'react';
import { useSocket } from '../customHooks/useSocket';
import { StartGame } from '@shared-types/db/Game';
import { RoomData, TakeSeat } from '@shared-types/db/Room';
import { RoomWithUsersAndSeats, UserRoom } from '@shared-types/db/UserRoom';
import { JoinRoom } from '@shared-types/db/Room';
import { ActionEvent, Event } from '@shared-types/Game/Action';
import { UserSeat } from '@shared-types/db/UserSeat';
import { ActionType } from '@shared-types/Game/ActionType';
import { GameState } from '@shared-types/Game/GameState';
import { computeHandCount } from '@shared-types/Game/Hand';

const positionHelper = (seat: UserSeat | null) => {
  return seat && seat.position ? seat.position - 1 : 0;
};

const getCards = (gameState: GameState, position: UserSeat) => {
  return gameState.seats[positionHelper(position)].hands[0].cards;
};

const getHand = (gameState: GameState, position: UserSeat) => {
  return gameState.seats[positionHelper(position)].hands[0];
};

const getDealerCards = (gameState: GameState) => {
  return gameState.dealerHand;
};

const isCardsDealt = (gameState: GameState | null) => {
  if (!gameState) return false;
  return gameState.seats.some((seat) => seat.hands[0].cards.length > 0);
};

const TestGame = () => {
  const { socket } = useSocket();
  const [roomState, setRoomState] = useState<{
    room: RoomData | null;
    userRoom: UserRoom | null;
    userSeat: UserSeat | null;
    joinRoom: JoinRoom | null;
  }>({
    room: null,
    userRoom: null,
    userSeat: null,
    joinRoom: null,
  });

  const [gameState, setGameState] = useState<{
    gameData: GameState | null;
    startBetting: boolean;
    betAmount: number;
  }>({
    gameData: null,
    startBetting: false,
    betAmount: 0,
  });

  useEffect(() => {
    if (!socket) return;
    socket.on('roomCreated', (data: StartGame) => {
      setRoomState((prev) => ({
        ...prev,
        room: data.roomDb,
        userRoom: data.userRoomDb,
        userSeat: data.userSeatDb,
      }));
      console.log('Room created: ', data);
    });
    socket.on('roomJoined', (data: RoomWithUsersAndSeats) => {
      const { UserRooms } = data;
      const userRoomDb = UserRooms.find((ur) => ur.name === socket.id);
      console.log('User room db: ', userRoomDb);
      if (!userRoomDb) {
        console.error('User room not found in roomJoined event');
        return;
      }
      setRoomState((prev) => ({
        ...prev,
        room: {
          roomOpenTime: data.roomOpenTime,
          roomCloseTime: data.roomCloseTime,
          maxRoomSize: data.maxRoomSize,
          url: data.url,
          gameTableId: data.gameTableId,
          id: data.id,
        },
        userRoom: {
          id: userRoomDb.id,
          userId: userRoomDb.userId,
          roomId: userRoomDb.roomId,
          host: userRoomDb.host,
          name: userRoomDb.name,
          initialStack: userRoomDb.initialStack,
        },
      }));
      console.log('Room joined: ', data);
    });
    socket.on('seatTaken', (data: UserSeat) => {
      console.log('Seat taken: ', data);
      setRoomState((prev) => {
        if (data.userRoomId === prev.userRoom?.id) {
          return {
            ...prev,
            userSeat: data,
            seatTaken: true, // Set seatTaken only if the condition is met
          };
        }
        return prev; // Otherwise, return previous state without changes
      });
    });
    socket.on('gameStarted', () => {
      console.log('Game started');
      setGameState((prev) => ({
        ...prev,
        startBetting: true,
      }));
    });
    socket.on('betsPlaced', () => {
      console.log('Bets placed');
      setGameState((prev) => ({
        ...prev,
        startBetting: false,
      }));
    });
    socket.on('gameReset', () => {
      console.log('Game reset');
      setGameState((prev) => ({
        ...prev,
        startBetting: true,
      }));
    });
    socket.on('gameState', (gs: GameState) => {
      console.log('Received game state:', gs);
      if (!gs) return;
      setGameState((prev) => ({
        ...prev,
        gameData: gs,
      }));
    });
    return () => {
      socket.off('roomCreated');
      socket.off('roomJoined');
      socket.off('seatTaken');
      socket.off('gameStarted');
      socket.off('betsPlaced');
      socket.off('gameState');
    };
  }, [socket]);

  if (!socket) {
    return <div>No socket</div>;
  }
  const createRoom = async () => {
    console.log('Creating room');
    socket.emit('createRoom');
  };

  const startGame = async () => {
    if (!roomState.room) return;
    const startGame: Event = { roomUrl: roomState.room.url };
    console.log('Starting game: ', startGame);
    socket.emit('startGame', startGame);
  };

  const joinRoom = async () => {
    if (!roomState.joinRoom) return;
    console.log('Joining room: ', roomState.joinRoom);
    socket.emit('joinRoom', roomState.joinRoom);
  };

  const takeAction = async (actionType: ActionType) => {
    if (!roomState.room || !roomState.userRoom) return;
    let action: ActionEvent;
    if (actionType === 'Bet') {
      action = {
        roomUrl: roomState.room.url,
        actionType: actionType,
        bet: {
          betAmount: gameState.betAmount,
          bettingSeat: positionHelper(roomState.userSeat),
        },
        seatIndex: positionHelper(roomState.userSeat),
        handIndex: 0,
      };
      console.log('Action Bet: ', action);
    } else if (actionType === 'Hit') {
      console.log('Action Hit: ', actionType);
      action = {
        roomUrl: roomState.room.url,
        actionType: actionType,
        bet: null,
        seatIndex: positionHelper(roomState.userSeat),
        handIndex: 0,
      };
    } else if (actionType === 'Stand') {
      console.log('Action Stand: ', actionType);
      action = {
        roomUrl: roomState.room.url,
        actionType: actionType,
        bet: null,
        seatIndex: positionHelper(roomState.userSeat),
        handIndex: 0,
      };
    } else if (actionType === 'Reset') {
      console.log('Action Reset: ', actionType);
      action = {
        roomUrl: roomState.room.url,
        actionType: actionType,
        bet: null,
        seatIndex: positionHelper(roomState.userSeat),
        handIndex: 0,
      };
      setGameState((prev) => ({
        ...prev,
        startBetting: true,
      }));
    } else {
      return;
    }
    console.log('Emitting action: ', action);
    socket.emit('takeAction', action);
  };

  const handleBetAmount = (amount: string) => {
    // setBetAmount(parseInt(amount));
    setGameState((prev) => ({
      ...prev,
      betAmount: parseInt(amount),
    }));
  };

  const takeSeat = async () => {
    if (!roomState.room || !roomState.userRoom) return;
    const takeSeat: TakeSeat = {
      roomUrl: roomState.room.url,
      seatPosition: 2,
      userRoomId: roomState.userRoom.id,
    };
    console.log('Taking seat: ', takeSeat);
    socket.emit('takeSeat', takeSeat);
  };

  const renderDealer = () => {
    if (!gameState.gameData) return null; // Ensure game data exists

    const dealerCards = getDealerCards(gameState.gameData);
    const dealerCount = computeHandCount(dealerCards);

    return (
      <div className="CardDisplay">
        <h2>Dealer Count: {dealerCount}</h2>
        {dealerCount > 21 && <h2>Dealer Bust</h2>}
        {dealerCards.length > 0 &&
          dealerCards.map((card, index) => (
            <CardDisplay
              key={`${card.suit}-${card.value}-${index}`}
              card={card}
            />
          ))}
      </div>
    );
  };

  const renderPlayer = () => {
    if (!gameState.gameData || !roomState.userSeat) return null; // Ensure game data exists
    const playerHand = getHand(gameState.gameData, roomState.userSeat);
    const playerCards = getCards(gameState.gameData, roomState.userSeat);
    const playerCount = computeHandCount(playerCards);

    return (
      <div className="CardDisplay">
        <h2>Player Count: {playerCount}</h2>
        {playerCount > 21 && <h2>Player Bust</h2>}
        {playerHand?.isBlackjack && <h2>BlackJack!</h2>}
        {gameState.gameData.roundOver && (
          <>
            {playerHand?.isDone && playerHand?.isWon && <h2>Player Won</h2>}
            {playerHand?.isDone &&
              !playerHand?.isWon &&
              !playerHand?.isPush && <h2>Player Lost</h2>}
            {playerHand?.isDone && playerHand?.isPush && <h2>Player Push</h2>}
          </>
        )}
        {playerCards.map((card, index) => (
          <CardDisplay
            key={`${card.suit}-${card.value}-${index}`}
            card={card}
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      <h1>Test Game</h1>

      {!roomState.room && !roomState.userRoom ? (
        <>
          <button onClick={createRoom}>Create Room</button>
          <button onClick={joinRoom}>Join Room</button>
          <input
            type="text"
            onChange={(e) =>
              setRoomState((prev) => ({
                ...prev,
                joinRoom: { roomUrl: e.target.value },
              }))
            }
          />
        </>
      ) : (
        <>
          {/* Start Game Button (only for host) */}
          {roomState.room &&
            roomState.userRoom &&
            !gameState.startBetting &&
            !isCardsDealt(gameState.gameData) &&
            roomState.userRoom.host && (
              <button onClick={startGame}>Start Game</button>
            )}

          {/* Take Seat Button (only if the user hasn’t taken a seat) */}
          {roomState.userRoom && !roomState.userSeat && !roomState.userSeat && (
            <button onClick={takeSeat}>Take Seat</button>
          )}

          {/* Betting Controls */}
          {gameState.startBetting && (
            <div>
              <button onClick={() => takeAction('Bet')}>Bet</button>
              <input
                type="number"
                onChange={(e) => handleBetAmount(e.target.value)}
              />
            </div>
          )}

          {/* Game in Progress */}
          {isCardsDealt(gameState.gameData) && (
            <>
              <div>{renderDealer()}</div>
              <div>{renderPlayer()}</div>

              {!gameState?.gameData?.roundOver ? (
                <>
                  <button onClick={() => takeAction('Hit')}>Hit</button>
                  <button onClick={() => takeAction('Stand')}>Stand</button>
                </>
              ) : roomState.userRoom?.host ? (
                <button onClick={() => takeAction('Reset')}>Reset</button>
              ) : null}
            </>
          )}

          {/* Display Player Stack */}
          {roomState.userSeat &&
            gameState.gameData?.seats?.[positionHelper(roomState.userSeat)]
              ?.player?.stack !== undefined && (
              <h1>
                Stack:{' '}
                {
                  gameState.gameData.seats[positionHelper(roomState.userSeat)]
                    ?.player?.stack
                }
              </h1>
            )}
        </>
      )}
    </div>
  );
};

const CardDisplay = ({ card }: { card: { suit: string; value: string } }) => (
  <div style={{ display: 'flex' }}>
    <p>{card.suit}</p>
    <p>{card.value}</p>
  </div>
);

export default TestGame;

