import { useState, useEffect, useRef } from 'react';
import { client } from '../sanityClient';
import LoadingOverlay from './LoadingOverlay';
import ResumeUploader from './ResumeUploader';

export default function ProfileEditor({ data, showToast, onRefresh }) {
    const [formData, setFormData] = useState(data || {});
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [loadingText, setLoadingText] = useState('Processing...');
    const [avatarPreview, setAvatarPreview] = useState(data?.avatar || null);
    const fileInputRef = useRef(null);

    // ... (useEffect remains same) ...

    useEffect(() => {
        if (data) {
            setFormData({
                ...data,
                rolesRaw: data.roles ? data.roles.join(', ') : ''
            });
            setAvatarPreview(data.avatar);
        }
    }, [data]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRolesChange = (e) => {
        const val = e.target.value;
        const roles = val.split(',').map(r => r.trim()).filter(r => r !== '');
        setFormData(prev => ({
            ...prev,
            rolesRaw: val,
            roles: roles
        }));
    };

    /* ─── Avatar Upload ─── */
    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showToast('Image must be under 5MB', 'error');
            return;
        }

        const localUrl = URL.createObjectURL(file);
        setAvatarPreview(localUrl);

        setUploading(true);
        setLoadingText('Uploading Avatar...');
        try {
            const asset = await client.assets.upload('image', file, {
                filename: file.name,
            });

            await client
                .patch('profile-singleton')
                .set({
                    avatar: {
                        _type: 'image',
                        asset: {
                            _type: 'reference',
                            _ref: asset._id,
                        },
                    },
                })
                .commit();

            showToast('Avatar updated!', 'success');
            await onRefresh();
        } catch (err) {
            console.error('Avatar upload failed:', err);
            showToast('Failed to upload avatar: ' + err.message, 'error');
            setAvatarPreview(data?.avatar || null);
        } finally {
            setUploading(false);
            URL.revokeObjectURL(localUrl);
        }
    };

    /* ─── Save Profile Text Fields ─── */
    const handleSave = async () => {
        setSaving(true);
        setLoadingText('Saving Profile...');
        try {
            await client
                .patch('profile-singleton')
                .set({
                    name: formData.name,
                    roles: formData.roles,
                    location: formData.location,
                    email: formData.email,
                    phone: formData.phone,
                    summary: formData.summary || '',
                    aboutHighlight: formData.aboutHighlight || '',
                    aboutSubtitle: formData.aboutSubtitle || '',
                    aboutDescription: formData.aboutDescription || '',
                    cta_primary: formData.cta_primary || '',
                    cta_secondary: formData.cta_secondary || '',
                    whatsapp: formData.whatsapp || '',
                })
                .commit();

            showToast('Profile saved successfully', 'success');
            await new Promise(resolve => setTimeout(resolve, 2500));
            await onRefresh();
        } catch (err) {
            console.error(err);
            showToast('Failed to save profile: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="editor-form" style={{ margin: '0 auto' }}>
            {(saving || uploading) && <LoadingOverlay text={loadingText} />}
            {/* Avatar Upload Section */}
            <div className="editor-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>

                <div className="avatar-upload-area" onClick={handleAvatarClick}>
                    {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="avatar-preview-img" />
                    ) : (
                        <div className="avatar-placeholder">
                            <span style={{ fontSize: '2rem' }}>📷</span>
                            <span>Click to upload</span>
                        </div>
                    )}
                    {uploading && (
                        <div className="avatar-uploading-overlay">
                            <div className="avatar-spinner" />
                            <span>Uploading…</span>
                        </div>
                    )}
                    <div className="avatar-change-badge">
                        {uploading ? '⏳' : '✏️'}
                    </div>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                />
                <p style={{ color: '#b3b3b3', fontSize: '.8rem', marginTop: '.5rem' }}>
                    Click image to change • PNG, JPG, WebP • Max 5MB
                </p>
            </div>

            {/* Text Fields */}
            <div className="editor-group">
                <label>Full Name</label>
                <input name="name" className="editor-input" value={formData.name || ''} onChange={handleChange} />
            </div>
            <div className="editor-group">
                <label>Roles (comma separated)</label>
                <input name="roles" className="editor-input" value={formData.rolesRaw || ''} onChange={handleRolesChange} />
            </div>
            <div className="editor-group">
                <label>Location</label>
                <input name="location" className="editor-input" value={formData.location || ''} onChange={handleChange} />
            </div>
            <div className="editor-group">
                <label>Email</label>
                <input name="email" className="editor-input" value={formData.email || ''} onChange={handleChange} />
            </div>
            <div className="editor-group">
                <label>Phone</label>
                <input name="phone" className="editor-input" value={formData.phone || ''} onChange={handleChange} />
            </div>
            <div className="editor-group">
                <label>Bio / Summary</label>
                <textarea name="summary" className="editor-textarea" value={formData.summary || ''} onChange={handleChange} />
            </div>
            <div className="editor-group">
                <label>About - Highlight (e.g., 97.1%)</label>
                <input name="aboutHighlight" className="editor-input" value={formData.aboutHighlight || ''} onChange={handleChange} placeholder="97.1%" autoComplete="off" />
            </div>
            <div className="editor-group">
                <label>About - Subtitle</label>
                <input name="aboutSubtitle" className="editor-input" value={formData.aboutSubtitle || ''} onChange={handleChange} placeholder="General Secondary Education" autoComplete="off" />
            </div>
            <div className="editor-group">
                <label>About - Main Description</label>
                <textarea name="aboutDescription" className="editor-textarea" value={formData.aboutDescription || ''} onChange={handleChange} placeholder="Demonstrating resilience..." />
            </div>
            <div className="editor-group">
                <label>Primary CTA</label>
                <input name="cta_primary" className="editor-input" value={formData.cta_primary || ''} onChange={handleChange} />
            </div>
            <ResumeUploader data={data} onRefresh={onRefresh} showToast={showToast} />
            <div className="editor-group">
                <label>Secondary CTA</label>
                <input name="cta_secondary" className="editor-input" value={formData.cta_secondary || ''} onChange={handleChange} />
            </div>
            <div className="editor-group">
                <label>WhatsApp Number</label>
                <input name="whatsapp" className="editor-input" value={formData.whatsapp || ''} onChange={handleChange} placeholder="e.g. 970591234567" />
            </div>
            <button className="save-btn" onClick={handleSave} disabled={saving} style={{ width: '100%' }}>
                {saving ? 'Saving…' : 'Save Profile'}
            </button>
        </div>
    );
}
