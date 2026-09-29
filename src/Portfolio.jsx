import { useState, useEffect, useRef, useCallback } from 'react';
import { useSanityData } from './useSanityData';
import { client } from './sanityClient';
import './index.css';

/* ============================================================
   React Port — Powered by Sanity.io CMS (no static fallback)
   ============================================================ */

// ─── Loading Screen ───
function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Connecting to database…');

  useEffect(() => {
    const stages = [
      { at: 15, msg: 'Fetching profile data…' },
      { at: 35, msg: 'Loading experience…' },
      { at: 55, msg: 'Downloading skills…' },
      { at: 75, msg: 'Preparing stats…' },
      { at: 90, msg: 'Almost ready…' },
    ];

    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.random() * 8 + 2;
        const capped = Math.min(next, 95);
        const stage = stages.find(s => prev < s.at && capped >= s.at);
        if (stage) setStatus(stage.msg);
        return capped;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-logo">
          <div className="loading-ring" />
          <span className="loading-icon">⚡</span>
        </div>
        <h2 className="loading-title">Loading Portfolio</h2>
        <p className="loading-status">{status}</p>
        <div className="loading-bar-track">
          <div className="loading-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="loading-percent">{Math.floor(progress)}%</span>
      </div>
    </div>
  );
}

// ─── Hooks ───

function useTypewriter(words, speed = 100, pause = 1800) {
  const [text, setText] = useState('');
  const wordIndex = useRef(0);
  const charIndex = useRef(0);
  const isDeleting = useRef(false);

  useEffect(() => {
    const tick = () => {
      const current = words[wordIndex.current];
      if (isDeleting.current) {
        setText(current.substring(0, charIndex.current--));
      } else {
        setText(current.substring(0, charIndex.current++));
      }

      let delay = isDeleting.current ? speed / 2 : speed;

      if (!isDeleting.current && charIndex.current === current.length + 1) {
        delay = pause;
        isDeleting.current = true;
      } else if (isDeleting.current && charIndex.current < 0) {
        isDeleting.current = false;
        wordIndex.current = (wordIndex.current + 1) % words.length;
        delay = 400;
      }

      timerRef.current = setTimeout(tick, delay);
    };

    const timerRef = { current: null };
    timerRef.current = setTimeout(tick, speed);
    return () => clearTimeout(timerRef.current);
  }, [words, speed, pause]);

  return text;
}

function useScrollReveal(ready) {
  useEffect(() => {
    if (!ready) return; // Don't observe until content is rendered

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.12 }
    );
    // Small delay to ensure DOM is rendered
    const timer = setTimeout(() => {
      document.querySelectorAll('.reveal, .reveal-left').forEach((el) => observer.observe(el));
    }, 100);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [ready]);
}

function useCounterAnimation(target, triggerRef) {
  const [value, setValue] = useState(0);
  const animated = useRef(false);

  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animated.current) {
        animated.current = true;
        const isFloat = target % 1 !== 0;
        const start = performance.now();
        const duration = 2000;

        const update = (now) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = eased * target;
          setValue(isFloat ? parseFloat(current.toFixed(1)) : Math.floor(current));
          if (progress < 1) requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
      }
    }, { threshold: 0.5 });

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, triggerRef]);

  return value;
}

