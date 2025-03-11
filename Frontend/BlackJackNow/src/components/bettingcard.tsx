import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface BettingCardProps {
  onBetSubmit: (betAmount: number) => void;
  playerStack: number;
}

const BettingCard: React.FC<BettingCardProps> = ({
  onBetSubmit,
  playerStack = 0,
}) => {
  const [betAmount, setBetAmount] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);

  const presetMultipliers = [0.5, 2, 5, 10];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setSliderValue(value);
    setBetAmount(Math.round(value * playerStack * 100) / 100);
  };

  const handleMultiplierClick = (multiplier: number | 'max') => {
    if (multiplier === 'max') {
      setSliderValue(1);
      setBetAmount(playerStack);
      return;
    }

    const newAmount = Math.round(betAmount * multiplier * 100) / 100;
    const clampedAmount = Math.min(newAmount, playerStack);
    setBetAmount(clampedAmount);
    setSliderValue(clampedAmount / playerStack);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    const numericValue = parseFloat(value);

    if (isNaN(numericValue)) {
      setBetAmount(0);
      setSliderValue(0);
      return;
    }

    const clampedValue = Math.min(Math.max(numericValue, 0), playerStack);
    setBetAmount(clampedValue);
    setSliderValue(clampedValue / playerStack);
  };

  // Disable betting if player has no stack
  const isBettingDisabled = playerStack <= 0;

  // Common button styles
  const buttonBaseStyle = {
    backgroundColor: '#334155',
    color: 'white',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    paddingLeft: '1rem',
    paddingRight: '1rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    transition: 'background-color 0.2s',
    width: '4rem',
  };

  const disabledButtonStyle = {
    opacity: 0.5,
    cursor: 'not-allowed',
  };

  const placeBetButtonStyle = {
    backgroundColor: '#16a34a',
    color: 'white',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    paddingLeft: '1.5rem',
    paddingRight: '1.5rem',
    borderRadius: '0.5rem',
    fontSize: '1.125rem',
    fontWeight: 700,
    transition: 'background-color 0.2s',
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      style={{
        backgroundColor: '#0f172a',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        boxShadow:
          '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        width: '100%',
        maxWidth: '56rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
        }}
      >
        <div
          style={{
            width: '12rem',
            position: 'relative',
          }}
        >
          <input
            type="text"
            value={`$${betAmount.toFixed(2)}`}
            onChange={handleInputChange}
            disabled={isBettingDisabled}
            style={{
              width: '100%',
              backgroundColor: '#1e293b',
              color: 'white',
              fontSize: '1.25rem',
              fontWeight: 700,
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
              paddingLeft: '1rem',
              paddingRight: '1rem',
              borderRadius: '0.5rem',
              textAlign: 'center',
              ...(isBettingDisabled
                ? { opacity: 0.5, cursor: 'not-allowed' }
                : {}),
            }}
          />
          <div
            style={{
              color: '#94a3b8',
              fontSize: '0.875rem',
              marginTop: '0.25rem',
              textAlign: 'center',
            }}
          >
            Stack: ${playerStack.toFixed(2)}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={sliderValue}
            onChange={handleSliderChange}
            disabled={isBettingDisabled}
            style={{
              flex: 1,
              height: '0.5rem',
              backgroundColor: '#334155',
              borderRadius: '0.5rem',
              appearance: 'none',
              cursor: isBettingDisabled ? 'not-allowed' : 'pointer',
              opacity: isBettingDisabled ? 0.5 : 1,
            }}
          />

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {presetMultipliers.map((multiplier) => (
              <motion.button
                key={multiplier}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleMultiplierClick(multiplier)}
                disabled={isBettingDisabled || betAmount <= 0}
                style={{
                  ...buttonBaseStyle,
                  ...(isBettingDisabled || betAmount <= 0
                    ? disabledButtonStyle
                    : {}),
                }}
                onMouseOver={(e) => {
                  if (!(isBettingDisabled || betAmount <= 0)) {
                    e.currentTarget.style.backgroundColor = '#475569';
                  }
                }}
                onMouseOut={(e) => {
                  if (!(isBettingDisabled || betAmount <= 0)) {
                    e.currentTarget.style.backgroundColor = '#334155';
                  }
                }}
              >
                {multiplier}x
              </motion.button>
            ))}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleMultiplierClick('max')}
              disabled={isBettingDisabled}
              style={{
                ...buttonBaseStyle,
                ...(isBettingDisabled ? disabledButtonStyle : {}),
              }}
              onMouseOver={(e) => {
                if (!isBettingDisabled) {
                  e.currentTarget.style.backgroundColor = '#475569';
                }
              }}
              onMouseOut={(e) => {
                if (!isBettingDisabled) {
                  e.currentTarget.style.backgroundColor = '#334155';
                }
              }}
            >
              Max
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onBetSubmit(betAmount)}
            disabled={isBettingDisabled || betAmount <= 0}
            style={{
              ...placeBetButtonStyle,
              ...(isBettingDisabled || betAmount <= 0
                ? disabledButtonStyle
                : {}),
            }}
            onMouseOver={(e) => {
              if (!(isBettingDisabled || betAmount <= 0)) {
                e.currentTarget.style.backgroundColor = '#22c55e';
              }
            }}
            onMouseOut={(e) => {
              if (!(isBettingDisabled || betAmount <= 0)) {
                e.currentTarget.style.backgroundColor = '#16a34a';
              }
            }}
          >
            Place Bet
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default BettingCard;

