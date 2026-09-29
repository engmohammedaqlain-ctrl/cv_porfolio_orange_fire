import React, { useState } from 'react';
import './dashboard.css';

export default function AddItemDialog({ isOpen, title, fields, onConfirm, onCancel, confirmText = "Add Item" }) {
    // Initial state based on fields defaults
    const [formData, setFormData] = useState(() => {
        const initial = {};
        fields?.forEach(f => {
            initial[f.name] = f.defaultValue !== undefined ? f.defaultValue : '';
        });
        return initial;
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(formData);
    };

    return (
        <div className="confirm-overlay" onClick={onCancel}>
            <div className="confirm-modal add-item-modal" onClick={e => e.stopPropagation()}>
                <div className="confirm-title">{title}</div>

                <form onSubmit={handleSubmit} className="add-item-form">
                    {fields.map(field => (
                        <div key={field.name} className="editor-group">
                            <label>{field.label}</label>
                            {field.type === 'textarea' ? (
                                <textarea
                                    name={field.name}
                                    className="editor-textarea"
                                    value={formData[field.name]}
                                    onChange={handleChange}
                                    placeholder={field.placeholder}
                                    style={{ minHeight: '80px' }}
                                />
                            ) : field.type === 'checkbox' ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="checkbox"
                                        name={field.name}
                                        checked={formData[field.name]}
                                        onChange={handleChange}
                                        style={{ width: 'auto' }}
                                    />
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                                        {field.placeholder || 'Yes'}
                                    </span>
                                </div>
                            ) : (
                                <input
                                    type={field.type || 'text'}
                                    name={field.name}
                                    className="editor-input"
                                    value={formData[field.name]}
                                    onChange={handleChange}
                                    placeholder={field.placeholder}
                                    autoFocus={field.autoFocus}
                                    {...field.props}
                                />
                            )}
                        </div>
                    ))}

                    <div className="confirm-actions" style={{ marginTop: '1.5rem' }}>
                        <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
                        <button type="submit" className="btn-confirm primary" style={{ background: 'var(--accent-primary)', color: '#0a0a0a' }}>
                            {confirmText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
