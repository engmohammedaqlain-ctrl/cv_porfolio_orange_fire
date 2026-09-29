import { useState, useCallback } from 'react';

/**
 * useToast — animated notification system for the dashboard.
 * Returns [ToastContainer, showToast] where:
 *   - ToastContainer is a React element to render in your layout
 *   - showToast(message, type) triggers a notification
 *     type: 'success' | 'error' | 'info'
 */
export function useToast() {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto-dismiss after 3s
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const ToastContainer = (
        <div className="toast-stack">
            {toasts.map(t => (
                <div key={t.id} className={`toast toast--${t.type}`} onClick={() => dismiss(t.id)}>
                    <span className="toast-icon">
                        {t.type === 'success' && '✓'}
                        {t.type === 'error' && '✕'}
                        {t.type === 'info' && 'ℹ'}
                    </span>
                    <span className="toast-msg">{t.message}</span>
                </div>
            ))}
        </div>
    );

    return [ToastContainer, showToast];
}
