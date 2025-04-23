import { useState } from 'react';
import { computeHandCount } from '@shared-types/Game/Hand';
import {
  DisplayGameState,
  DisplayRoomState,
  useGameSocketListeners,
} from '../customHooks/useGameSocketListners';
import {
  createRoom,
  handleBetAmount,
  joinRoom,
  startGame,
  takeAction,
  takeSeat,
} from '../utils/gameAction';
import { ActionType } from '@shared-types/Game/ActionType';
import {
  getCards,
  getDealerCards,
  getHands,
  isCardsDealt,
} from '@shared-types/Game/utils';

const TestGame = () => {
  const [roomState, setRoomState] = useState<DisplayRoomState>({
    room: null,
    userRoom: null,
    userSeats: null,
    userSeat: null,
    joinRoom: null,
  });

  const [gameState, setGameState] = useState<DisplayGameState>({
    gameData: null,
    startBetting: false,
    betAmount: 0,
  });

  const socket = useGameSocketListeners({ setRoomState, setGameState });

  if (!socket) {
    return <div>No socket</div>;
  }

  const takeActionHelper = (action: ActionType) => {
    if (roomState.room?.url) {
      takeAction(
        socket,
        action,
        roomState.room?.url,
        roomState.userSeat,
        gameState.betAmount,
        setGameState
      );
    }
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

    const playerHands = getHands(gameState.gameData, roomState.userSeat);
    const playerCards = getCards(gameState.gameData, roomState.userSeat);
    const playerCounts = playerCards.map((cards) => computeHandCount(cards));

    return (
      <>
        {playerHands.map((hand, index) => {
          const playerCount = playerCounts[index];

          return (
            <div className="CardDisplay" key={`player-hand-${index}`}>
              <h2>Player Count: {playerCount}</h2>
              {playerCount > 21 && <h2>Player Bust</h2>}
              {hand?.isBlackjack && <h2>BlackJack!</h2>}

              {gameState.gameData && gameState.gameData.roundOver && (
                <>
                  {hand?.isDone && hand?.isWon && <h2>Player Won</h2>}
                  {hand?.isDone && !hand?.isWon && !hand?.isPush && (
                    <h2>Player Lost</h2>
                  )}
                  {hand?.isDone && hand?.isPush && <h2>Player Push</h2>}
                </>
              )}

              {playerCards[index].map((card, cardIndex) => (
                <CardDisplay
                  key={`${card.suit}-${card.value}-${cardIndex}`}
                  card={card}
                />
              ))}
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div>
      <h1>Test Game</h1>

      {!roomState.room && !roomState.userRoom ? (
        <>
          <button onClick={() => createRoom(socket)}>Create Room</button>
          <button
            onClick={() => {
              if (roomState.joinRoom) {
                joinRoom(socket, roomState.joinRoom);
              }
            }}
          >
            Join Room
          </button>
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
              <button
                onClick={() => {
                  if (roomState.room) {
                    startGame(socket, roomState.room.url);
                  }
                }}
              >
                Start Game
              </button>
            )}

          {/* Take Seat Button (only if the user hasn’t taken a seat) */}
          {roomState.userRoom && !roomState.userSeat && !roomState.userSeat && (
            <button
              onClick={() => {
                if (roomState) {
                  takeSeat(socket, roomState);
                }
              }}
            >
              Take Seat
            </button>
          )}

          {/* Betting Controls */}
          {gameState.startBetting && (
            <div>
              <button
                onClick={() => {
                  takeActionHelper('Bet');
                }}
              >
                Bet
              </button>
              <input
                type="number"
                onChange={(e) => handleBetAmount(setGameState, e.target.value)}
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
                  <button onClick={() => takeActionHelper('Hit')}>Hit</button>
                  <button onClick={() => takeActionHelper('Stand')}>
                    Stand
                  </button>
                  <button onClick={() => takeActionHelper('Double Down')}>
                    Double
                  </button>
                  <button onClick={() => takeActionHelper('Split')}>
                    Split
                  </button>
                </>
              ) : roomState.userRoom?.host ? (
                <button onClick={() => takeActionHelper('Reset')}>Reset</button>
              ) : null}
            </>
          )}

          {/* Display Player Stack */}
          {roomState.userSeat &&
            gameState.gameData?.players?.find(
              (player) => player.userId === roomState.userRoom?.userId
            )?.stack !== undefined && (
              <h1>
                Stack:{' '}
                {
                  gameState.gameData.players.find(
                    (player) => player.userId === roomState.userRoom?.userId
                  )?.stack
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

