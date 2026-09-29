import { useState } from 'react';
import { client } from '../sanityClient';
import LoadingOverlay from './LoadingOverlay';
import ConfirmDialog from './ConfirmDialog';

export default function MessagesViewer({ messages, showToast, onRefresh }) {
    const [processing, setProcessing] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState(null);

    const requestDelete = (id) => {
        setConfirmConfig({
            type: 'delete',
            title: 'Delete Message',
            message: 'Are you sure you want to delete this message? This action cannot be undone.',
            action: () => performDelete(id)
        });
    };

    const performDelete = async (id) => {
        setProcessing(true);
        try {
            await client.delete(id);
            showToast('Message deleted', 'success');
            await onRefresh();
        } catch (err) {
            console.error(err);
            showToast('Failed to delete: ' + err.message, 'error');
        } finally {
            setProcessing(false);
            setConfirmConfig(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="editor-section" style={{ position: 'relative', minHeight: '200px' }}>
            {processing && <LoadingOverlay text="Processing..." />}
            <ConfirmDialog
                isOpen={!!confirmConfig}
                title={confirmConfig?.title}
                message={confirmConfig?.message}
                confirmText={confirmConfig?.confirmText || 'Delete'}
                type="danger"
                onConfirm={confirmConfig?.action}
                onCancel={() => setConfirmConfig(null)}
            />

            <h3>Inbox ({messages.length})</h3>

            {messages.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <p>No messages yet.</p>
                </div>
            ) : (
                <div className="messages-grid">
                    {messages.map(msg => (
                        <div key={msg._id} className="message-card">
                            <div className="message-header">
                                <div className="message-user">
                                    <div className="message-avatar-circle">
                                        {msg.name ? msg.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div className="message-info">
                                        <h4 className="message-name">{msg.name || 'Anonymous'}</h4>
                                        <p className="message-email" title={msg.email}>{msg.email}</p>
                                    </div>
                                </div>
                                <div className="message-meta-actions">
                                    <span className="message-date">
                                        {formatDate(msg._createdAt)}
                                    </span>
                                    <button className="icon-btn delete" onClick={() => requestDelete(msg._id)} title="Delete Message">🗑</button>
                                </div>
                            </div>

                            <div className="message-body-content">
                                {msg.message}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
