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

  // Increase the radius of the outer circle to create more space for sidebets
  const outerRadius = 55; // Increased from 50
  const circumference = 2 * Math.PI * outerRadius;

  // SVG paths for the four sections - using the larger radius now
  const sections = {
    top: `M 60 60 L 60 ${60 - outerRadius} A ${outerRadius} ${outerRadius} 0 0 1 ${60 + outerRadius} 60 Z`,
    right: `M 60 60 L ${60 + outerRadius} 60 A ${outerRadius} ${outerRadius} 0 0 1 60 ${60 + outerRadius} Z`,
    bottom: `M 60 60 L 60 ${60 + outerRadius} A ${outerRadius} ${outerRadius} 0 0 1 ${60 - outerRadius} 60 Z`,
    left: `M 60 60 L ${60 - outerRadius} 60 A ${outerRadius} ${outerRadius} 0 0 1 60 ${60 - outerRadius} Z`,
  };

  // Update positions for side bet amounts - moved further away from center
  const betPositions = {
    top: { x: 60, y: 30 },    // Moved up more
    right: { x: 90, y: 60 },  // Moved right more
    bottom: { x: 60, y: 90 }, // Moved down more
    left: { x: 30, y: 60 },   // Moved left more
  };

  // Function to get highlight color based on selected and hovered section
  const getHighlightColor = (section: string) => {
    if (selectedSection === section) {
      return "#4ade80"; // Green highlight for selected section
    }
    return hoveredSection === section ? '#334155' : '#1e293b';
  };

  return (
    <div style={{ position: 'relative', width: '12rem', height: '12rem' }}>
      <motion.svg
        viewBox="0 0 120 120"
        style={{ width: '100%', height: '100%' }}
        initial="initial"
        animate="animate"
      >
        {/* Highlight ring for active player */}
        {isActive && (
          <motion.circle
            cx="60"
            cy="60"
            r={outerRadius}
            fill="none"
            stroke="#4ade80"
            strokeWidth="2"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{ opacity: 0.5 }}
          />
        )}

        {/* Outer betting circle sections */}
        {Object.entries(sections).map(([section, path]) => (
          <motion.path
            key={section}
            d={path}
            style={{
              fill: getHighlightColor(section),
              stroke: '#475569',
              cursor: 'pointer',
              transition: 'fill 0.2s',
            }}
            strokeWidth="2"
            onMouseEnter={() => setHoveredSection(section)}
            onMouseLeave={() => setHoveredSection(null)}
            onClick={() => onSectionClick(section)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          />
        ))}

        {/* Inner circle base (middle layer) */}
        <circle
          cx="60"
          cy="60"
          r="30" // Reduced slightly from 35
          style={{ 
            fill: getHighlightColor("center"),
            stroke: '#475569', 
            strokeWidth: 2,
            cursor: 'pointer'
          }}
          onClick={() => onSectionClick("center")}
          onMouseEnter={() => setHoveredSection("center")}
          onMouseLeave={() => setHoveredSection(null)}
        />

        {/* Inner circle overlay (smallest) */}
        <circle
          cx="60"
          cy="60"
          r="22" // Reduced slightly from 25
          style={{ 
            fill: '#1e293b', 
            stroke: '#475569', 
            strokeWidth: 2,
            cursor: 'pointer'
          }}
          onClick={() => onSectionClick("center")}
        />

        {/* Main bet amount */}
        <text
          x="60"
          y="65"
          textAnchor="middle"
          style={{ fill: 'white', fontSize: '1.125rem', fontWeight: 'bold', pointerEvents: 'none' }}
        >
          ${mainBet}
        </text>

        {/* Side bet amounts - now with background for better visibility */}
        {Object.entries(betPositions).map(([section, pos]) =>
          sideBets[section] ? (
            <g key={section} style={{ pointerEvents: 'none' }}>
              {/* Small circle background for better visibility */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r="11"
                style={{ fill: '#334155', stroke: '#475569', strokeWidth: 1 }}
              />
              <motion.text
                x={pos.x}
                y={pos.y + 3} // Adjusted for vertical centering
                textAnchor="middle"
                style={{ fill: 'white', fontSize: '0.875rem' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                ${sideBets[section]}
              </motion.text>
            </g>
          ) : null
        )}
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
  onSideBetClick?: (section: string) => void;
  onSectionClick?: (section: string) => void;
  selectedSection?: string | null;
}

const PlayerPosition: React.FC<PlayerPositionProps> = ({
  username = 'PlayerOne123',
  mainBet = 0,
  sideBets = {},
  cards = [],
  count = 0,
  isActive = false,
  onSideBetClick = () => {}, // Keep for backward compatibility
  onSectionClick, // New prop for section selection
  selectedSection = null,
}) => {
  // Use the new onSectionClick if provided, otherwise fall back to onSideBetClick
  const handleSectionClick = (section: string) => {
    if (onSectionClick) {
      onSectionClick(section);
    } else {
      onSideBetClick(section);
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