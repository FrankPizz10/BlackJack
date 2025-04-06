import React, { useState, useEffect } from 'react';
import PlayerPosition from './playerposition';
import SidebarMenu from './sidebarmenu';
import BlackjackControls from './actioncard';

interface Player {
  id: number;
  username: string | null;
  mainBet: number;
  sideBets: { [key: string]: number };
  cards: { image: string; value: string }[];
  count: number;
  isActive: boolean;
  stack: number;
  selectedSection: string | null; // Track which section is currently selected for betting
}

const BlackjackTable = () => {
  // Initialize with empty player slots
  const [players, setPlayers] = useState<Player[]>([
    {
      id: 1,
      username: null,
      mainBet: 0,
      sideBets: {},
      cards: [],
      count: 0,
      isActive: false,
      stack: 0,
      selectedSection: null,
    },
    {
      id: 2,
      username: null,
      mainBet: 0,
      sideBets: {},
      cards: [],
      count: 0,
      isActive: false,
      stack: 0,
      selectedSection: null,
    },
    {
      id: 3,
      username: null,
      mainBet: 0,
      sideBets: {},
      cards: [],
      count: 0,
      isActive: false,
      stack: 0,
      selectedSection: null,
    },
    {
      id: 4,
      username: null,
      mainBet: 0,
      sideBets: {},
      cards: [],
      count: 0,
      isActive: false,
      stack: 0,
      selectedSection: null,
    },
    {
      id: 5,
      username: null,
      mainBet: 0,
      sideBets: {},
      cards: [],
      count: 0,
      isActive: false,
      stack: 0,
      selectedSection: null,
    },
  ]);

  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [gamePhase, setGamePhase] = useState<'betting' | 'action'>('betting');

  // State for intro card visibility
  const [showIntroCard, setShowIntroCard] = useState(true);

  // State for the join table modal - just track which seat is being joined
  const [seatToJoin, setSeatToJoin] = useState<number | null>(null);

  // Handler for section selection (center or sides)
  const handleSectionClick = (playerId: number, section: string) => {
    // Only allow section selection during betting phase
    if (gamePhase !== 'betting' || selectedPlayer !== playerId) return;

    console.log(`Player ${playerId} selected section: ${section}`);
    
    // Update the player's selected section
    setPlayers(players.map(player => 
      player.id === playerId
        ? { ...player, selectedSection: section }
        : player
    ));
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
    const player = players.find((p) => p.id === playerId);

    // If the seat is empty, show the join table modal
    if (!player || !player.username) {
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

    const player = players.find(p => p.id === selectedPlayer);
    if (!player || !player.selectedSection) {
      console.log("Please select a section to place your bet");
      return;
    }

    // Check if player has enough in their stack
    if (player.stack < amount) {
      console.log("Not enough chips to place this bet");
      return;
    }

    console.log(`Player ${selectedPlayer} placed bet of $${amount} on ${player.selectedSection}`);
    
    // Update the player's bets based on the selected section
    setPlayers(players.map(p => {
      if (p.id === selectedPlayer) {
        const updatedStack = p.stack - amount;
        
        if (p.selectedSection === 'center') {
          // Update main bet
          return {
            ...p,
            mainBet: p.mainBet + amount,
            stack: updatedStack,
          };
        } else {
          // Update side bet for the selected section
          return {
            ...p,
            sideBets: {
              ...p.sideBets,
              [p.selectedSection as string]: (p.sideBets[p.selectedSection as string] || 0) + amount,
            },
            stack: updatedStack,
          };
        }
      }
      return p;
    }));
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

    // Calculate 5 evenly spaced positions along the semicircle
    // Using a smaller angle range (PI * 0.7 instead of PI) for tighter spacing
    for (let i = 0; i < 5; i++) {
      // Base angle in radians (from 0.15π to 0.85π for a tighter arc)
      // This creates a tighter arc covering ~70% of the semicircle
      const angle = Math.PI * 0.15 + (Math.PI * 0.7 * i) / 4;

      // Calculate x and y coordinates
      let x = centerX + radius * Math.cos(angle);
      let y = centerY + radius * Math.sin(angle);

      // Special adjustments for Player 1 and Player 5 (positions 0 and 4)
      if (i === 0) {
        // Player 5 (left side)
        x += 1; // Adjust slightly right
        y -= 2; // Move up
      } else if (i === 4) {
        // Player 1 (right side)
        x -= 1; // Adjust slightly left
        y -= 2; // Move up
      }

      // Calculate scale factor - overall 20% smaller, with the same relative scaling
      const scaleFactor =
        i === 0 || i === 4
          ? 0.72 // 0.9 * 0.8 = 0.72
          : i === 1 || i === 3
          ? 0.76 // 0.95 * 0.8 = 0.76
          : 0.8; // Center position: 1.0 * 0.8 = 0.8

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
          <strong>Tip:</strong> To place a bet, select your position, click on a section of the 
          betting circle (center or sides), then choose your bet amount.
        </p>
        <button
          onClick={onClose}
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
          Start Playing
        </button>
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
    
    const player = players.find(p => p.id === selectedPlayer);
    if (!player || !player.selectedSection) return null;
    
    const sectionName = player.selectedSection === "center" 
      ? "Main Bet" 
      : `${player.selectedSection.charAt(0).toUpperCase() + player.selectedSection.slice(1)} Side Bet`;
    
    return (
      <div style={{
        position: "absolute",
        bottom: "22%",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#1e293b",
        color: "white",
        padding: "0.5rem 1rem",
        borderRadius: "0.5rem",
        fontSize: "0.875rem",
        textAlign: "center",
        zIndex: 15,
      }}>
        <span>Placing bet on: <strong>{sectionName}</strong></span>
      </div>
    );
  };

  return (
    <div>
      {/* Player positions */}
      {players.map((player, index) => (
        <div
          key={player.id}
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
          onClick={() => handlePlayerClick(player.id)}
        >
          {player.username ? (
            <PlayerPosition
              username={player.username}
              mainBet={player.mainBet}
              sideBets={player.sideBets}
              cards={player.cards}
              count={player.count}
              isActive={isPlayerActive(player.id)}
              onSectionClick={(section) => handleSectionClick(player.id, section)}
              selectedSection={player.id === selectedPlayer ? player.selectedSection : null}
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
            playerStack={
              players.find((p) => p.id === selectedPlayer)?.stack || 0
            }
            onBetSubmit={handleBetSubmit}
            onAction={handleAction}
            gamePhase={gamePhase} // Use the current game phase
            canDouble={gamePhase === 'action' && players.find(p => p.id === selectedPlayer)?.cards.length === 2}
            canSplit={gamePhase === 'action' && players.find(p => p.id === selectedPlayer)?.cards.length === 2}
            canSurrender={gamePhase === 'action' && players.find(p => p.id === selectedPlayer)?.cards.length === 2}
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