
import React from 'react';
import './dashboard.css';

export default function LoadingOverlay({ text = 'Updating...' }) {
    return (
        <div className="processing-overlay">
            <div className="loading-card">
                <div className="loading-spinner"></div>
                <span className="processing-text">{text}</span>
            </div>
        </div>
    );
}
