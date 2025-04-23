import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface BettingCircleProps {
  mainBet: number;
  sideBets: { [key: string]: number };
  isActive: boolean;
  onSectionClick: (section: string) => void;
  selectedSection?: string | null;
}

const BettingCircle: React.FC<BettingCircleProps> = ({
  mainBet,
  sideBets,
  isActive,
  onSectionClick,
  selectedSection,
}) => {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const mainRadius = 30;
  const sideBetRadius = 15;
  const centerX = 75;
  const centerY = 75;
  const distanceFromCenter = 55;

  const sideBetPositions = {
    top: { x: centerX, y: centerY - distanceFromCenter },
    right: { x: centerX + distanceFromCenter, y: centerY },
    bottom: { x: centerX, y: centerY + distanceFromCenter },
    left: { x: centerX - distanceFromCenter, y: centerY },
  };

  const hasBet = (section: string) => {
    if (section === 'center') return mainBet > 0;
    return sideBets[section] > 0;
  };

  const isSectionClickable = (section: string) => {
    return !hasBet(section);
  };

  const getHighlightColor = (section: string) => {
    if (hasBet(section)) {
      return '#4ade80'; // Green for sections with bets
    }
    if (section === selectedSection) {
      return '#4ade80'; // Green for selected section
    }
    return hoveredSection === section ? '#334155' : '#1e293b';
  };

  const formatBetAmount = (amount: number) => {
    if (amount === 0) return '$0';
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount}`;
  };

  const handleClick = (section: string) => {
    if (isSectionClickable(section)) {
      onSectionClick(section);
    }
  };

  return (
    <div style={{ position: 'relative', width: '12rem', height: '12rem' }}>
      <motion.svg
        viewBox="0 0 150 150"
        style={{ width: '100%', height: '100%' }}
      >
        {isActive && (
          <motion.circle
            cx={centerX}
            cy={centerY}
            r={mainRadius + 2}
            fill="none"
            stroke="#4ade80"
            strokeWidth="2"
            strokeDasharray={2 * Math.PI * (mainRadius + 2)}
            initial={{ strokeDashoffset: 2 * Math.PI * (mainRadius + 2) }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{ opacity: 0.5 }}
          />
        )}

        {/* Main betting circle */}
        <motion.circle
          cx={centerX}
          cy={centerY}
          r={mainRadius}
          fill={getHighlightColor('center')}
          stroke="#475569"
          strokeWidth="2"
          style={{
            cursor: isSectionClickable('center') ? 'pointer' : 'not-allowed',
          }}
          onMouseEnter={() =>
            isSectionClickable('center') && setHoveredSection('center')
          }
          onMouseLeave={() => setHoveredSection(null)}
          onClick={() => handleClick('center')}
          whileHover={isSectionClickable('center') ? { scale: 1.05 } : {}}
          whileTap={isSectionClickable('center') ? { scale: 0.95 } : {}}
        />

        <text
          key={`mainBet-${mainBet}`} // Add key to force re-render
          x={centerX}
          y={centerY + 5}
          textAnchor="middle"
          style={{
            fill: 'white',
            fontSize: mainBet >= 1000 ? '0.875rem' : '1rem',
            fontWeight: 'bold',
            pointerEvents: 'none',
          }}
        >
          {formatBetAmount(mainBet)}
        </text>

        {/* Side bet circles */}
        {Object.entries(sideBetPositions).map(([section, pos]) => (
          <g key={section}>
            <motion.circle
              cx={pos.x}
              cy={pos.y}
              r={sideBetRadius}
              fill={getHighlightColor(section)}
              stroke="#475569"
              strokeWidth="2"
              style={{
                cursor: isSectionClickable(section) ? 'pointer' : 'not-allowed',
              }}
              onMouseEnter={() =>
                isSectionClickable(section) && setHoveredSection(section)
              }
              onMouseLeave={() => setHoveredSection(null)}
              onClick={() => handleClick(section)}
              whileHover={isSectionClickable(section) ? { scale: 1.05 } : {}}
              whileTap={isSectionClickable(section) ? { scale: 0.95 } : {}}
            />
            <text
              key={`sideBet-${section}-${sideBets[section] || 0}`} // Add key to force re-render
              x={pos.x}
              y={pos.y + 4}
              textAnchor="middle"
              style={{
                fill: 'white',
                fontSize: '0.875rem',
                pointerEvents: 'none',
              }}
            >
              {formatBetAmount(sideBets[section] || 0)}
            </text>
          </g>
        ))}
      </motion.svg>
    </div>
  );
};

type Card = {
  image: string;
  value: string;
};

interface PlayerCardsProps {
  cards: Card[];
  count: number;
}

const PlayerCards: React.FC<PlayerCardsProps> = ({ cards, count }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '1rem',
      }}
    >
      <div style={{ display: 'flex' }}>
        {cards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0, x: -20 }}
            animate={{ scale: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            style={{
              width: '4rem',
              height: '6rem',
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow:
                '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: index !== cards.length - 1 ? '-1rem' : 0,
            }}
          >
            <img
              src={card.image}
              alt={card.value}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          marginTop: '0.5rem',
          backgroundColor: '#1e293b',
          paddingLeft: '1rem',
          paddingRight: '1rem',
          paddingTop: '0.25rem',
          paddingBottom: '0.25rem',
          borderRadius: '0.5rem',
        }}
      >
        <span style={{ color: 'white', fontWeight: 500 }}>Count: {count}</span>
      </motion.div>
    </div>
  );
};

interface PlayerPositionProps {
  username?: string;
  mainBet?: number;
  sideBets?: { [key: string]: number };
  cards?: Card[];
  count?: number;
  isActive?: boolean;
  onSectionClick?: (section: string) => void;
  selectedSection?: string | null;
  onBetPlaced?: (section: string, amount: number) => void; // New prop for handling bet placement
}

const PlayerPosition: React.FC<PlayerPositionProps> = ({
  username = 'PlayerOne123',
  mainBet = 0,
  sideBets = {},
  cards = [],
  count = 0,
  isActive = false,
  onSectionClick,
  selectedSection = null,
}) => {
  const handleSectionClick = (section: string) => {
    if (onSectionClick) {
      onSectionClick(section);
    }
  };

  return (
    <motion.div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PlayerCards cards={cards} count={count} />

      <BettingCircle
        mainBet={mainBet}
        sideBets={sideBets}
        isActive={isActive}
        onSectionClick={handleSectionClick}
        selectedSection={selectedSection}
      />

      <motion.div
        style={{
          marginTop: '1rem',
          backgroundColor: '#1e293b',
          paddingLeft: '2rem',
          paddingRight: '2rem',
          paddingTop: '0.75rem',
          paddingBottom: '0.75rem',
          borderRadius: '0.5rem',
          boxShadow:
            '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <span style={{ color: 'white', fontWeight: 500, fontSize: '1.125rem' }}>
          {username}
        </span>
      </motion.div>
    </motion.div>
  );
};

export default PlayerPosition;
