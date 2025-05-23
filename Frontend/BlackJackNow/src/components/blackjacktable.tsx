import React, { useState, useEffect } from 'react';
import PlayerPosition from './playerposition';
import SidebarMenu from './sidebarmenu';
import BlackjackControls from './actioncard';
import {
  DisplayGameState,
  DisplayRoomState,
  useGameSocketListeners,
} from '../customHooks/useGameSocketListners';
import { ActionType } from '@shared-types/Game/ActionType';
import { createRoom, joinRoom, takeAction } from '../utils/gameAction';
import { computeHandCount } from '@shared-types/Game/Hand';
import { BoardCard } from './playerposition';
import { JoinRoom } from '@shared-types/db/Room';

interface BoardSeat {
  id: number;
  userName: string | null;
  mainBet: number;
  sideBets: { [key: string]: number };
  cards: BoardCard[];
  count: number;
  isActive: boolean;
  stack: number;
  selectedSection: string | null; // Track which section is currently selected for betting
}

const BlackjackTable = () => {
  // Initialize with empty player slots
  const [players, setPlayers] = useState<BoardSeat[]>([]);
  //   {
  //     id: 1,
  //     username: null,
  //     mainBet: 0,
  //     sideBets: {},
  //     cards: [],
  //     count: 0,
  //     isActive: false,
  //     stack: 0,
  //     selectedSection: null,
  //   },
  //   {
  //     id: 2,
  //     username: null,
  //     mainBet: 0,
  //     sideBets: {},
  //     cards: [],
  //     count: 0,
  //     isActive: false,
  //     stack: 0,
  //     selectedSection: null,
  //   },
  //   {
  //     id: 3,
  //     username: null,
  //     mainBet: 0,
  //     sideBets: {},
  //     cards: [],
  //     count: 0,
  //     isActive: false,
  //     stack: 0,
  //     selectedSection: null,
  //   },
  //   {
  //     id: 4,
  //     username: null,
  //     mainBet: 0,
  //     sideBets: {},
  //     cards: [],
  //     count: 0,
  //     isActive: false,
  //     stack: 0,
  //     selectedSection: null,
  //   },
  //   {
  //     id: 5,
  //     username: null,
  //     mainBet: 0,
  //     sideBets: {},
  //     cards: [],
  //     count: 0,
  //     isActive: false,
  //     stack: 0,
  //     selectedSection: null,
  //   },
  //   {
  //     id: 6,
  //     username: null,
  //     mainBet: 0,
  //     sideBets: {},
  //     cards: [],
  //     count: 0,
  //     isActive: false,
  //     stack: 0,
  //     selectedSection: null,
  //   },
  //   {
  //     id: 7,
  //     username: null,
  //     mainBet: 0,
  //     sideBets: {},
  //     cards: [],
  //     count: 0,
  //     isActive: false,
  //     stack: 0,
  //     selectedSection: null,
  //   },
  // ]);

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

  // TODO allow access to multiple hands
  const seats: BoardSeat[] =
    gameState.gameData?.players.map((player, index) => {
      const hand = gameState.gameData?.seats[player.seatIndexes[0]].hands[0];
      return {
        id: index + 1,
        userId: player.userId,
        userName: player.userName,
        mainBet: hand?.bet || 0,
        cards:
          hand?.cards.map((card) => ({
            image: 'defaultCardImage.png', // Placeholder for card image
            card: card,
          })) ?? [],
        count: computeHandCount(hand?.cards ?? []),
        isActive: !player.isAfk,
        stack: player.stack,
        selectedSection: null,
        sideBets: {},
      };
    }) || [];

  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [gamePhase, setGamePhase] = useState<'betting' | 'action'>('betting');

  // State for intro card visibility
  const [showIntroCard, setShowIntroCard] = useState(true);

  // State for the join table modal - just track which seat is being joined
  const [seatToJoin, setSeatToJoin] = useState<number | null>(null);

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

  const handleSectionClick = (playerId: number, section: string) => {
    if (gamePhase !== 'betting') return;

    // Select the player if not already selected
    if (selectedPlayer !== playerId) {
      setSelectedPlayer(playerId);
    }

    const player = seats.find((p) => p.id === playerId);
    if (!player) return;

    // Check for existing bets
    const hasExistingBet =
      section === 'center' ? player.mainBet > 0 : !!player.sideBets[section];

    if (hasExistingBet) return;

    // Set the selected section for the player
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === playerId ? { ...p, selectedSection: section } : p
      )
    );
  };

  const handleOptionClick = (optionId: string) => {
    console.log(`Option clicked: ${optionId}`);
  };

  const handleLeaveSeat = () => {
    console.log('Leave seat clicked');
  };

  const handleAway = () => {
    console.log('Away clicked');
  };

  const handlePlayerClick = (playerId: number | null) => {
    const player = seats.find((p) => p.id === playerId);

    // If the seat is empty, show the join table modal
    if (!player || !player.userName) {
      setSeatToJoin(playerId);
      return;
    }

    // Otherwise, select/deselect the player as before
    setSelectedPlayer(playerId === selectedPlayer ? null : playerId);
  };

  const handlePlayerJoined = (
    seatId: number,
    username: string,
    stackSize: number
  ) => {
    // Update the player at that position
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) =>
        player.id === seatId
          ? {
              ...player,
              username: username.trim(),
              stack: stackSize,
              isActive: true, // Make newly joined player active
              selectedSection: null,
            }
          : player
      )
    );

    // Reset the seat joining state
    setSeatToJoin(null);
  };

  const handleBetSubmit = (amount: number) => {
    if (!selectedPlayer) return;

    const playerIndex = seats.findIndex((p) => p.id === selectedPlayer);
    if (playerIndex === -1) return;

    const player = seats[playerIndex];
    if (!player.selectedSection) return;

    if (player.stack < amount) return;

    const newPlayers = [...seats];
    const updatedPlayer = { ...player };
    const currentSection = player.selectedSection;

    updatedPlayer.stack -= amount;

    if (currentSection === 'center') {
      updatedPlayer.mainBet += amount;
    } else {
      updatedPlayer.sideBets = {
        ...updatedPlayer.sideBets,
        [currentSection]:
          (updatedPlayer.sideBets[currentSection] || 0) + amount,
      };
    }

    updatedPlayer.selectedSection = null;
    newPlayers[playerIndex] = updatedPlayer;

    setPlayers(newPlayers);
    setSelectedPlayer(null);
  };

  const handleAction = (actionType: string) => {
    console.log(`Player ${selectedPlayer} chose action: ${actionType}`);

    // If this is a betting action, we stay in betting phase
    // If it's a game action (hit, stand, etc.), we move to action phase
    if (actionType === 'bet') {
      setGamePhase('betting');
    } else {
      setGamePhase('action');
    }

    // After certain actions, we may want to reset the selected player
    if (actionType === 'stand' || actionType === 'surrender') {
      setTimeout(() => {
        setSelectedPlayer(null);
      }, 1000);
    }
  };

  // Function to determine if a player's turn is active
  const isPlayerActive = (playerId: number) => {
    return selectedPlayer === playerId;
  };

  // Calculate player positions along a semicircle for 5 players
  const getPlayerPositions = () => {
    // Center of the semicircle (horizontally centered, moved higher up the page)
    const centerX = 49;
    const centerY = 20; // Move higher up the page

    // Reduced radius for tighter spacing
    const radius = 35;

    // Array to hold calculated positions
    const positions = [];

    // Calculate 7 evenly spaced positions along the semicircle
    for (let i = 0; i < 7; i++) {
      // Base angle in radians (from 0.15π to 0.85π for a tighter arc)
      const angle = Math.PI * 0.15 + (Math.PI * 0.7 * i) / 6;

      // Calculate x and y coordinates
      let x = centerX + radius * Math.cos(angle);
      let y = centerY + radius * Math.sin(angle);

      // Special adjustments for the first and last players (positions 0 and 6)
      if (i === 0) {
        x += 1; // Adjust slightly right
        y -= 2; // Move up
      } else if (i === 6) {
        x -= 1; // Adjust slightly left
        y -= 2; // Move up
      }

      // Calculate scale factor
      let scaleFactor;
      if (i === 0 || i === 6) {
        scaleFactor = 0.72;
      } else if (i === 1 || i === 5) {
        scaleFactor = 0.74;
      } else if (i === 2 || i === 4) {
        scaleFactor = 0.76;
      } else {
        scaleFactor = 0.8; // for i=3, the center
      }

      positions.push({
        left: `${x}%`,
        top: `${y}%`,
        scale: scaleFactor,
      });
    }

    return positions;
  };

  const playerPositions = getPlayerPositions();

  interface IntroCard {
    onClose: () => void;
  }

  // Intro Card Component
  const IntroCard: React.FC<IntroCard> = ({ onClose }) => {
    const [joinRoomState, setJoinRoomState] = useState<JoinRoom | null>(null);
    const handleCreateRoom = () => {
      createRoom(socket);
      onClose();
    };

    const handleJoinRoom = () => {
      if (!joinRoomState) return;
      joinRoom(socket, joinRoomState);
      onClose();
    };

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#1e293b',
          borderRadius: '0.75rem',
          padding: '2rem',
          maxWidth: '500px',
          width: '80%',
          boxShadow:
            '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          zIndex: 100,
          color: 'white',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            color: '#22c55e',
          }}
        >
          Welcome to Blackjack
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          Click on an empty seat to join the table. Each player starts with
          their own stack. Play responsibly and good luck!
        </p>
        <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          <strong>Tip:</strong> To place a bet, select your position, click on a
          section of the betting circle (center or sides), then choose your bet
          amount.
        </p>
        <button
          onClick={handleCreateRoom}
          style={{
            backgroundColor: '#22c55e',
            color: 'white',
            fontWeight: 'bold',
            padding: '0.5rem 1.5rem',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            fontSize: '1rem',
          }}
        >
          Create Room
        </button>
        <button
          onClick={handleJoinRoom}
          style={{
            backgroundColor: '#22c55e',
            color: 'white',
            fontWeight: 'bold',
            padding: '0.5rem 1.5rem',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            fontSize: '1rem',
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
      </div>
    );
  };

  interface JoinTableFormProps {
    seatId: number;
    onJoin: (seatId: number, username: string, stackSize: number) => void;
    onCancel: () => void;
  }

  // Standalone Join Table Form Modal
  const JoinTableForm: React.FC<JoinTableFormProps> = ({
    seatId,
    onJoin,
    onCancel,
  }) => {
    const [formData, setFormData] = useState({
      username: '',
      stackSize: '',
    });

    // Simple controlled component handler
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    };

    // Form submission handler
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const parsedStackSize = Number(formData.stackSize);

      // Basic validation
      if (
        !formData.username.trim() ||
        !formData.stackSize.trim() ||
        isNaN(parsedStackSize) ||
        parsedStackSize <= 0
      ) {
        alert('Please enter a valid username and stack amount');
        return;
      }

      // Pass data back to parent
      onJoin(seatId, formData.username, Number(formData.stackSize));
    };

    // Close the modal on Escape key
    useEffect(() => {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onCancel();
        }
      };

      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }, [onCancel]);

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
        }}
      >
        <div
          style={{
            backgroundColor: '#1e293b',
            borderRadius: '0.75rem',
            padding: '2rem',
            width: '90%',
            maxWidth: '400px',
            color: 'white',
          }}
        >
          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              marginBottom: '1.5rem',
              color: '#22c55e',
              textAlign: 'center',
            }}
          >
            Join Table
          </h3>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="username"
                style={{ display: 'block', marginBottom: '0.5rem' }}
              >
                Username:
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your name"
                maxLength={20}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #4b5563',
                  backgroundColor: '#1f2937',
                  color: 'white',
                  fontSize: '1rem',
                }}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label
                htmlFor="stackSize"
                style={{ display: 'block', marginBottom: '0.5rem' }}
              >
                Stack Size ($):
              </label>
              <input
                id="stackSize"
                name="stackSize"
                type="number"
                min="1"
                value={formData.stackSize}
                onChange={handleChange}
                placeholder="Enter amount"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #4b5563',
                  backgroundColor: '#1f2937',
                  color: 'white',
                  fontSize: '1rem',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <button
                type="button"
                onClick={onCancel}
                style={{
                  backgroundColor: '#4b5563',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  backgroundColor: '#22c55e',
                  color: 'white',
                  fontWeight: 'bold',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Join
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Instructions for the selected section (if any)
  const SectionInstructions = () => {
    if (!selectedPlayer) return null;

    const player = seats.find((p) => p.id === selectedPlayer);
    if (!player || !player.selectedSection) return null;

    const sectionName =
      player.selectedSection === 'center'
        ? 'Main Bet'
        : `${
            player.selectedSection.charAt(0).toUpperCase() +
            player.selectedSection.slice(1)
          } Side Bet`;

    return (
      <div
        style={{
          position: 'absolute',
          bottom: '22%',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#1e293b',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          textAlign: 'center',
          zIndex: 15,
        }}
      >
        <span>
          Placing bet on: <strong>{sectionName}</strong>
        </span>
      </div>
    );
  };

  return (
    <div>
      {/* Player positions */}
      {seats.map((seat, index) => (
        <div
          key={`${seat.id}`}
          style={{
            position: 'absolute',
            left: playerPositions[index].left,
            top: playerPositions[index].top,
            transform: `translate(-50%, -50%) scale(${playerPositions[index].scale})`,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
          }}
          onClick={() => handlePlayerClick(seat.id)}
        >
          {seat.userName ? (
            <PlayerPosition
              username={seat.userName}
              mainBet={seat.mainBet}
              // sideBets={player.sideBets}
              cards={seat.cards}
              count={seat.count}
              isActive={isPlayerActive(seat.id)}
              onSectionClick={(section) => handleSectionClick(seat.id, section)}
              selectedSection={
                seat.id === selectedPlayer ? seat.selectedSection : null
              }
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
      ))}

      {/* SidebarMenu - left side */}
      <div style={{ position: 'absolute', left: 0, top: 0, zIndex: 50 }}>
        <SidebarMenu
          onOptionClick={handleOptionClick}
          onLeaveSeat={handleLeaveSeat}
          onAway={handleAway}
        />
      </div>

      {/* Section selection indicator */}
      <SectionInstructions />

      {/* BlackjackControls - appears when a player is selected */}
      {selectedPlayer && (
        <div
          style={{
            position: 'absolute',
            bottom: '5%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80%',
            zIndex: 20,
          }}
        >
          <BlackjackControls
            playerStack={seats.find((p) => p.id === selectedPlayer)?.stack || 0}
            onBetSubmit={handleBetSubmit}
            onAction={handleAction}
            gamePhase={gamePhase} // Use the current game phase
            canDouble={
              gamePhase === 'action' &&
              seats.find((p) => p.id === selectedPlayer)?.cards.length === 2
            }
            canSplit={
              gamePhase === 'action' &&
              seats.find((p) => p.id === selectedPlayer)?.cards.length === 2
            }
            canSurrender={
              gamePhase === 'action' &&
              seats.find((p) => p.id === selectedPlayer)?.cards.length === 2
            }
          />
        </div>
      )}

      {/* Intro Card */}
      {showIntroCard && <IntroCard onClose={() => setShowIntroCard(false)} />}

      {/* The new standalone form instead of the modal */}
      {seatToJoin && (
        <JoinTableForm
          seatId={seatToJoin}
          onJoin={handlePlayerJoined}
          onCancel={() => setSeatToJoin(null)}
        />
      )}
    </div>
  );
};

export default BlackjackTable;

