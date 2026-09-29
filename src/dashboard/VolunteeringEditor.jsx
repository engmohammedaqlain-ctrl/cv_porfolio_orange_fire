import { useState } from 'react';
import { client } from '../sanityClient';
import LoadingOverlay from './LoadingOverlay';
import ConfirmDialog from './ConfirmDialog';
import AddItemDialog from './AddItemDialog';

export default function VolunteeringEditor({ volunteering, showToast, onRefresh }) {
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({});
    const [processing, setProcessing] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState(null);
    const [addItemConfig, setAddItemConfig] = useState(null);

    const startEdit = (item) => { setEditingId(item._id); setFormData({ ...item }); };
    const cancelEdit = () => { setEditingId(null); setFormData({}); };
    const onChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setProcessing(true);
        try {
            await client
                .patch(editingId)
                .set({ role: formData.role, org: formData.org, date: formData.date, desc: formData.desc })
                .commit();
            setEditingId(null);
            showToast('Volunteering updated', 'success');
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
            message: 'Are you sure you want to delete this volunteering catalog?',
            action: () => performDelete(id)
        });
    };

    const requestAdd = () => {
        setAddItemConfig({
            title: 'Add Volunteering Catalog',
            fields: [
                { name: 'role', label: 'Role', placeholder: 'e.g. Volunteer', autoFocus: true, props: { required: true } },
                { name: 'org', label: 'Organization', placeholder: 'e.g. Red Cross', props: { required: true } },
                { name: 'date', label: 'Date', placeholder: 'e.g. 2024', props: { required: true } },
                { name: 'desc', label: 'Description', type: 'textarea', placeholder: 'Describe your role...' }
            ],
            confirmText: 'Create Catalog',
            action: performAdd
        });
    };

    const performDelete = async (id) => {
        setProcessing(true);
        try {
            await client.delete(id);
            showToast('Volunteering catalog deleted', 'success');
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
                _type: 'volunteering',
                role: data.role || 'New Role',
                org: data.org || 'Organization',
                date: data.date || '',
                desc: data.desc || '',
                order: volunteering.length + 1,
            });
            showToast('Volunteering catalog created', 'success');
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

            <h3>Volunteering Catalog</h3>
            {volunteering.map(item => (
                <div key={item._id} className="list-item">
                    {editingId === item._id ? (
                        <div className="editor-form" style={{ width: '100%', padding: '1rem' }}>
                            <div className="editor-group"><label>Role</label>
                                <input name="role" className="editor-input" value={formData.role} onChange={onChange} /></div>
                            <div className="editor-group"><label>Organization</label>
                                <input name="org" className="editor-input" value={formData.org} onChange={onChange} /></div>
                            <div className="editor-group"><label>Date Range</label>
                                <input name="date" className="editor-input" value={formData.date} onChange={onChange} /></div>
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
                                <h4>{item.role} @ {item.org}</h4>
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
