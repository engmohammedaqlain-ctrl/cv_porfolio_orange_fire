
import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SANITY_STUDIO_PATH = path.resolve(__dirname, '..', 'sanity-backend');
const SCHEMA_DIR = path.join(SANITY_STUDIO_PATH, 'schemaTypes');
const SEED_DATA_PATH = path.join(__dirname, 'data.json');

const loadEnv = () => {
    try {
        const envPath = path.join(__dirname, '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) process.env[key.trim()] = value.trim();
        });
    } catch (e) { }
};
loadEnv();

const projectId = process.env.VITE_SANITY_PROJECT_ID;
const dataset = process.env.VITE_SANITY_DATASET || 'production';
const token = process.env.VITE_SANITY_TOKEN;




if (!projectId || !token) {
    console.error('❌ Missing VITE_SANITY_PROJECT_ID or VITE_SANITY_TOKEN in .env');
    console.log('Please make sure your .env file has these variables set.');
    process.exit(1);
}

// --- 1. Define Schemas (Code content to write) ---
const schemas = {
    'profile.ts': `import { defineType, defineField } from 'sanity'
export default defineType({
    name: 'profile', title: 'Profile', type: 'document',
    fields: [
        defineField({ name: 'name', type: 'string' }),
        defineField({ name: 'roles', type: 'array', of: [{type:'string'}] }),
        defineField({ name: 'summary', type: 'text' }),
        defineField({ name: 'aboutHighlight', type: 'string' }),
        defineField({ name: 'avatar', type: 'image', options: { hotspot: true } }),
        defineField({ name: 'resume', type: 'file' })
    ]
})`,
    'stat.ts': `import { defineType, defineField } from 'sanity'
export default defineType({
    name: 'stat', title: 'Stat', type: 'document',
    fields: [
        defineField({ name: 'label', type: 'string' }),
        defineField({ name: 'value', type: 'number' }),
        defineField({ name: 'suffix', type: 'string' }),
        defineField({ name: 'order', type: 'number' })
    ]
})`,
    'skill.ts': `import { defineType, defineField } from 'sanity'
export default defineType({
    name: 'skill', title: 'Skill', type: 'document',
    fields: [
        defineField({ name: 'category', type: 'string' }),
        defineField({ name: 'items', type: 'array', of: [{type:'string'}] }),
        defineField({ name: 'order', type: 'number' })
    ]
})`,
    'experience.ts': `import { defineType, defineField } from 'sanity'
export default defineType({
    name: 'experience', title: 'Experience', type: 'document',
    fields: [
        defineField({ name: 'role', type: 'string' }),
        defineField({ name: 'company', type: 'string' }),
        defineField({ name: 'date', type: 'string' }),
        defineField({ name: 'desc', type: 'text' }),
        defineField({ name: 'order', type: 'number' })
    ]
})`,
    'volunteering.ts': `import { defineType, defineField } from 'sanity'
export default defineType({
    name: 'volunteering', title: 'Volunteering', type: 'document',
    fields: [
        defineField({ name: 'role', type: 'string' }),
        defineField({ name: 'org', type: 'string' }),
        defineField({ name: 'date', type: 'string' }),
        defineField({ name: 'desc', type: 'text' }),
        defineField({ name: 'order', type: 'number' })
    ]
})`
};

const indexTsContent = `import profile from './profile'
import stat from './stat'
import skill from './skill'
import experience from './experience'
import volunteering from './volunteering'

export const schemaTypes = [profile, stat, skill, experience, volunteering]
`;

// --- 2. Write Schemas to Studio ---
function writeSchemas() {
    if (fs.existsSync(SCHEMA_DIR)) {
        console.log(`📂 Writing schemas to: ${SCHEMA_DIR}`);
        Object.entries(schemas).forEach(([filename, content]) => {
            fs.writeFileSync(path.join(SCHEMA_DIR, filename), content);
            console.log(`   - Wrote ${filename}`);
        });
        fs.writeFileSync(path.join(SCHEMA_DIR, 'index.ts'), indexTsContent);
        console.log('   - Wrote index.ts');
        console.log('✅ Schemas updated locally. (You may need to restart Sanity Studio)');
    } else {
        console.warn(`⚠️ Could not find Sanity Studio at ${SCHEMA_DIR}. Skipping schema file writing.`);
        console.log('   (Data will still be uploaded, but Studio might complain about "Unknown Type" until you fix schemas there)');
    }
}

// --- 3. Upload Data ---
const client = createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    token, // Write Token
    useCdn: false,
});

function loadSeedData() {
    if (!fs.existsSync(SEED_DATA_PATH)) {
        console.error(`❌ Seed file not found: ${SEED_DATA_PATH}`);
        process.exit(1);
    }
    try {
        const raw = fs.readFileSync(SEED_DATA_PATH, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        console.error(`❌ Failed to read or parse ${SEED_DATA_PATH}:`, err.message);
        process.exit(1);
    }
}

async function uploadData() {
    const data = loadSeedData();
    console.log(`\n🚀 Uploading Data from ${path.relative(__dirname, SEED_DATA_PATH)} to Project: ${projectId}`);

    const transaction = client.transaction();

    const profile = data.profile ?? {};
    // Fields match Sanity `profile` schema only (see schema snippet above). Extra keys in JSON are ignored here.
    transaction.createOrReplace({
        _id: 'profile-singleton',
        _type: 'profile',
        name: profile.name ?? '',
        roles: Array.isArray(profile.roles) ? profile.roles : [],
        summary: profile.summary ?? '',
        aboutHighlight: profile.aboutHighlight ?? ''
    });

    (data.stats ?? []).forEach((s, i) => {
        transaction.create({
            _type: 'stat',
            label: s.label ?? '',
            value: typeof s.value === 'number' ? s.value : Number(s.value) || 0,
            suffix: s.suffix ?? '',
            order: typeof s.order === 'number' ? s.order : i + 1
        });
    });

    (data.skills ?? []).forEach((s, i) => {
        transaction.create({
            _type: 'skill',
            category: s.category ?? '',
            items: Array.isArray(s.items) ? s.items : [],
            order: typeof s.order === 'number' ? s.order : i + 1
        });
    });

    (data.experience ?? []).forEach((e, i) => {
        transaction.create({
            _type: 'experience',
            role: e.role ?? '',
            company: e.company ?? '',
            date: e.date ?? '',
            desc: e.desc ?? '',
            order: typeof e.order === 'number' ? e.order : i + 1
        });
    });

    (data.volunteering ?? []).forEach((v, i) => {
        transaction.create({
            _type: 'volunteering',
            role: v.role ?? '',
            org: v.org ?? '',
            date: v.date ?? '',
            desc: v.desc ?? '',
            order: typeof v.order === 'number' ? v.order : i + 1
        });
    });

    try {
        await transaction.commit();
        console.log('✅ Data uploaded successfully!');
    } catch (err) {
        console.error('❌ Data upload failed:', err.message);
    }
}

// Run
writeSchemas();
uploadData();
