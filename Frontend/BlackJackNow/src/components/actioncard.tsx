import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BettingCard from './bettingcard';

interface ActionCardProps {
  onAction: (action: string) => void;
  canDouble: boolean;
  canSplit: boolean;
  canSurrender: boolean;
  isVisible: boolean;
}

const ActionCard: React.FC<ActionCardProps> = ({
  onAction,
  canDouble = true,
  canSplit = false,
  canSurrender = true,
  isVisible,
}) => {
  const buttonBaseStyle = {
    color: 'white',
    fontWeight: 500,
    borderRadius: '0.5rem',
    transition: 'background-color 0.2s',
  };

  const disabledButtonStyle = {
    opacity: 0.5,
    cursor: 'not-allowed',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            backgroundColor: '#0f172a',
            padding: '1rem',
            borderRadius: '0.75rem',
            boxShadow:
              '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            width: '100%',
            maxWidth: '56rem',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '0.75rem',
            }}
          >
            {/* Double */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!canDouble}
              onClick={() => onAction('double')}
              style={{
                ...buttonBaseStyle,
                gridColumn: 'span 1 / span 1',
                backgroundColor: '#334155',
                padding: '0.75rem 0',
                ...(canDouble ? {} : disabledButtonStyle),
              }}
              onMouseOver={(e) => {
                if (canDouble)
                  e.currentTarget.style.backgroundColor = '#475569';
              }}
              onMouseOut={(e) => {
                if (canDouble)
                  e.currentTarget.style.backgroundColor = '#334155';
              }}
            >
              Double
            </motion.button>

            {/* Hit */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onAction('hit')}
              style={{
                ...buttonBaseStyle,
                gridColumn: 'span 2 / span 2',
                backgroundColor: '#475569',
                padding: '0.75rem 0',
                fontSize: '1.125rem',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#64748b';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#475569';
              }}
            >
              HIT
            </motion.button>

            {/* Stand */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onAction('stand')}
              style={{
                ...buttonBaseStyle,
                gridColumn: 'span 2 / span 2',
                backgroundColor: '#475569',
                padding: '0.75rem 0',
                fontSize: '1.125rem',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#64748b';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#475569';
              }}
            >
              STAND
            </motion.button>

            {/* Surrender */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={!canSurrender}
              onClick={() => onAction('surrender')}
              style={{
                ...buttonBaseStyle,
                gridColumn: 'span 1 / span 1',
                backgroundColor: '#334155',
                padding: '0.75rem 0',
                ...(canSurrender ? {} : disabledButtonStyle),
              }}
              onMouseOver={(e) => {
                if (canSurrender)
                  e.currentTarget.style.backgroundColor = '#475569';
              }}
              onMouseOut={(e) => {
                if (canSurrender)
                  e.currentTarget.style.backgroundColor = '#334155';
              }}
            >
              Surrender
            </motion.button>

            {/* Split - Conditionally rendered */}
            {canSplit && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAction('split')}
                style={{
                  ...buttonBaseStyle,
                  gridColumn: 'span 1 / span 1',
                  backgroundColor: '#334155',
                  padding: '0.75rem 0',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#475569';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#334155';
                }}
              >
                Split
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface BlackjackControlsProps {
  playerStack: number;
  onBetSubmit: (amount: number) => void;
  onAction: (action: string) => void;
  gamePhase?: 'betting' | 'action';
  canDouble: boolean;
  canSplit: boolean;
  canSurrender: boolean;
}

// Container component to manage the transition between betting and actions
const BlackjackControls: React.FC<BlackjackControlsProps> = ({
  playerStack,
  onBetSubmit,
  onAction,
  gamePhase = 'betting', // 'betting' or 'action'
  canDouble,
  canSplit,
  canSurrender,
}) => {
  const [previousPhase, setPreviousPhase] = useState(gamePhase);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (gamePhase !== previousPhase) {
      setIsTransitioning(true);
      setPreviousPhase(gamePhase);

      // Allow time for exit animation
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }
  }, [gamePhase, previousPhase]);

  return (
    <div style={{ position: 'relative' }}>
      <AnimatePresence mode="wait">
        {gamePhase === 'betting' && !isTransitioning ? (
          <BettingCard
            playerStack={playerStack}
            onBetSubmit={(amount) => {
              setIsTransitioning(true);
              onBetSubmit(amount);
            }}
          />
        ) : (
          <ActionCard
            isVisible={!isTransitioning}
            onAction={onAction}
            canDouble={canDouble}
            canSplit={canSplit}
            canSurrender={canSurrender}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlackjackControls;

