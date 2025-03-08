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
import { Card } from '@shared-types/Game/Card';
import { computeHandCount } from '@shared-types/Game/Hand';

const positionHelper = (seat: UserSeat | null) => {
  console.log('User Seat Debug: ', seat);
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
  const [seatTaken, setSeatTaken] = useState(false);

  useEffect(() => {
    if (!socket) return;
    socket.on('roomCreated', (data: StartGame) => {
      const { roomDb, userRoomDb, userSeatDb } = data;
      setRoomData(roomDb);
      setUserRoomData(userRoomDb);
      setUserSeatData(userSeatDb);
      console.log('Room created: ', data);
    });
    socket.on('roomJoined', (data: RoomWithUsersAndSeats) => {
      const { UserRooms } = data;
      const userRoomDb = UserRooms.find((ur) => ur.name === socket.id);
      console.log('User room db: ', userRoomDb);
      setRoomData({
        roomOpenTime: data.roomOpenTime,
        roomCloseTime: data.roomCloseTime,
        maxRoomSize: data.maxRoomSize,
        url: data.url,
        gameTableId: data.gameTableId,
        id: data.id,
      });
      if (!userRoomDb) {
        console.error('User room not found in roomJoined event');
        return;
      }
      const userRoomData = {
        id: userRoomDb.id,
        userId: userRoomDb.userId,
        roomId: userRoomDb.roomId,
        host: userRoomDb.host,
        name: userRoomDb.name,
        initialStack: userRoomDb.initialStack,
      };
      console.log('User room data set: ', userRoomData);
      setUserRoomData(userRoomData);
      console.log('Room joined: ', data);
    });
    socket.on('seatTaken', (data: UserSeat) => {
      console.log('Seat taken: ', data);
      setSeatTaken(true);
      setUserRoomData((prevUserRoomData) => {
        console.log('Previous user room data: ', prevUserRoomData);

        if (data.userRoomId === prevUserRoomData?.id) {
          console.log('Setting user seat data');
          setUserSeatData(data);
        }

        return prevUserRoomData; // Ensure no unwanted state mutation
      });
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
      console.log('User position: ', positionHelper(userSeatData));
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

  const takeSeat = async () => {
    if (!roomData || !userRoomData) return;
    const takeSeat: TakeSeat = {
      roomUrl: roomData.url,
      seatPosition: 2,
      userRoomId: userRoomData.id,
    };
    console.log('Taking seat: ', takeSeat);
    socket.emit('takeSeat', takeSeat);
  };

  const renderDealer = () => (
    <div style={centeredColumn}>
      <h2>Dealer Count: {computeHandCount(dealerCards)}</h2>
      {computeHandCount(dealerCards) > 21 && <h2>Dealer Bust</h2>}
      {dealerCards.map((card, index) => (
        <CardDisplay key={`${card.suit}-${card.value}-${index}`} card={card} />
      ))}
    </div>
  );

  const renderPlayer = () => {
    const playerHand = gameState?.seats[positionHelper(userSeatData)]?.hands[0];

    return (
      <div style={centeredColumn}>
        <h2>Player Count: {computeHandCount(userCards)}</h2>
        {computeHandCount(userCards) > 21 && <h2>Player Bust</h2>}
        {playerHand?.isBlackjack && <h2>BlackJack!</h2>}
        {playerHand?.isDone && playerHand?.isWon && <h2>Player Won</h2>}
        {playerHand?.isDone && !playerHand?.isWon && !playerHand?.isPush && (
          <h2>Player Lost</h2>
        )}
        {playerHand?.isDone && playerHand?.isPush && <h2>Player Push</h2>}
        {userCards.map((card, index) => (
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

      {!roomData && !userRoomData ? (
        <>
          <button onClick={createRoom}>Create Room</button>
          <button onClick={joinRoom}>Join Room</button>
          <input
            type="text"
            onChange={(e) => setJoinRoomData({ roomUrl: e.target.value })}
          />
        </>
      ) : (
        <>
          {roomData &&
            userRoomData &&
            !startBetting &&
            !cardsDealt &&
            userRoomData.host && (
              <button onClick={startGame}>Start Game</button>
            )}

          {userRoomData && !userSeatData && !seatTaken && (
            <button onClick={takeSeat}>Take Seat</button>
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
              <div>{renderDealer()}</div>
              <div>{renderPlayer()}</div>

              {!gameState?.roundOver ? (
                <>
                  <button onClick={() => takeAction('Hit')}>Hit</button>
                  <button onClick={() => takeAction('Stand')}>Stand</button>
                </>
              ) : (
                <button onClick={() => takeAction('Reset')}>Reset</button>
              )}
            </>
          )}

          {gameState?.seats[positionHelper(userSeatData)]?.player?.stack !==
            undefined && (
            <h1>
              Stack:{' '}
              {gameState.seats[positionHelper(userSeatData)]?.player?.stack}
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

const centeredColumn = {
  display: 'flex',
  alignItems: 'center',
};

export default TestGame;

