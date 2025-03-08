import React, { useState, useEffect } from 'react';
import PlayerPosition from './playerposition';
import SidebarMenu from './sidebarmenu';
import BlackjackControls from './actioncard';

const BlackjackTable = () => {
  // Initialize with empty player slots
  const [players, setPlayers] = useState([
    { id: 1, username: null, mainBet: 0, sideBets: {}, cards: [], count: 0, isActive: false, stack: 0 },
    { id: 2, username: null, mainBet: 0, sideBets: {}, cards: [], count: 0, isActive: false, stack: 0 },
    { id: 3, username: null, mainBet: 0, sideBets: {}, cards: [], count: 0, isActive: false, stack: 0 },
    { id: 4, username: null, mainBet: 0, sideBets: {}, cards: [], count: 0, isActive: false, stack: 0 },
    { id: 5, username: null, mainBet: 0, sideBets: {}, cards: [], count: 0, isActive: false, stack: 0 },
  ]);
  
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  
  // State for intro card visibility
  const [showIntroCard, setShowIntroCard] = useState(true);
  
  // State for the join table modal - just track which seat is being joined
  const [seatToJoin, setSeatToJoin] = useState(null);

  const handleSideBetClick = (playerId, section) => {
    console.log(`Player ${playerId} placed side bet on ${section}`);
  };
  
  const handleOptionClick = (optionId) => {
    console.log(`Option clicked: ${optionId}`);
  };
  
  const handleLeaveSeat = () => {
    console.log("Leave seat clicked");
  };
  
  const handleAway = () => {
    console.log("Away clicked");
  };
  
  const handlePlayerClick = (playerId) => {
    const player = players.find(p => p.id === playerId);
    
    // If the seat is empty, show the join table modal
    if (!player.username) {
      setSeatToJoin(playerId);
      return;
    }
    
    // Otherwise, select/deselect the player as before
    setSelectedPlayer(playerId === selectedPlayer ? null : playerId);
  };
  
  const handlePlayerJoined = (seatId, username, stackSize) => {
    // Update the player at that position
    setPlayers(prevPlayers => 
      prevPlayers.map(player => 
        player.id === seatId 
          ? { 
              ...player, 
              username: username.trim(), 
              stack: stackSize,
              isActive: true // Make newly joined player active
            }
          : player
      )
    );
    
    // Reset the seat joining state
    setSeatToJoin(null);
  };
  
  const handleBetSubmit = (amount) => {
    console.log(`Player ${selectedPlayer} placed bet of $${amount}`);
    // BetSubmit is handled by BlackjackControls
  };
  
  const handleAction = (actionType) => {
    console.log(`Player ${selectedPlayer} chose action: ${actionType}`);
    // Actions are handled by BlackjackControls
    
    // After certain actions, we may want to reset the selected player
    if (actionType === 'stand' || actionType === 'surrender') {
      setTimeout(() => {
        setSelectedPlayer(null);
      }, 1000);
    }
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
      let angle = (Math.PI * 0.15) + (Math.PI * 0.7 * i / 4);
      
      // Calculate x and y coordinates
      let x = centerX + radius * Math.cos(angle);
      let y = centerY + radius * Math.sin(angle);
      
      // Special adjustments for Player 1 and Player 5 (positions 0 and 4)
      if (i === 0) { // Player 5 (left side)
        x += 1; // Adjust slightly right
        y -= 2; // Move up
      } else if (i === 4) { // Player 1 (right side)
        x -= 1; // Adjust slightly left
        y -= 2; // Move up
      }
      
      // Calculate scale factor - overall 20% smaller, with the same relative scaling
      const scaleFactor = i === 0 || i === 4 ? 0.72 : // 0.9 * 0.8 = 0.72 
                          i === 1 || i === 3 ? 0.76 : // 0.95 * 0.8 = 0.76
                          0.8; // Center position: 1.0 * 0.8 = 0.8
      
      positions.push({ 
        left: `${x}%`, 
        top: `${y}%`,
        scale: scaleFactor
      });
    }
    
    return positions;
  };

  const playerPositions = getPlayerPositions();

  // Intro Card Component
  const IntroCard = ({ onClose }) => {
    return (
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#1e293b',
        borderRadius: '0.75rem',
        padding: '2rem',
        maxWidth: '500px',
        width: '80%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        zIndex: 100,
        color: 'white',
        textAlign: 'center'
      }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#22c55e'
        }}>
          Welcome to Blackjack
        </h2>
        <p style={{ marginBottom: '1.5rem' }}>
          Click on an empty seat to join the table. Each player starts with their own stack.
          Play responsibly and good luck!
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
            fontSize: '1rem'
          }}
        >
          Start Playing
        </button>
      </div>
    );
  };

  // Standalone Join Table Form Modal
  function JoinTableForm({ seatId, onJoin, onCancel }) {
    const [formData, setFormData] = useState({
      username: '',
      stackSize: ''
    });
    
    // Simple controlled component handler
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };
    
    // Form submission handler
    const handleSubmit = (e) => {
      e.preventDefault();
      
      // Basic validation
      if (!formData.username.trim() || !formData.stackSize.trim() || isNaN(formData.stackSize) || Number(formData.stackSize) <= 0) {
        alert("Please enter a valid username and stack amount");
        return;
      }
      
      // Pass data back to parent
      onJoin(seatId, formData.username, Number(formData.stackSize));
    };
    
    // Close the modal on Escape key
    useEffect(() => {
      const handleEsc = (e) => {
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
          zIndex: 200
        }}
      >
        <div 
          style={{
            backgroundColor: '#1e293b',
            borderRadius: '0.75rem',
            padding: '2rem',
            width: '90%',
            maxWidth: '400px',
            color: 'white'
          }}
        >
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            color: '#22c55e',
            textAlign: 'center'
          }}>
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
                  fontSize: '1rem'
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
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between'
            }}>
              <button
                type="button"
                onClick={onCancel}
                style={{
                  backgroundColor: '#4b5563',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer'
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
                  cursor: 'pointer'
                }}
              >
                Join
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
            cursor: 'pointer'
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
              isActive={player.isActive}
              onSideBetClick={(section) => handleSideBetClick(player.id, section)}
            />
          ) : (
            <div style={{
              width: '120px',
              height: '80px',
              backgroundColor: 'rgba(30, 41, 59, 0.7)',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px dashed #4b5563'
            }}>
              <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Empty Seat</span>
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
      
      {/* BlackjackControls - appears when a player is selected */}
      {selectedPlayer && (
        <div style={{
          position: 'absolute',
          bottom: '5%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          zIndex: 20
        }}>
          <BlackjackControls
            playerStack={players.find(p => p.id === selectedPlayer)?.stack || 0}
            onBetSubmit={handleBetSubmit}
            onAction={handleAction}
            gamePhase="betting" // Start in betting phase
            canDouble={true}
            canSplit={false}
            canSurrender={true}
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