import React, { useState, useEffect } from 'react';

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

export default JoinTableForm;
