import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BettingCircle = ({ mainBet, sideBets, isActive, onSideBetClick }) => {
  const [hoveredSection, setHoveredSection] = useState(null);
  
  // Calculate the circumference for the highlight animation
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  // SVG paths for the four sections
  const sections = {
    top: "M 60 60 L 60 10 A 50 50 0 0 1 110 60 Z",
    right: "M 60 60 L 110 60 A 50 50 0 0 1 60 110 Z",
    bottom: "M 60 60 L 60 110 A 50 50 0 0 1 10 60 Z",
    left: "M 60 60 L 10 60 A 50 50 0 0 1 60 10 Z"
  };

  // Positions for side bet amounts
  const betPositions = {
    top: { x: 60, y: 35 },
    right: { x: 85, y: 65 },
    bottom: { x: 60, y: 95 },
    left: { x: 35, y: 65 }
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
            r={radius}
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
              fill: hoveredSection === section ? '#334155' : '#1e293b',
              stroke: '#475569',
              cursor: 'pointer',
              transition: 'fill 0.2s'
            }}
            strokeWidth="2"
            onMouseEnter={() => setHoveredSection(section)}
            onMouseLeave={() => setHoveredSection(null)}
            onClick={() => onSideBetClick(section)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          />
        ))}

        {/* Inner circle base (larger) */}
        <circle
          cx="60"
          cy="60"
          r="35"
          style={{ fill: '#334155', stroke: '#475569', strokeWidth: 2 }}
        />

        {/* Inner circle overlay (smaller) */}
        <circle
          cx="60"
          cy="60"
          r="25"
          style={{ fill: '#1e293b', stroke: '#475569', strokeWidth: 2 }}
        />

        {/* Main bet amount */}
        <text
          x="60"
          y="65"
          textAnchor="middle"
          style={{ fill: 'white', fontSize: '1.125rem', fontWeight: 'bold' }}
        >
          ${mainBet}
        </text>

        {/* Side bet amounts */}
        {Object.entries(betPositions).map(([section, pos]) => (
          sideBets[section] ? (
            <motion.text
              key={section}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              style={{ fill: 'white', fontSize: '0.875rem' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              ${sideBets[section]}
            </motion.text>
          ) : null
        ))}
      </motion.svg>
    </div>
  );
};

const PlayerCards = ({ cards, count }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
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
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginRight: index !== cards.length - 1 ? '-1rem' : 0
            }}
          >
            <img src={card.image} alt={card.value} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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
          borderRadius: '0.5rem' 
        }}
      >
        <span style={{ color: 'white', fontWeight: 500 }}>Count: {count}</span>
      </motion.div>
    </div>
  );
};

const PlayerPosition = ({
  username = "PlayerOne123",
  mainBet = 0,
  sideBets = {},
  cards = [],
  count = 0,
  isActive = false,
  onSideBetClick = (section) => console.log(`Side bet clicked: ${section}`),
}) => {
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
        onSideBetClick={onSideBetClick}
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
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <span style={{ color: 'white', fontWeight: 500, fontSize: '1.125rem' }}>{username}</span>
      </motion.div>
    </motion.div>
  );
};

export default PlayerPosition;