// ─── Particle Canvas ───
function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (window.innerWidth < 768) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const MAX = 40;

    const particles = Array.from({ length: Math.min(MAX, Math.floor((w * h) / 30000)) }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.8 + 0.5,
      dx: (Math.random() - 0.5) * 0.25, dy: (Math.random() - 0.5) * 0.25,
      opacity: Math.random() * 0.35 + 0.08,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(254, 76, 28, ${p.opacity})`;
        ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > w) p.dx *= -1;
        if (p.y < 0 || p.y > h) p.dy *= -1;
      }
      animId = requestAnimationFrame(draw);
    };

    draw();

    let resizeTimer;
    let lastWidth = window.innerWidth;

    const handleResize = () => {
      // Ignore vertical resizes on mobile (address bar) to prevent background reset
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;

      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
      }, 200);
    };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); cancelAnimationFrame(animId); };
  }, []);

  return <canvas id="bg-canvas" ref={canvasRef}></canvas>;
}

// ─── Stat Card (with counter) ───
function StatCard({ stat }) {
  const ref = useRef(null);
  const count = useCounterAnimation(stat.value, ref);
  return (
    <div className="stat-card glass-card reveal" ref={ref}>
      <div className="stat-value">
        <span className="stat-number">{stat.value % 1 !== 0 ? count.toFixed(1) : count}</span>
        <span className="stat-suffix">{stat.suffix}</span>
      </div>
      <div className="stat-label">{stat.label}</div>
    </div>
  );
}

// ─── Main App ───
export default function Portfolio() {
  const { data, loading, error } = useSanityData();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollTopVisible, setScrollTopVisible] = useState(false);
  const [formStatus, setFormStatus] = useState('');

  // Lock --real-vh on mount ONCE so the hero height never reacts to the
  // mobile browser address bar hiding/showing (which causes the bounce effect).
  useEffect(() => {
    document.documentElement.style.setProperty('--real-vh', `${window.innerHeight}px`);
    // Do NOT listen for resize — that's what causes the bounce.
  }, []);

  // Scroll effects
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
      setScrollTopVisible(window.scrollY > 500);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Update page title
  useEffect(() => {
    if (data?.profile?.name) {
      document.title = `${data.profile.name} | Portfolio`;
    }
  }, [data]);



  useScrollReveal(!loading && !!data);

  // Must call hooks unconditionally (before any early returns)
  const typedText = useTypewriter(data?.profile?.roles || ['Loading…']);

  // Show loading animation while fetching from database
  if (loading || !data) {
    return <LoadingScreen />;
  }

  // Show error state
  if (error) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <span className="loading-icon" style={{ fontSize: '3rem' }}>⚠️</span>
          <h2 className="loading-title" style={{ color: '#ef4444' }}>Connection Failed</h2>
          <p className="loading-status">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1.5rem', padding: '0.8rem 2rem',
              background: 'var(--accent-primary)', border: 'none',
              borderRadius: '8px', color: '#0a0a0a', fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { profile } = data;



  // Build timeline entries
  const timelineEntries = [
    ...data.experience.map(e => ({ ...e, type: 'work', org: e.company, icon: '💼' })),
    ...data.volunteering.map(v => ({
      ...v, type: 'volunteer', org: v.org,
      icon: v.role.includes('Teacher') ? '📖' : '❤️',
    })),
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('sending');
    const formData = new FormData(e.target);

    const submission = {
      _type: 'message',
      name: formData.get('name') || 'Anonymous',
      email: formData.get('email') || 'No Email',
      message: formData.get('message') || '',
      timestamp: new Date().toISOString(),
      read: false
    };

    try {
      await client.create(submission);
      setFormStatus('sent');
      e.target.reset();
      setTimeout(() => { setFormStatus(''); }, 4000);
    } catch (err) {
      console.error('Failed to send message:', err);
      setFormStatus('error');
      setTimeout(() => { setFormStatus(''); }, 3000);
    }
  };

  return (
    <>
      {/* Particle Canvas Background */}
      <ParticleCanvas />

      {/* Navbar */}
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`} id="navbar">
        <div className="container">
          <a href="#hero" id="logo">{profile.name.split(' ').map(w => w[0]).join('')
            .split('').map((c, i, arr) => i < arr.length - 1 ? <span key={i}>{c}<span>.</span></span> : c)}</a>
          <ul id="nav-links" className={menuOpen ? 'open' : ''}>
            <li><a href="#about" onClick={() => setMenuOpen(false)}>About</a></li>
            <li><a href="#skills" onClick={() => setMenuOpen(false)}>Skills</a></li>
            <li><a href="#timeline" onClick={() => setMenuOpen(false)}>Experience</a></li>
            <li><a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a></li>
          </ul>
          <button
            className={`hamburger${menuOpen ? ' active' : ''}`}
            id="hamburger"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header id="hero" className="section">
        <div className="container">
          <div id="hero-content">
            <div className="hero-avatar reveal">
              <div className="avatar-ring"></div>
              <img src={profile.avatar || '/avatar.png'} alt={profile.name} />
            </div>
            <h1 className="hero-name reveal">{profile.name}</h1>
            <div className="hero-typing reveal">
              <span id="typed-text">{typedText}</span><span className="cursor"></span>
            </div>
            <div className="hero-buttons reveal">
              {profile.resumeUrl ? (
                <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  <span>📄</span> {profile.cta_primary}
                </a>
              ) : (
                <button onClick={() => alert('Resume not uploaded yet')} className="btn btn-primary" style={{ cursor: 'pointer' }}>
                  <span>📄</span> {profile.cta_primary}
                </button>
              )}
              <a href="#contact" className="btn btn-secondary">
                <span>✉</span> {profile.cta_secondary || 'Contact Me'}
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section id="stats" className="section">
        <div className="container">
          <div id="stats-grid" className="stats-grid">
            {data.stats.map((stat, i) => (
              <StatCard key={i} stat={stat} />
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="section">
        <div className="container">
          <div className="about-grid" id="about">
            <div className="about-text reveal">
              {profile.aboutHighlight && (
                <div id="about-highlight" className="about-highlight">{profile.aboutHighlight}</div>
              )}
              {profile.aboutSubtitle && (
                <p style={{ color: 'var(--accent-primary)', fontWeight: 600, marginBottom: '1rem' }}>
                  {profile.aboutSubtitle}
                </p>
              )}
              {profile.summary && <p>{profile.summary}</p>}
              {profile.aboutDescription && (
                <p>{profile.aboutDescription}</p>
              )}
            </div>
            <div className="about-photo reveal-left">
              <div className="about-photo-frame">
                <div className="about-photo-ring"></div>
                <img src={profile.avatar || '/avatar.png'} alt={profile.name} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="section">
        <div className="container">
          {/* Moved id="skills" to header */}
          <h2 id="skills" className="section-title reveal">My <span className="accent">Skills</span></h2>
          <p className="section-subtitle reveal">Tools & technologies I work with.</p>
          <div id="skills-grid" className="skills-grid stagger">
            {data.skills.map((cat) => {
              if (cat.category === 'Soft') {
                return (
                  <div key={cat.category} className="skill-list-card glass-card reveal" style={{ gridColumn: 'span 2' }}>
                    <h3>{cat.category} Skills</h3>
                    <ul>
                      {cat.items.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                );
              }
              return cat.items.map((item) => (
                <div key={item} className="skill-card glass-card reveal">
                  <div className="skill-name">{item}</div>
                  <div className="skill-category-tag">{cat.category}</div>
                </div>
              ));
            })}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="section">
        <div className="container">
          {/* Moved id="timeline" to header */}
          <h2 id="timeline" className="section-title reveal">Experience & <span className="accent-orange">Volunteering</span></h2>
          <p className="section-subtitle reveal">My journey so far.</p>
          <div id="timeline-content" className="timeline">
            {timelineEntries.map((entry, i) => (
              <div
                key={i}
                className={`timeline-item ${entry.type === 'volunteer' ? 'volunteer' : ''} reveal-left`}
                style={{ transitionDelay: `${i * 0.12}s` }}
              >
                <div className="timeline-dot"></div>
                <span className={`timeline-badge ${entry.type === 'work' ? 'badge-work' : 'badge-volunteer'}`}>
                  {entry.icon} {entry.type === 'work' ? 'Experience' : 'Volunteering'}
                </span>
                <div className="timeline-card glass-card">
                  <div className="timeline-role">{entry.role}</div>
                  <div className="timeline-org">{entry.org}</div>
                  <div className="timeline-date">{entry.date}</div>
                  <div className="timeline-desc">{entry.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Footer */}
      <footer className="section">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info reveal">
              {/* id on the h2 so nav scrolls directly to the heading */}
              <h2 id="contact">Let's <span className="accent">Connect</span></h2>
              <p>I'm always open to discussing new projects, creative ideas, or opportunities to be part of something meaningful.</p>
              <div className="contact-detail">
                <div className="icon glass-card">📍</div>
                <span>{profile.location}</span>
              </div>
              <div className="contact-detail">
                <div className="icon glass-card">✉️</div>
                <a href={`mailto:${profile.email}`} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{profile.email}</a>
              </div>
              <div className="contact-detail">
                <div className="icon glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                </div>
                <a href={`https://wa.me/${profile.whatsapp || profile.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{profile.phone}</a>
              </div>
            </div>
            <form className="contact-form glass-card reveal-left" id="contact-form" onSubmit={handleSubmit}>
              <h3>Send a Message</h3>
              <div className="form-group">
                <label htmlFor="form-name">Your Name</label>
                <input type="text" id="form-name" name="name" placeholder="John Doe" required />
              </div>
              <div className="form-group">
                <label htmlFor="form-email">Your Email</label>
                <input type="email" id="form-email" name="email" placeholder="john@example.com" required />
              </div>
              <div className="form-group">
                <label htmlFor="form-message">Message</label>
                <textarea id="form-message" name="message" placeholder="Your message..." required></textarea>
              </div>
              <button
                type="submit"
                className="form-submit"
                disabled={formStatus === 'sending' || formStatus === 'sent'}
                style={formStatus === 'sent' ? { background: 'var(--accent-secondary)' } : {}}
              >
                {formStatus === 'sending' ? 'Sending...' : formStatus === 'sent' ? '✓ Message Sent!' : formStatus === 'error' ? 'Failed. Try Again.' : 'Send Message →'}
              </button>
            </form>
          </div>

          {/* Professional Footer */}
          <div className="footer-divider"></div>
          <div className="footer-grid">
            <div className="footer-brand">
              <a href="#hero" className="footer-logo">{profile.name}<span>.</span></a>
              <div className="social-links" style={{ marginTop: '1.5rem', width: '100%' }}>
                <a
                  href={`https://wa.me/${profile.whatsapp || profile.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="social-link glass-card action-icon"
                  title="Chat on WhatsApp"
                  style={{
                    width: 'auto',
                    height: 'auto',
                    borderRadius: '12px',
                    padding: '0.8rem 1.5rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    textDecoration: 'none',
                    background: 'rgba(254, 76, 28, 0.1)',
                    border: '1px solid rgba(255, 193, 7, 0.25)'
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fe4c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                  <span style={{
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '1rem',
                    letterSpacing: '0.5px',
                    whiteSpace: 'nowrap'
                  }}>
                    WhatsApp
                  </span>
                </a>
              </div>
            </div>
            <div className="footer-nav">
              <h4 className="footer-heading">Quick Links</h4>
              <ul className="footer-links">
                <li><a href="#about">About</a></li>
                <li><a href="#skills">Skills</a></li>
                <li><a href="#timeline">Experience</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>
            <div className="footer-contact-col">
              <h4 className="footer-heading">Get in Touch</h4>
              <ul className="footer-links">
                <li>📍 {profile.location}</li>
                <li>✉️ <a href={`mailto:${profile.email}`}>{profile.email}</a></li>
                <li>📱 <a href={`tel:${profile.phone}`}>{profile.phone}</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} {profile.name}. All rights reserved.</p>
            <p className="footer-craft">Crafted with resilience from <span className="accent">Gaza, Palestine</span> 🇵🇸</p>
          </div>
        </div>
      </footer>

      {/* Scroll to Top */}
      <button
        className={`scroll-top${scrollTopVisible ? ' visible' : ''}`}
        id="scroll-top"
        aria-label="Scroll to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        ↑
      </button>
    </>
  );
}
