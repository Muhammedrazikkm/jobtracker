import React from 'react';

const AlertModal = ({ message, onClose, type = 'notice' }) => {
  if (!message) return null;

  const getIcon = () => {
    switch(type) {
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⚠️';
    }
  };

  const getTitle = () => {
    switch(type) {
      case 'success': return 'Success';
      case 'error': return 'Error';
      default: return 'Notice';
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{getIcon()}</div>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>{getTitle()}</h3>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>{message}</p>
        <button className="btn-primary" style={{ marginTop: 0 }} onClick={onClose}>
          Okay
        </button>
      </div>
    </div>
  );
};

export default AlertModal;
