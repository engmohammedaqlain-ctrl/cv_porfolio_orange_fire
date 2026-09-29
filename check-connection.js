
const projectId = 'k6dhober';
const dataset = 'production';
const url = `https://${projectId}.api.sanity.io/v2021-10-21/data/query/${dataset}?query=*[_type=="profile"][0]`;

console.log(`Checking connectivity to: ${url}`);

const check = async () => {
    try {
        const res = await fetch(url);
        console.log(`Status: ${res.status} ${res.statusText}`);

        if (res.ok) {
            const data = await res.json();
            console.log('Response:', JSON.stringify(data).substring(0, 200) + '...');
            console.log('\n✅ SUCCESS: Project ID exists and is reachable!');
            console.log('If your browser still fails, it is likely a CORS issue.');
            console.log(`Please go to https://sanity.io/manage/project/${projectId}/api#cors-origins`);
            console.log('And add: http://localhost:5173');
        } else {
            console.log('\n❌ ERROR: Project ID might be invalid or dataset "production" is missing.');
            console.log('Verify Project ID at https://sanity.io/manage');
        }
    } catch (e) {
        console.error(`\n❌ NETWORK ERROR: ${e.message}`);
        if (e.cause && e.cause.code === 'ENOTFOUND') {
            console.error(`The Project ID "${projectId}" does not seem to exist (DNS lookup failed).`);
            console.log('Please double check your config.');
        }
    }
};

check();
