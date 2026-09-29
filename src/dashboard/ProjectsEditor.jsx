import { useState } from 'react';
import { client } from '../sanityClient';

export default function ProjectsEditor({ projects, showToast, onRefresh }) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentProject, setCurrentProject] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Initial state for new project
    const emptyProject = {
        title: '',
        category: '',
        description: '',
        link: '',
        tags: [],
        image: null
    };

    const handleEdit = (proj) => {
        setCurrentProject(proj ? { ...proj } : { ...emptyProject });
        setIsEditing(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCurrentProject(prev => ({ ...prev, [name]: value }));
    };

    const handleTagsChange = (e) => {
        const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
        setCurrentProject(prev => ({ ...prev, tags }));
    };

    const handleImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const asset = await client.assets.upload('image', file);
            setCurrentProject(prev => ({
                ...prev,
                image: {
                    _type: 'image',
                    asset: {
                        _type: 'reference',
                        _ref: asset._id
                    }
                }
            }));
            showToast('Image uploaded', 'success');
        } catch (err) {
            showToast('Upload failed', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const doc = {
                _type: 'project',
                title: currentProject.title,
                category: currentProject.category,
                description: currentProject.description,
                link: currentProject.link,
                tags: currentProject.tags,
                image: currentProject.image
            };

            if (currentProject._id) {
                await client.patch(currentProject._id).set(doc).commit();
            } else {
                await client.create(doc);
            }

            showToast('Project saved', 'success');
            setIsEditing(false);
            onRefresh();
        } catch (err) {
            showToast('Save failed', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this project?')) return;
        try {
            await client.delete(id);
            showToast('Project deleted', 'success');
            onRefresh();
        } catch (err) {
            showToast('Delete failed', 'error');
        }
    };

    if (isEditing) {
        return (
            <div className="editor-card">
                <div className="editor-header">
                    <h3>{currentProject._id ? 'Edit Project' : 'New Project'}</h3>
                    <button className="btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
                <form onSubmit={handleSave} className="editor-form">
                    <div className="editor-group">
                        <label>Title</label>
                        <input name="title" className="editor-input" value={currentProject.title} onChange={handleChange} required />
                    </div>
                    <div className="editor-group">
                        <label>Category</label>
                        <input name="category" className="editor-input" value={currentProject.category} onChange={handleChange} placeholder="e.g. Web App" />
                    </div>
                    <div className="editor-group">
                        <label>Image</label>
                        <input type="file" onChange={handleImageChange} />
                        {uploading && <span>Uploading...</span>}
                        {currentProject.image && <span style={{ color: 'green' }}>Image set ✓</span>}
                    </div>
                    <div className="editor-group">
                        <label>Description</label>
                        <textarea name="description" className="editor-textarea" value={currentProject.description} onChange={handleChange} />
                    </div>
                    <div className="editor-group">
                        <label>Link</label>
                        <input name="link" className="editor-input" value={currentProject.link} onChange={handleChange} placeholder="https://..." />
                    </div>
                    <div className="editor-group">
                        <label>Tags (comma separated)</label>
                        <input className="editor-input" value={currentProject.tags?.join(', ') || ''} onChange={handleTagsChange} />
                    </div>
                    <button type="submit" className="editor-save-btn">Save Project</button>
                </form>
            </div>
        );
    }

    return (
        <div className="editor-card">
            <div className="editor-header">
                <h3>Projects</h3>
                <button className="add-btn" onClick={() => handleEdit(null)}>+ Add Project</button>
            </div>
            <div className="list-container">
                {projects?.map((proj) => (
                    <div key={proj._id} className="list-item">
                        <div>
                            <strong>{proj.title}</strong>
                            <p style={{ fontSize: '0.8rem', color: '#b3b3b3' }}>{proj.category}</p>
                        </div>
                        <div className="list-actions">
                            <button className="edit-icon" onClick={() => handleEdit(proj)}>✏️</button>
                            <button className="delete-icon" onClick={() => handleDelete(proj._id)}>🗑️</button>
                        </div>
                    </div>
                ))}
                {(!projects || projects.length === 0) && <p style={{ padding: '1rem', color: '#b3b3b3' }}>No projects yet.</p>}
            </div>
        </div>
    );
}
