import React, { useState } from 'react';
import PlayerPosition, { PlayerCards } from './playerposition';
import SidebarMenu from './sidebarmenu';
import BlackjackControls from './actioncard';
import {
  useGameSocketListeners,
  DisplayRoomState,
  DisplayGameState,
} from '../customHooks/useGameSocketListners';
import {
  getCards,
  getBetAmount,
  getStackSize,
  isCardsDealt,
  createTempUserSeats,
  getDealerCards,
} from '@shared-types/Game/utils';
import { computeHandCount } from '@shared-types/Game/Hand';
import {
  takeAction,
  takeSeat,
  handleBetAmount,
  createRoom,
  startGame,
  getGamePhase,
} from '../utils/gameAction';
import { ActionType } from '@shared-types/Game/ActionType';
import { UserSeat } from '@shared-types/db/UserSeat';
import IntroCard from './introcard';
import JoinTableForm from './jointableform';
import { convertCardsToBoardCards } from '../utils/cards';

const BlackjackTable = () => {
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

  const [selectedSeat, setSelectedSeat] = useState<UserSeat | null>(null);
  const [seatToJoin, setSeatToJoin] = useState<UserSeat | null>(null);
  const [showIntroCard, setShowIntroCard] = useState(true);

  const socket = useGameSocketListeners({ setRoomState, setGameState });
  if (!socket) return <div>No socket connection</div>;

  const handlePlayerClick = (seat: UserSeat) => {
    if (!roomState.userSeat || roomState.userSeat.id !== seat.id) {
      setSeatToJoin(seat);
    } else if (selectedSeat?.id === seat.id) {
      console.log(`Deselecting seat: ${seat.id}`);
      setSelectedSeat(null);
    } else if (seat.id === roomState.userSeat.id) {
      console.log(`Selecting seat: ${seat.id}`);
      setSelectedSeat(seat);
    }
  };

  const handleSectionClick = (seat: UserSeat, section: string) => {
    if (!gameState.startBetting) return;

    // Select the player if not already selected
    if (selectedSeat?.id !== seat.id) {
      setSelectedSeat(seat);
      console.log(`Selected seat: ${seat.id}, section: ${section}`);
    }

    // Check for existing bets
    // const hasExistingBet =
    //   section === 'center' ? seat.mainBet > 0 : !!player.sideBets[section];
    const hasExistingBet = getBetAmount(gameState.gameData, seat, 0) > 0;

    if (hasExistingBet) return;

    // Set the selected section for the player
    // setPlayers((prev) =>
    //   prev.map((p) =>
    //     p.id === seat.id ? { ...p, selectedSection: section } : p
    //   )
    // );
  };

  const handleStartgame = () => {
    createRoom(socket);
    setShowIntroCard(false);
  };

  const handlePlayerJoined = () => {
    if (roomState && roomState.userRoom) {
      takeSeat(socket, roomState);
      setSeatToJoin(null);
    }
  };

  const handleBetSubmit = (amount: number) => {
    handleBetAmount(setGameState, amount.toString());
    if (roomState.room?.url && roomState.userSeat) {
      takeAction(
        socket,
        'Bet',
        roomState.room.url,
        roomState.userSeat,
        amount,
        setGameState
      );
    }
  };

  const handleAction = (actionType: string) => {
    if (!roomState.room?.url || !roomState.userSeat) return;
    takeAction(
      socket,
      actionType as ActionType,
      roomState.room.url,
      roomState.userSeat,
      gameState.betAmount,
      setGameState
    );
  };

  const isPlayerActive = (seat: UserSeat) => roomState.userSeat?.id === seat.id;

  const getPlayerPositions = () => {
    const centerX = 49,
      centerY = 20,
      radius = 35;
    return Array.from({ length: 7 }, (_, i) => {
      const angle = Math.PI * 0.15 + (Math.PI * 0.7 * i) / 6;
      let x = centerX + radius * Math.cos(angle);
      let y = centerY + radius * Math.sin(angle);
      if (i === 0) {
        x += 1;
        y -= 2;
      }
      if (i === 6) {
        x -= 1;
        y -= 2;
      }
      const scaleFactor = [0.72, 0.74, 0.76, 0.8][Math.min(Math.abs(3 - i), 3)];
      return { left: `${x}%`, top: `${y}%`, scale: scaleFactor };
    });
  };

  const positions = getPlayerPositions();
  const userSeats = roomState.userSeats ?? Array(7).fill(null);
  const dealerCards = gameState.gameData
    ? getDealerCards(gameState.gameData)
    : [];
  const dealerCount = computeHandCount(dealerCards);
  const dealerBoardCards = convertCardsToBoardCards(dealerCards);

  return (
    <div>
      {isCardsDealt(gameState.gameData) && (
        <PlayerCards cards={dealerBoardCards} count={dealerCount} />
      )}
      {userSeats.slice(0, 7).map((seat, index) => {
        const cards = gameState.gameData
          ? getCards(gameState.gameData, seat)[0]
          : [];

        const boardCards = convertCardsToBoardCards(cards);
        const count = computeHandCount(cards);

        return (
          <div
            key={seat?.id ?? `empty-${index}`}
            style={{
              position: 'absolute',
              left: positions[index].left,
              top: positions[index].top,
              transform: `translate(-50%, -50%) scale(${positions[index].scale})`,
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
            }}
            onClick={() => handlePlayerClick(seat)}
          >
            {seat ? (
              <PlayerPosition
                // username={seat.username}
                mainBet={getBetAmount(gameState.gameData, seat, 0)}
                sideBets={{}}
                cards={boardCards}
                count={count}
                isActive={isPlayerActive(seat)}
                onSectionClick={(section) => handleSectionClick(seat, section)}
                selectedSection={selectedSeat?.id === seat.id ? 'center' : null}
              />
            ) : (
              <div
                style={{
                  width: '120px',
                  height: '80px',
                  backgroundColor: 'rgba(30, 41, 59, 0.7)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px dashed #4b5563',
                }}
              >
                <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                  Empty Seat
                </span>
              </div>
            )}
          </div>
        );
      })}

      <div style={{ position: 'absolute', left: 0, top: 0, zIndex: 50 }}>
        <SidebarMenu
          onOptionClick={(id) => console.log(`Option clicked: ${id}`)}
          onLeaveSeat={() => console.log('Leave seat')}
          onAway={() => console.log('Away')}
        />
      </div>

      <BlackjackControls
        selectedSeat={selectedSeat}
        playerStack={getStackSize(gameState.gameData, selectedSeat)}
        onBetSubmit={handleBetSubmit}
        onAction={handleAction}
        gamePhase={getGamePhase(gameState)}
        canDouble={true}
        canSplit={true}
        canSurrender={true}
      />

      {showIntroCard && <IntroCard onClose={handleStartgame} />}

      {seatToJoin && (
        <JoinTableForm
          seatId={seatToJoin.id}
          onJoin={handlePlayerJoined}
          onCancel={() => setSeatToJoin(null)}
        />
      )}

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
    </div>
  );
};

export default BlackjackTable;

