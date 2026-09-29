
import React from 'react';
import './dashboard.css';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", type = "danger" }) {
    if (!isOpen) return null;

    return (
        <div className="confirm-overlay" onClick={onCancel}>
            <div className="confirm-modal" onClick={e => e.stopPropagation()}>
                <div className="confirm-title">{title}</div>
                <div className="confirm-message">{message}</div>
                <div className="confirm-actions">
                    <button className="btn-cancel" onClick={onCancel}>{cancelText}</button>
                    <button className={`btn-confirm ${type === 'danger' ? 'danger' : 'primary'}`} onClick={onConfirm} style={type === 'primary' ? { background: 'var(--accent-primary)', color: '#0a0a0a' } : {}}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
