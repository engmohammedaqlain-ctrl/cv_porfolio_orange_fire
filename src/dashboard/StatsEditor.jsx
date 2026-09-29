import { useState } from 'react';
import { client } from '../sanityClient';
import LoadingOverlay from './LoadingOverlay';
import ConfirmDialog from './ConfirmDialog';
import AddItemDialog from './AddItemDialog';

export default function StatsEditor({ stats, showToast, onRefresh }) {
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({});
    const [processing, setProcessing] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState(null);
    const [addItemConfig, setAddItemConfig] = useState(null);

    const startEdit = (stat) => { setEditingId(stat._id); setFormData({ ...stat }); };
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
                .set({ label: formData.label, value: parseFloat(formData.value) || 0, suffix: formData.suffix })
                .commit();
            setEditingId(null);
            showToast('Stat updated', 'success');
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
            message: 'Are you sure you want to delete this stat catalog?',
            action: () => performDelete(id)
        });
    };

    const requestAdd = () => {
        setAddItemConfig({
            title: 'Add Stat Catalog',
            fields: [
                { name: 'value', label: 'Value', type: 'number', placeholder: 'e.g. 5', autoFocus: true, props: { step: "any", required: true } },
                { name: 'suffix', label: 'Suffix', placeholder: 'e.g. + Years' },
                { name: 'label', label: 'Label', placeholder: 'e.g. Experience', props: { required: true } },
            ],
            confirmText: 'Create Catalog',
            action: performAdd
        });
    };

    const performDelete = async (id) => {
        setProcessing(true);
        try {
            await client.delete(id);
            showToast('Stat catalog deleted', 'success');
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
                _type: 'stat',
                label: data.label || 'Label',
                value: parseFloat(data.value) || 0,
                suffix: data.suffix || '',
                order: stats.length + 1
            });
            showToast('Stat catalog created', 'success');
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

            <h3>Stats Catalog</h3>
            {stats.map(stat => (
                <div key={stat._id} className="list-item">
                    {editingId === stat._id ? (
                        <div className="editor-form" style={{ width: '100%', padding: '1rem' }}>
                            <div className="editor-group"><label>Label</label>
                                <input name="label" className="editor-input" value={formData.label} onChange={onChange} /></div>
                            <div className="editor-group"><label>Value</label>
                                <input name="value" type="number" className="editor-input" value={formData.value} onChange={onChange} /></div>
                            <div className="editor-group"><label>Suffix</label>
                                <input name="suffix" className="editor-input" value={formData.suffix} onChange={onChange} /></div>
                            <div className="list-actions">
                                <button className="save-btn" onClick={handleSave} style={{ marginTop: 0, padding: '0.5rem 1rem' }}>Save</button>
                                <button className="icon-btn delete" onClick={cancelEdit}>✕</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="list-item-content">
                                <h4>{stat.value}{stat.suffix}</h4>
                                <p>{stat.label}</p>
                            </div>
                            <div className="list-actions">
                                <button className="icon-btn" onClick={() => startEdit(stat)}>✎</button>
                                <button className="icon-btn delete" onClick={() => requestDelete(stat._id)}>🗑</button>
                            </div>
                        </>
                    )}
                </div>
            ))}
            <button className="add-btn" onClick={requestAdd}>+ Add Catalog</button>
        </div>
    );
}
