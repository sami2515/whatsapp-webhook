import axios from 'axios';

function decodeBingUrl(rawUrl = '') {
    if (!rawUrl) return '';
    const match = rawUrl.match(/[?&]u=a1([a-zA-Z0-9_\-]+)/);
    if (match) {
        try {
            let base64 = match[1].replace(/-/g, '+').replace(/_/g, '/');
            while (base64.length % 4) base64 += '=';
            return Buffer.from(base64, 'base64').toString('utf-8');
        } catch {}
    }
    return rawUrl;
}

async function testQuery(query) {
    try {
        console.log(`\n=== Testing Search for: "${query}" ===`);
        const res = await axios.get(`https://www.bing.com/search?q=${encodeURIComponent(query)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            },
            timeout: 5000
        });

        const itemMatches = res.data.match(/<li class="b_algo"[\s\S]*?<\/li>/gi) || [];
        console.log("Found results count:", itemMatches.length);

        for (const item of itemMatches.slice(0, 3)) {
            const linkMatch = item.match(/<h2[^>]*><a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a><\/h2>/i) || item.match(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
            const snippetMatch = item.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
            
            const rawUrl = linkMatch ? linkMatch[1] : '';
            const actualUrl = decodeBingUrl(rawUrl);
            const title = linkMatch ? linkMatch[2].replace(/<[^>]+>/g, '').trim() : '';
            const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, '').trim() : '';
            
            console.log(`  - Title: ${title}`);
            console.log(`  - URL: ${actualUrl}`);
            console.log(`  - Snippet: ${snippet}\n`);
        }
    } catch (e) {
        console.error("Search Error:", e.message);
    }
}

async function run() {
    await testQuery('Sindh government jobs without test STS IBA');
    await testQuery('FIA LDC typing test date 2025 2026');
}

run();
