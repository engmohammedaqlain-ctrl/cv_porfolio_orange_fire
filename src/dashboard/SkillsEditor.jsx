import { useState } from 'react';
import { client } from '../sanityClient';
import LoadingOverlay from './LoadingOverlay';
import ConfirmDialog from './ConfirmDialog';
import AddItemDialog from './AddItemDialog';

export default function SkillsEditor({ skills = [], showToast, onRefresh }) {
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({});
    const [processing, setProcessing] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState(null);
    const [addItemConfig, setAddItemConfig] = useState(null);

    const startEdit = (skill) => {
        setEditingId(skill._id);
        setFormData({
            ...skill,
            itemsString: skill.items?.join(', ') || ''
        });
    };
    const cancelEdit = () => { setEditingId(null); setFormData({}); };
    const onChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const onItemsChange = (e) => {
        setFormData(prev => ({ ...prev, itemsString: e.target.value }));
    };

    const handleSave = async () => {
        setProcessing(true);
        try {
            const items = formData.itemsString.split(',').map(s => s.trim()).filter(Boolean);
            await client
                .patch(editingId)
                .set({ category: formData.category, items: items })
                .commit();
            setEditingId(null);
            showToast('Skills updated', 'success');
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
            message: 'Are you sure you want to delete this skills catalog?',
            action: () => performDelete(id)
        });
    };

    const requestAdd = () => {
        setAddItemConfig({
            title: 'Add Skills Catalog',
            fields: [
                { name: 'category', label: 'Category Name', placeholder: 'e.g. Frontend, Backend', autoFocus: true, props: { required: true } },
                { name: 'items', label: 'Skills (comma separated)', placeholder: 'e.g. React, Node.js, CSS', props: { required: true } },
            ],
            confirmText: 'Create Catalog',
            action: performAdd
        });
    };

    const performDelete = async (id) => {
        setProcessing(true);
        try {
            await client.delete(id);
            showToast('Category catalog deleted', 'success');
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
            const items = data.items ? data.items.split(',').map(s => s.trim()).filter(Boolean) : [];
            await client.create({
                _type: 'skill',
                category: data.category || 'New Category',
                items: items,
                order: skills.length + 1,
            });
            showToast('Category catalog created', 'success');
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

            <h3>Skills Catalog</h3>
            {skills.map(skill => (
                <div key={skill._id} className="list-item">
                    {editingId === skill._id ? (
                        <div className="editor-form" style={{ width: '100%', padding: '1rem' }}>
                            <div className="editor-group"><label>Category Name</label>
                                <input name="category" className="editor-input" value={formData.category || ''} onChange={onChange} /></div>
                            <div className="editor-group"><label>Skills (comma separated)</label>
                                <input className="editor-input" value={formData.itemsString || ''} onChange={onItemsChange} /></div>
                            <div className="list-actions">
                                <button className="save-btn" onClick={handleSave} style={{ marginTop: 0, padding: '0.5rem 1rem' }}>Save</button>
                                <button className="icon-btn delete" onClick={cancelEdit}>✕</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="list-item-content">
                                <h4>{skill.category}</h4>
                                <p>{skill.items?.join(' · ')}</p>
                            </div>
                            <div className="list-actions">
                                <button className="icon-btn" onClick={() => startEdit(skill)}>✎</button>
                                <button className="icon-btn delete" onClick={() => requestDelete(skill._id)}>🗑</button>
                            </div>
                        </>
                    )}
                </div>
            ))}
            <button className="add-btn" onClick={requestAdd}>+ Add Catalog</button>
        </div>
    );
}
