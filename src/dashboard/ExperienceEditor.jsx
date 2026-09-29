import { useState } from 'react';
import { client } from '../sanityClient';
import LoadingOverlay from './LoadingOverlay';
import ConfirmDialog from './ConfirmDialog';
import AddItemDialog from './AddItemDialog';

export default function ExperienceEditor({ experience, showToast, onRefresh }) {
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({});
    const [processing, setProcessing] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState(null);
    const [addItemConfig, setAddItemConfig] = useState(null);

    const startEdit = (item) => { setEditingId(item._id); setFormData({ ...item }); };
    const cancelEdit = () => { setEditingId(null); setFormData({}); };
    const onChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSave = async () => {
        setProcessing(true);
        try {
            await client
                .patch(editingId)
                .set({ role: formData.role, company: formData.company, date: formData.date, desc: formData.desc, isCurrent: formData.isCurrent })
                .commit();
            setEditingId(null);
            showToast('Experience updated', 'success');
            await onRefresh();
        } catch (err) {
            console.error(err);
            showToast('Failed to update: ' + err.message, 'error');
        } finally {
            setProcessing(false);
        }
    };

    const requestDelete = (id) => {
        setConfirmConfig({
            type: 'delete',
            title: 'Delete Catalog',
            message: 'Are you sure you want to delete this experience catalog? This action cannot be undone.',
            action: () => performDelete(id)
        });
    };

    const requestAdd = () => {
        setAddItemConfig({
            title: 'Add Experience Catalog',
            fields: [
                { name: 'role', label: 'Job Title', placeholder: 'e.g. Senior Developer', autoFocus: true, props: { required: true } },
                { name: 'company', label: 'Company', placeholder: 'e.g. Acme Corp', props: { required: true } },
                { name: 'date', label: 'Date Range', placeholder: 'e.g. 2024 - Present', props: { required: true } },
                { name: 'desc', label: 'Description', type: 'textarea', placeholder: 'Describe your responsibilities...' }
            ],
            confirmText: 'Create Catalog',
            action: performAdd
        });
    };

    const performDelete = async (id) => {
        setProcessing(true);
        try {
            await client.delete(id);
            showToast('Experience catalog deleted', 'success');
            await onRefresh();
        } catch (err) {
            console.error(err);
            showToast('Failed to delete: ' + err.message, 'error');
        } finally {
            setProcessing(false);
            setConfirmConfig(null);
        }
    };

    const performAdd = async (data) => {
        setProcessing(true);
        try {
            await client.create({
                _type: 'experience',
                role: data.role || 'New Role',
                company: data.company || 'Company',
                date: data.date || '',
                desc: data.desc || '',
                isCurrent: data.isCurrent || false,
                order: experience.length + 1,
            });
            showToast('Experience catalog created', 'success');
            await onRefresh();
        } catch (err) {
            console.error(err);
            showToast('Failed to create: ' + err.message, 'error');
        } finally {
            setProcessing(false);
            setAddItemConfig(null);
        }
    };

    return (
        <div className="editor-section" style={{ position: 'relative', minHeight: '200px' }}>
            {processing && <LoadingOverlay text="Processing..." />}
            <ConfirmDialog
                isOpen={!!confirmConfig}
                title={confirmConfig?.title}
                message={confirmConfig?.message}
                confirmText={confirmConfig?.confirmText || 'Delete'}
                type={confirmConfig?.type === 'add' ? 'primary' : 'danger'}
                onConfirm={confirmConfig?.action}
                onCancel={() => setConfirmConfig(null)}
            />

            <AddItemDialog
                isOpen={!!addItemConfig}
                title={addItemConfig?.title}
                fields={addItemConfig?.fields}
                confirmText={addItemConfig?.confirmText}
                onConfirm={addItemConfig?.action}
                onCancel={() => setAddItemConfig(null)}
            />

            <h3>Experience Catalog</h3>
            {experience.map(item => (
                <div key={item._id} className="list-item">
                    {editingId === item._id ? (
                        <div className="editor-form" style={{ width: '100%', padding: '1rem' }}>
                            <div className="editor-group"><label>Job Title</label>
                                <input name="role" className="editor-input" value={formData.role} onChange={onChange} /></div>
                            <div className="editor-group"><label>Company</label>
                                <input name="company" className="editor-input" value={formData.company} onChange={onChange} /></div>
                            <div className="editor-group"><label>Date Range</label>
                                <input name="date" className="editor-input" value={formData.date} onChange={onChange} /></div>
                            <div className="editor-group">
                                <label><input name="isCurrent" type="checkbox" checked={formData.isCurrent} onChange={onChange} /> Current Role</label>
                            </div>
                            <div className="editor-group"><label>Description</label>
                                <textarea name="desc" className="editor-textarea" value={formData.desc} onChange={onChange} /></div>
                            <div className="list-actions">
                                <button className="save-btn" onClick={handleSave} style={{ marginTop: 0, padding: '0.5rem 1rem' }}>Save</button>
                                <button className="icon-btn delete" onClick={cancelEdit}>✕</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="list-item-content">
                                <h4>{item.role} @ {item.company}</h4>
                                <p>{item.date}</p>
                            </div>
                            <div className="list-actions">
                                <button className="icon-btn" onClick={() => startEdit(item)}>✎</button>
                                <button className="icon-btn delete" onClick={() => requestDelete(item._id)}>🗑</button>
                            </div>
                        </>
                    )}
                </div>
            ))}
            <button className="add-btn" onClick={requestAdd}>+ Add Catalog</button>
        </div>
    );
}
