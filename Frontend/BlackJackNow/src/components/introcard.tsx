import React from 'react';

interface IntroCard {
  onClose: () => void;
}

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
        Click on an empty seat to join the table. Each player starts with their
        own stack. Play responsibly and good luck!
      </p>
      <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        <strong>Tip:</strong> To place a bet, select your position, click on a
        section of the betting circle (center or sides), then choose your bet
        amount.
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
        Create Room
      </button>
    </div>
  );
};

export default IntroCard;

