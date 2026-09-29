
import { useState, useEffect } from 'react';
import { client } from '../sanityClient';

export default function SettingsEditor({ showToast }) {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const config = await client.fetch('*[_id == "site-config"][0]');
                if (config && config.adminPassword) {
                    setPassword(config.adminPassword);
                }
            } catch (err) {
                console.error(err);
                showToast('Failed to load settings', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            // We only update the password, keeping other potential fields intact or ignoring them
            await client.patch('site-config')
                .set({ adminPassword: password })
                .commit();

            showToast('Password updated!', 'success');
        } catch (err) {
            console.error(err);
            // Fallback if document doesn't exist
            try {
                await client.createOrReplace({
                    _id: 'site-config',
                    _type: 'siteConfig',
                    adminPassword: password
                });
                showToast('Password updated!', 'success');
            } catch (createErr) {
                showToast('Failed to save: ' + createErr.message, 'error');
            }
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', flexDirection: 'column' }}>
                <div className="loading-spinner" />
                <p style={{ marginTop: '1rem', color: '#b3b3b3', fontSize: '0.9rem' }}>Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="editor-section">
            <h3>Site Settings</h3>
            <div className="editor-form" style={{ margin: '0 auto' }}>
                <div className="editor-group">
                    <label>Dashboard Admin Password</label>
                    <input
                        type="text"
                        className="editor-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                    />
                    <p style={{ fontSize: '0.8rem', color: '#b3b3b3', marginTop: '0.5rem' }}>
                        This overrides the default environment password.
                    </p>
                </div>
                <button className="save-btn" onClick={handleSave} style={{ width: '100%' }}>Update Password</button>
            </div>
        </div>
    );
}
