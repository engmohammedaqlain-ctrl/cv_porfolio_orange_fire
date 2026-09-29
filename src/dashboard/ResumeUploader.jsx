
import { useState, useRef, useEffect } from 'react';
import { client, resolveResumeUrl } from '../sanityClient';
import LoadingOverlay from './LoadingOverlay';
import ConfirmDialog from './ConfirmDialog';

export default function ResumeUploader({ data, onRefresh, showToast }) {
    const [dragActive, setDragActive] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [status, setStatus] = useState('');
    const inputRef = useRef(null);

    // Confirmation State
    const [showConfirm, setShowConfirm] = useState(false);

    // Local state to handle immediate UI update before refresh
    const [localResume, setLocalResume] = useState(null);
    const [localResumeUrl, setLocalResumeUrl] = useState(null);

    useEffect(() => {
        if (data.resume) setLocalResume(data.resume);
        if (data.resumeUrl) setLocalResumeUrl(data.resumeUrl);
    }, [data.resume, data.resumeUrl]);

    // Drag handlers
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (file) => {
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validTypes.includes(file.type)) {
            showToast('Only PDF and DOC/DOCX files are allowed.', 'error');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            showToast('File size must be under 10MB.', 'error');
            return;
        }

        setStatus('Uploading Resume...');
        setProcessing(true);

        try {
            const asset = await client.assets.upload('file', file, {
                filename: file.name
            });

            await client.patch('profile-singleton').set({
                resume: { _type: 'file', asset: { _type: 'reference', _ref: asset._id } }
            }).commit();

            // Resolve URL locally for immediate feedback
            const rawUrl = resolveResumeUrl(asset._id);
            setLocalResume({ _type: 'file', asset: { _ref: asset._id } });
            setLocalResumeUrl(rawUrl);

            showToast('Resume uploaded successfully!', 'success');

            // Still trigger refresh in background
            setTimeout(() => onRefresh(), 500);
        } catch (error) {
            console.error(error);
            showToast('Upload failed: ' + error.message, 'error');
        } finally {
            setProcessing(false);
        }
    };

    const requestDelete = () => {
        setShowConfirm(true);
    };

    const executeDelete = async () => {
        setShowConfirm(false);
        setStatus('Removing Resume...');
        setProcessing(true);
        try {
            await client.patch('profile-singleton').unset(['resume']).commit();

            setLocalResume(null);
            setLocalResumeUrl(null);

            showToast('Resume removed.', 'success');
            setTimeout(() => onRefresh(), 500);
        } catch (error) {
            showToast('Delete failed: ' + error.message, 'error');
        } finally {
            setProcessing(false);
        }
    };

    const triggerFileSelect = () => {
        inputRef.current.click();
    };

    const currentResume = localResume || data.resume;
    const currentUrl = localResumeUrl || data.resumeUrl;

    return (
        <div className="resume-uploader-container" style={{ margin: '1rem 0' }}>
            {processing && <LoadingOverlay text={status} />}

            <ConfirmDialog
                isOpen={showConfirm}
                title="Delete Resume"
                message="Are you sure you want to delete your uploaded Resume/CV? This action cannot be undone."
                confirmText="Delete Resume"
                cancelText="Cancel"
                onConfirm={executeDelete}
                onCancel={() => setShowConfirm(false)}
                type="danger"
            />

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Resume / CV (Payload)</label>

            {!currentResume ? (
                // Upload State
                <div
                    className={`upload-dropzone ${dragActive ? 'active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={triggerFileSelect}
                    style={{
                        border: `2px dashed ${dragActive ? 'var(--accent-primary)' : 'rgba(255,255,255,0.2)'}`,
                        borderRadius: '12px',
                        padding: '2rem',
                        textAlign: 'center',
                        background: dragActive ? 'rgba(254, 76, 28, 0.12)' : 'rgba(255,255,255,0.03)',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        position: 'relative'
                    }}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleChange}
                        style={{ display: 'none' }}
                    />
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
                    <p style={{ margin: 0, fontWeight: '500' }}>Click or Drag PDF/DOC here</p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', opacity: 0.6 }}>Max 10MB</p>
                </div>
            ) : (
                // File Exists State
                <div
                    className="file-preview-card"
                    style={{
                        border: '1px solid rgba(254, 76, 28, 0.35)',
                        background: 'rgba(254, 76, 28, 0.06)',
                        borderRadius: '12px',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '40px', height: '40px',
                            background: 'var(--accent-primary)',
                            borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#0a0a0a', fontWeight: 'bold'
                        }}>
                            CV
                        </div>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Resume Uploaded</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Ready for download</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {currentUrl ? (
                            <a
                                href={currentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="icon-btn"
                                style={{
                                    textDecoration: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: '36px', height: '36px'
                                }}
                                title="View Resume"
                            >
                                👁
                            </a>
                        ) : (
                            <button className="icon-btn" title="Processing..." disabled>⏳</button>
                        )}
                        <button
                            className="icon-btn delete"
                            onClick={(e) => { e.stopPropagation(); requestDelete(); }}
                            title="Delete Resume"
                            style={{ width: '36px', height: '36px' }}
                        >
                            🗑
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
