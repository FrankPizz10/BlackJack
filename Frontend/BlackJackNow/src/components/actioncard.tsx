import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BettingCard from './bettingcard';
import { GamePhase } from '../utils/gameAction';
import { UserSeat } from '@shared-types/db/UserSeat';

interface ActionCardProps {
  onAction: (action: string) => void;
  canDouble: boolean;
  canSplit: boolean;
  canSurrender: boolean;
  isVisible: boolean;
}

const buttonBaseStyle = {
  color: 'white',
  fontWeight: 500,
  borderRadius: '0.5rem',
  transition: 'background-color 0.2s',
};

const ActionCard: React.FC<ActionCardProps> = ({
  onAction,
  canDouble = true,
  canSplit = false,
  canSurrender = true,
  isVisible,
}) => {
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
              onClick={() => onAction('Double Down')}
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
              onClick={() => onAction('Hit')}
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
              onClick={() => onAction('Stand')}
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
                onClick={() => onAction('Split')}
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
  selectedSeat: UserSeat | null;
  playerStack: number;
  onBetSubmit: (amount: number) => void;
  onAction: (action: string) => void;
  gamePhase?: GamePhase;
  canDouble: boolean;
  canSplit: boolean;
  canSurrender: boolean;
}

// Container component to manage the transition between betting and actions
const BlackjackControls: React.FC<BlackjackControlsProps> = ({
  selectedSeat,
  playerStack,
  onBetSubmit,
  onAction,
  gamePhase = GamePhase.Betting,
  canDouble,
  canSplit,
  canSurrender,
}) => {
  const [previousPhase, setPreviousPhase] = useState(gamePhase);
  const [isTransitioning, setIsTransitioning] = useState(false);

  console.log({ gamePhase, selectedSeat, isTransitioning });

  useEffect(() => {
    if (gamePhase !== previousPhase) {
      setIsTransitioning(true);
      setPreviousPhase(gamePhase);

      const timeout = setTimeout(() => {
        setIsTransitioning(false);
      }, 300);

      return () => clearTimeout(timeout);
    }
  }, [gamePhase, previousPhase]);

  const renderPhaseComponent = () => {
    if (!selectedSeat) return null;

    switch (gamePhase) {
      case GamePhase.Betting:
        return (
          <motion.div
            key="betting"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <BettingCard
              playerStack={playerStack}
              onBetSubmit={(amount) => {
                setIsTransitioning(true);
                onBetSubmit(amount);
              }}
            />
          </motion.div>
        );
      case GamePhase.Action:
        return (
          <motion.div
            key="action"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <ActionCard
              isVisible={true}
              onAction={onAction}
              canDouble={canDouble}
              canSplit={canSplit}
              canSurrender={canSurrender}
            />
          </motion.div>
        );
      case GamePhase.RoundOver:
        return (
          <motion.div
            key="roundover"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ textAlign: 'center', padding: '1rem', color: '#fff' }}
          >
            <h2>Round Over</h2>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onAction('Reset')}
              style={{
                ...buttonBaseStyle,
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
              RESET
            </motion.button>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
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
      <AnimatePresence mode="wait">{renderPhaseComponent()}</AnimatePresence>
    </div>
  );
};

export default BlackjackControls;

