import { useState, useEffect } from 'react';
import { useSanityData } from '../useSanityData';
import { useToast } from './useToast.jsx';
import ProfileEditor from './ProfileEditor';
import StatsEditor from './StatsEditor';
import ExperienceEditor from './ExperienceEditor';
import VolunteeringEditor from './VolunteeringEditor';
import SkillsEditor from './SkillsEditor';

import { client } from '../sanityClient';
import SettingsEditor from './SettingsEditor'; // New Editor
import MessagesViewer from './MessagesViewer';
import './dashboard.css';

const TABS = [
    { key: 'profile', icon: '👤', label: 'Profile' },
    { key: 'stats', icon: '📊', label: 'Stats' },
    { key: 'experience', icon: '💼', label: 'Experience' },
    { key: 'volunteering', icon: '❤️', label: 'Volunteering' },
    { key: 'skills', icon: '⚡', label: 'Skills' },
    { key: 'settings', icon: '⚙️', label: 'Settings' }, // Replaces Projects
    { key: 'messages', icon: '📬', label: 'Messages' },
];

export default function Dashboard() {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [loginError, setLoginError] = useState('');
    const [isShaking, setIsShaking] = useState(false);
    const [loginSuccess, setLoginSuccess] = useState(false);
    const { data, loading, error: sanityError, refetch } = useSanityData();
    const [ToastContainer, showToast] = useToast();

    useEffect(() => {
        if (localStorage.getItem('dashboard_auth') === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');

        // 1. Check ENV password first (fastest)
        if (password === import.meta.env.VITE_DASHBOARD_PASSWORD) {
            doLoginSuccess();
            return;
        }

        // 2. Check Sanity (Dynamic Password)
        try {
            const config = await client.fetch('*[_id == "site-config"][0]');
            if (config && config.adminPassword === password) {
                doLoginSuccess();
            } else {
                setLoginError('Access Denied — Invalid Password');
                setIsShaking(true);
                setTimeout(() => setIsShaking(false), 500);
                setPassword('');
            }
        } catch (err) {
            setLoginError('Error verifying credentials');
        }
    };

    const doLoginSuccess = () => {
        setLoginSuccess(true);
        setTimeout(() => {
            setIsAuthenticated(true);
            localStorage.setItem('dashboard_auth', 'true');
        }, 600);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('dashboard_auth');
        setLoginSuccess(false);
        setPassword('');
    };

    // Called by all editors after a successful mutation
    const handleRefresh = async () => {
        await refetch();
    };

    /* ─── Login Screen ─── */
    if (!isAuthenticated) {
        return (
            <div className="dashboard-container dashboard-auth">
                {loginError && (
                    <div className="error-toast">{loginError}</div>
                )}

                <div className={`dashboard-auth-container ${loginSuccess ? 'auth-success' : ''}`}>
                    <div className="auth-header">
                        <div className="auth-logo">🔐</div>
                        <h2>Admin Portal</h2>
                        <p>Enter your credentials to continue</p>
                    </div>

                    <form onSubmit={handleLogin} className="auth-form">
                        <div className={`auth-input-group ${isShaking ? 'shaking' : ''}`}>
                            <span className="auth-icon">🔑</span>
                            <input
                                type="password"
                                placeholder="Dashboard Password"
                                className="auth-input"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setLoginError(''); }}
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            className={`auth-btn ${loginSuccess ? 'auth-btn--success' : ''}`}
                            disabled={loginSuccess}
                        >
                            {loginSuccess ? '✓ Access Granted' : 'Unlock Dashboard'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    /* ─── Loading / Error ─── */
    if (loading) {
        return (
            <div className="dashboard-container dashboard-auth">
                <div className="loading-spinner" />
                <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading dashboard…</p>
            </div>
        );
    }

    if (sanityError) {
        return (
            <div className="dashboard-container dashboard-auth">
                <p style={{ color: '#ef4444' }}>Failed to load data: {sanityError.message}</p>
            </div>
        );
    }

    /* ─── Main Dashboard ─── */
    return (
        <div className="dashboard-container">
            {ToastContainer}

            <aside className="dashboard-sidebar">
                <div className="sidebar-brand">Portfolio<span>.</span>Admin</div>
                <ul className="sidebar-nav">
                    {TABS.map(tab => (
                        <li key={tab.key}>
                            <a
                                className={`sidebar-link ${activeTab === tab.key ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {tab.icon} {tab.label}
                            </a>
                        </li>
                    ))}
                </ul>
                <div className="sidebar-logout">
                    <button className="logout-btn" onClick={handleLogout}>Log Out</button>
                </div>
            </aside>

            <main className="dashboard-content">
                <header className="dashboard-header">
                    <h2>{TABS.find(t => t.key === activeTab)?.label}</h2>
                    <div className="save-status">Live Sync 🟢</div>
                </header>

                {activeTab === 'profile' && <ProfileEditor data={data.profile} showToast={showToast} onRefresh={handleRefresh} />}
                {activeTab === 'stats' && <StatsEditor stats={data.stats} showToast={showToast} onRefresh={handleRefresh} />}
                {activeTab === 'experience' && <ExperienceEditor experience={data.experience} showToast={showToast} onRefresh={handleRefresh} />}
                {activeTab === 'volunteering' && <VolunteeringEditor volunteering={data.volunteering} showToast={showToast} onRefresh={handleRefresh} />}
                {activeTab === 'skills' && <SkillsEditor skills={data.skills} showToast={showToast} onRefresh={handleRefresh} />}
                {activeTab === 'settings' && <SettingsEditor showToast={showToast} />}
                {activeTab === 'messages' && <MessagesViewer messages={data.messages || []} showToast={showToast} onRefresh={handleRefresh} />}
            </main>
        </div>
    );
}
