import React from 'react';
import '../styles/Modal.css';

const Modal = ({ isOpen, onClose, onConfirm, message, style }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={style}>
        {message}
        <div className="modal-buttons">
          <button onClick={onClose} className="modal-btn cancel">
            Annuler
          </button>
          <button onClick={onConfirm} className="modal-btn confirm">
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;