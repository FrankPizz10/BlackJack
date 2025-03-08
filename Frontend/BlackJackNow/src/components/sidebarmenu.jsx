import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, ChevronRight, User, Settings, BookOpen, Users, Wallet } from 'lucide-react';

const SidebarMenu = ({ onOptionClick, onLeaveSeat, onAway }) => {
  const [optionsOpen, setOptionsOpen] = useState(false);

  const menuOptions = [
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'ledger', label: 'Ledger', icon: Wallet },
    { id: 'rules', label: 'Rules', icon: BookOpen },
    { id: 'players', label: 'Players', icon: Users }
  ];

  // Common button styles
  const buttonStyle = {
    width: '3rem',
    height: '3rem',
    backgroundColor: '#1e293b',
    borderRadius: '0.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s'
  };

  const buttonTextStyle = {
    fontSize: '0.75rem',
    color: '#94a3b8',
    marginTop: '0.25rem'
  };

  const iconStyle = {
    width: '1.5rem',
    height: '1.5rem',
    color: '#cbd5e1'
  };

  const dropdownButtonStyle = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    paddingLeft: '0.75rem',
    paddingRight: '0.75rem',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    color: '#cbd5e1',
    borderRadius: '0.5rem',
    transition: 'background-color 0.2s'
  };

  const dropdownIconStyle = {
    width: '1rem',
    height: '1rem'
  };

  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 0,
      backgroundColor: '#0f172a',
      borderTopRightRadius: '0.75rem',
      borderBottomRightRadius: '0.75rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      zIndex: 50
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '0.5rem',
        gap: '1rem'
      }}>
        {/* Away Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAway}
          style={buttonStyle}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#334155';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#1e293b';
          }}
        >
          <User style={iconStyle} />
          <span style={buttonTextStyle}>AWAY</span>
        </motion.button>

        {/* Leave Seat Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onLeaveSeat}
          style={buttonStyle}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#334155';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#1e293b';
          }}
        >
          <ChevronRight style={iconStyle} />
          <span style={{
            ...buttonTextStyle,
            textAlign: 'center',
            lineHeight: '1'
          }}>LEAVE SEAT</span>
        </motion.button>

        {/* Options Button with Dropdown */}
        <div style={{ position: 'relative' }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOptionsOpen(!optionsOpen)}
            style={buttonStyle}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#334155';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#1e293b';
            }}
          >
            <Menu style={iconStyle} />
            <span style={buttonTextStyle}>OPTIONS</span>
          </motion.button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {optionsOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: 10 }}
                style={{
                  position: 'absolute',
                  left: '100%',
                  top: 0,
                  marginLeft: '0.5rem',
                  backgroundColor: '#1e293b',
                  borderRadius: '0.5rem',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  padding: '0.5rem',
                  width: '10rem'
                }}
              >
                {menuOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <motion.button
                      key={option.id}
                      whileHover={{ scale: 1.02, x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onOptionClick(option.id);
                        setOptionsOpen(false);
                      }}
                      style={dropdownButtonStyle}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#334155';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Icon style={dropdownIconStyle} />
                      <span style={{ fontSize: '0.875rem' }}>{option.label}</span>
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SidebarMenu;