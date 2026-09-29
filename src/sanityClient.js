import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

export const client = createClient({
    projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
    dataset: import.meta.env.VITE_SANITY_DATASET,
    apiVersion: '2024-01-01',
    useCdn: false, // MUST be false for mutations to read fresh data
    token: import.meta.env.VITE_SANITY_TOKEN,
    ignoreBrowserTokenWarning: true,
});

const builder = imageUrlBuilder(client);

export function urlFor(source) {
    return builder.image(source);
}

export function resolveResumeUrl(ref) {
    if (!ref) return null;
    // Handle "file-HASH-pdf"
    // URL: https://cdn.sanity.io/files/<projectId>/<dataset>/<HASH>.<ext>
    const parts = ref.split('-');
    if (parts.length < 3) return null;
    const hash = parts[1];
    const ext = parts[parts.length - 1];
    return `https://cdn.sanity.io/files/${client.config().projectId}/${client.config().dataset}/${hash}.${ext}`;
}
