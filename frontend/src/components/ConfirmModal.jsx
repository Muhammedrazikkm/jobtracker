import React from 'react';

const ConfirmModal = ({ message, onConfirm, onCancel, icon = '❓', btnText = 'Confirm Action', isDestructive = true }) => {
  if (!message) return null;

  const btnStyle = isDestructive 
    ? { marginTop: 0, width: 'auto', background: 'linear-gradient(to right, #ef4444, #dc2626)' }
    : { marginTop: 0, width: 'auto' };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{icon}</div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Are you sure?</h3>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>{message}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn-logout" style={{ marginTop: 0, width: 'auto' }} onClick={onCancel}>Cancel</button>
          <button className="btn-primary" style={btnStyle} onClick={onConfirm}>
            {btnText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
