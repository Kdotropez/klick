import React from 'react';
import '../styles/Modal.css';

const Modal = ({ isOpen, onClose, onConfirm, message, style }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={style}>
        <div>{message}</div>
        <div className="modal-buttons">
          <button
            className="modal-btn confirm"
            onClick={() => {
              console.log('Modal: onConfirm triggered, message:', typeof message === 'string' ? message : 'Custom content');
              onConfirm();
            }}
          >
            Oui
          </button>
          <button
            className="modal-btn cancel"
            onClick={() => {
              console.log('Modal: onClose triggered, message:', typeof message === 'string' ? message : 'Custom content');
              onClose();
            }}
          >
            Non
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;