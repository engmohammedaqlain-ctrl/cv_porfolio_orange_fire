import { useState, useEffect, useCallback } from 'react';
import { client, resolveResumeUrl } from './sanityClient';

/* ─── GROQ Queries ─── */
const QUERIES = {
    profile: `*[_id == "profile-singleton"][0]{
    ...,
    "avatar": avatar.asset->url,
    "resumeUrl": resume.asset->url
  }`,
    stats: `*[_type == "stat"]          | order(order asc){ _id, label, value, suffix }`,
    experience: `*[_type == "experience"]    | order(order asc){ _id, role, company, date, desc, isCurrent }`,
    volunteering: `*[_type == "volunteering"]  | order(order asc){ _id, role, org, date, desc }`,
    skills: `*[_type == "skill"]         | order(order asc){ _id, category, items }`,
    projects: `*[_type == "project"]      | order(order asc){ _id, title, category, image, description, link, tags }`,
    messages: `*[_type == "message"]      | order(_createdAt desc)`,
};

// Minimum time the loading screen should be visible (ms)
const MIN_LOADING_MS = 2000;

/* ─── Hook ─── */
export function useSanityData() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAll = useCallback(async (isInitial = false) => {
        const startTime = isInitial ? Date.now() : 0;

        try {
            const [profile, stats, experience, volunteering, skills, projects, messages] = await Promise.all([
                client.fetch(QUERIES.profile),
                client.fetch(QUERIES.stats),
                client.fetch(QUERIES.experience),
                client.fetch(QUERIES.volunteering),
                client.fetch(QUERIES.skills),
                client.fetch(QUERIES.projects),
                client.fetch(QUERIES.messages),
            ]);

            // Ensure profile has default About values if missing
            if (profile) {
                if (!profile.aboutHighlight) profile.aboutHighlight = '97.1%';
                if (!profile.aboutSubtitle) profile.aboutSubtitle = 'General Secondary Education — Excellence';
                if (!profile.aboutDescription) profile.aboutDescription = 'Demonstrating resilience under extraordinary pressure, I have channeled my passion for technology into self-taught programming, humanitarian leadership, and creative design — all while navigating the challenges of life in Gaza, Palestine.';
            }

            // If this is the initial load, wait minimum time so loading animation is visible
            if (isInitial) {
                const elapsed = Date.now() - startTime;
                if (elapsed < MIN_LOADING_MS) {
                    await new Promise(r => setTimeout(r, MIN_LOADING_MS - elapsed));
                }
            }

            if (profile && profile.name) {
                setData({
                    profile: {
                        name: profile.name,
                        roles: profile.roles || [],
                        location: profile.location || '',
                        email: profile.email || '',
                        phone: profile.phone || '',
                        summary: profile.summary || '',
                        aboutHighlight: profile.aboutHighlight || '',
                        aboutSubtitle: profile.aboutSubtitle || '',
                        aboutDescription: profile.aboutDescription || '',
                        avatar: profile.avatar || null,
                        resumeUrl: profile.resumeUrl || null, // Added resumeUrl to state
                        cta_primary: profile.cta_primary || 'Download CV',
                        cta_secondary: profile.cta_secondary || 'Contact Me',
                        socialLinks: profile.socialLinks || [],
                        whatsapp: profile.whatsapp || '',
                        resume: profile.resume || null,
                        resumeUrl: profile.resumeUrl || (profile.resume?.asset?._ref ? resolveResumeUrl(profile.resume.asset._ref) : null), // Ensure resume object is mapped (Fix for Uploader toggle)
                    },
                    stats: stats || [],
                    experience: experience || [],
                    volunteering: volunteering || [],
                    skills: skills || [],
                    projects: projects || [],
                    messages: messages || [],
                });
            } else {
                setError(new Error('No profile found in database'));
            }
        } catch (err) {
            console.error('Sanity fetch failed:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Pass true for initial load to enforce minimum loading time
        fetchAll(true);

        const subscription = client
            .listen(`*[_type in ["profile", "stat", "experience", "volunteering", "skill"]]`)
            .subscribe(() => {
                fetchAll(false);
            });

        return () => subscription.unsubscribe();
    }, [fetchAll]);

    return { data, loading, error, refetch: fetchAll };
}
