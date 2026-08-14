/**
 * TestTayar.pk - Multi-Provider Web Search & Query Planner Engine
 * 
 * Provides live search capabilities across NTS, universities, and education portals.
 * Uses provider abstraction (DuckDuckGo HTML / Tavily / Direct HTTP) with timeouts and caching.
 */

import axios from 'axios';
import { scoreAndRankSources } from './sourceRanker.js';
import { getCachedAcademicData, setCachedAcademicData } from './academicCache.js';

const SEARCH_TIMEOUT_MS = 3500;

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

// Provider 1: Bing Live Web Scraper & Search (Fast & High-Reliability)
class BingProvider {
    name = 'Bing';

    async search(query = '', limit = 5) {
        try {
            const encoded = encodeURIComponent(query);
            const response = await axios.get(`https://www.bing.com/search?q=${encoded}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
                },
                timeout: SEARCH_TIMEOUT_MS
            });

            const itemMatches = response.data?.match(/<li class="b_algo"[\s\S]*?<\/li>/gi) || [];
            const results = [];

            for (const item of itemMatches.slice(0, limit)) {
                const linkMatch = item.match(/<h2[^>]*><a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a><\/h2>/i) || item.match(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
                const snippetMatch = item.match(/<p[^>]*>([\s\S]*?)<\/p>/i) || item.match(/<div class="b_caption"[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);

                const rawUrl = linkMatch ? linkMatch[1] : '';
                const url = decodeBingUrl(rawUrl);
                const title = linkMatch ? linkMatch[2].replace(/<[^>]+>/g, '').trim() : '';
                const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, '').trim() : '';

                if (url && snippet) {
                    results.push({ url, title, snippet });
                }
            }

            return results;
        } catch (err) {
            console.warn(`[WebSearchProvider: Bing] Query "${query}" failed or timed out: ${err.message}`);
            return [];
        }
    }
}

// Provider 2: Tavily Search Provider (if TAVILY_API_KEY is configured in .env)
class TavilyProvider {
    name = 'Tavily';

    async search(query = '', limit = 5) {
        const apiKey = process.env.TAVILY_API_KEY;
        if (!apiKey) return null; // Fall through to next provider

        try {
            const response = await axios.post('https://api.tavily.com/search', {
                api_key: apiKey,
                query,
                search_depth: 'basic',
                include_answer: false,
                max_results: limit
            }, {
                timeout: SEARCH_TIMEOUT_MS
            });

            const rawResults = response.data?.results || [];
            return rawResults.map((r) => ({
                url: r.url,
                title: r.title,
                snippet: r.content
            }));
        } catch (err) {
            console.warn(`[WebSearchProvider: Tavily] Search failed: ${err.message}`);
            return null;
        }
    }
}

// Provider 3: DuckDuckGo Instant HTML
class DuckDuckGoProvider {
    name = 'DuckDuckGo';

    async search(query = '', limit = 5) {
        try {
            const encoded = encodeURIComponent(query);
            const response = await axios.get(`https://html.duckduckgo.com/html/?q=${encoded}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: SEARCH_TIMEOUT_MS
            });

            const html = response.data || '';
            const results = [];
            const resultRegex = /<a class="result__url"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
            let match;

            while ((match = resultRegex.exec(html)) !== null && results.length < limit) {
                let link = match[1];
                if (link.includes('uddg=')) {
                    const actualUrlMatch = link.match(/uddg=([^&]+)/);
                    if (actualUrlMatch) link = decodeURIComponent(actualUrlMatch[1]);
                }
                const title = match[2].replace(/<[^>]+>/g, '').trim();
                const snippet = match[3].replace(/<[^>]+>/g, '').trim();

                if (link && snippet) {
                    results.push({ url: link, title, snippet });
                }
            }

            return results;
        } catch (err) {
            return [];
        }
    }
}

export class WebSearchEngine {
    constructor() {
        this.bingProvider = new BingProvider();
        this.tavilyProvider = new TavilyProvider();
        this.ddgProvider = new DuckDuckGoProvider();
    }

    /**
     * Generates high-yield search queries from student profile & query context
     */
    planSearchQueries(studentProfile = {}, rawQuery = '') {
        const queries = [];
        const { targetDegree, university, likelyTest, testingAgency, board, requestedYears } = studentProfile;
        const raw = rawQuery.toLowerCase();

        // 1. Education Board Result Queries (BIEK, FBISE, BISE)
        if (board || /biek|fbise|bise|result/i.test(raw)) {
            if (/biek/i.test(raw) || board === 'BIEK Karachi') {
                queries.push(`site:biek.edu.pk HSC Part 2 Pre Engineering result 2026 announcement date`);
                queries.push(`BIEK Karachi 12th class Pre Engineering result 2026 announcement date`);
            } else if (/fbise/i.test(raw) || board === 'FBISE Federal Board') {
                queries.push(`site:fbise.edu.pk HSSC Part 2 result announcement date 2026`);
            } else if (board) {
                queries.push(`${board} 12th class intermediate result announcement date 2026`);
            } else if (/result/i.test(raw)) {
                queries.push(`${rawQuery} announcement date Pakistan`);
            }
        }

        // 2. Testing Agency / Commission Queries (FPSC, PPSC, SPSC, FIA, ASF, PMDC)
        if (testingAgency === 'FIA' || /fia/i.test(raw)) {
            queries.push(`site:npftas.pk FIA LDC typing test schedule date 2025 2026`);
            queries.push(`FIA LDC typing test schedule date roll number slip`);
        } else if (testingAgency === 'FPSC' || /fpsc/i.test(raw)) {
            queries.push(`site:fpsc.gov.pk ${targetDegree || likelyTest || 'syllabus'} syllabus criteria`);
            queries.push(`FPSC ${targetDegree || likelyTest || 'exam'} syllabus test pattern`);
        } else if (testingAgency === 'PPSC' || /ppsc/i.test(raw)) {
            queries.push(`site:ppsc.gop.pk ${targetDegree || likelyTest || 'syllabus'} syllabus paper pattern`);
            queries.push(`PPSC ${targetDegree || likelyTest || 'exam'} test criteria`);
        } else if (testingAgency === 'ASF' || /asf/i.test(raw)) {
            queries.push(`site:joinasf.gov.pk ${targetDegree || 'ASI'} physical test written test syllabus`);
        } else if (/mdcat/i.test(raw) || likelyTest === 'MDCAT') {
            queries.push(`site:pmdc.pk MDCAT syllabus registration dates eligibility`);
            queries.push(`MDCAT PMDC latest syllabus paper pattern`);
        } else if (/lat/i.test(raw) || likelyTest === 'LAT') {
            queries.push(`site:etc.hec.gov.pk Law Admission Test LAT syllabus pattern`);
        }

        // 3. University & Program Specific Queries (AIOU, VU, COMSATS, NUST, etc.)
        if (university || /aiou|vu/i.test(raw)) {
            if (/aiou/i.test(university) || /aiou/i.test(raw)) {
                queries.push(`site:aiou.edu.pk ${targetDegree || 'ADP'} admission last date schedule 2026`);
                queries.push(`AIOU ${targetDegree || 'Associate Degree'} admission schedule last date 2026`);
            } else if (/vu/i.test(university) || /vu|virtual/i.test(raw)) {
                queries.push(`site:vu.edu.pk ${targetDegree || 'admission'} last date schedule 2026`);
            } else if (/comsats/i.test(university)) {
                queries.push(`site:comsats.edu.pk ${targetDegree || 'Pharm-D'} admission eligibility NTS`);
                queries.push(`site:lahore.comsats.edu.pk ${targetDegree || 'Pharm-D'} admission requirements`);
            } else if (/nust/i.test(university)) {
                queries.push(`site:nust.edu.pk ${targetDegree || 'NET'} admission eligibility criteria`);
            } else if (/fast|nuces/i.test(university)) {
                queries.push(`site:nu.edu.pk ${targetDegree || 'admission'} eligibility test criteria`);
            } else if (/uet/i.test(university)) {
                queries.push(`site:uet.edu.pk ${targetDegree || 'ECAT'} admission criteria`);
            } else {
                queries.push(`${university} ${targetDegree || 'admission'} eligibility criteria last date 2026 Pakistan`);
            }
        }

        // 4. Jobs & Vacancies without screening test
        if (/job|sindh|without test|bina test|screening/i.test(raw)) {
            if (/sindh/i.test(raw)) {
                queries.push(`Sindh government jobs without screening test STS IBA`);
                queries.push(`Sindh govt jobs walk in interview BPS 1 to 4 daily jang express`);
            } else {
                queries.push(`${rawQuery} Pakistan jobs`);
            }
        }

        // 5. NTS Test Schedule & Pattern Queries
        if (likelyTest && /nat|gat/i.test(likelyTest) || /nts/i.test(raw)) {
            const testName = likelyTest || 'NAT';
            if (requestedYears && (requestedYears.includes(2027) || requestedYears.includes(2028))) {
                queries.push(`site:nts.org.pk ${testName} 2027 schedule announcement`);
                queries.push(`site:nts.org.pk ${testName} test schedule`);
            } else {
                queries.push(`site:nts.org.pk ${testName} paper pattern syllabus`);
                queries.push(`site:nts.org.pk NAT schedule test dates`);
            }
        }

        // 6. General / Out-of-topic queries
        if (queries.length === 0) {
            const clean = rawQuery
                .replace(/[^\w\s-]/g, ' ')
                .replace(/\b(kia|kya|hai|hein|h|batao|bata|dyn|dein|sr|sir|please|plz)\b/gi, '')
                .replace(/\s+/g, ' ')
                .trim();
            queries.push(`${clean} Pakistan`);
            queries.push(clean);
        }

        return queries.slice(0, 3);
    }

    /**
     * Executes multi-query search with caching and official source ranking
     */
    async executeAcademicSearch(studentProfile = {}, rawQuery = '') {
        const plannedQueries = this.planSearchQueries(studentProfile, rawQuery);
        const cacheKey = `search_${studentProfile.university || ''}_${studentProfile.targetDegree || ''}_${studentProfile.likelyTest || ''}_${plannedQueries.join('|')}`;

        const cached = getCachedAcademicData(cacheKey);
        if (cached) {
            return cached;
        }

        const allRawResults = [];

        for (const query of plannedQueries) {
            let results = null;

            // 1. Try Bing Provider (Fast & reliable live web search)
            results = await this.bingProvider.search(query, 4);

            // 2. Try Tavily if available
            if ((!results || results.length === 0) && process.env.TAVILY_API_KEY) {
                results = await this.tavilyProvider.search(query, 4);
            }

            // 3. Fallback to DuckDuckGo
            if (!results || results.length === 0) {
                results = await this.ddgProvider.search(query, 4);
            }

            if (Array.isArray(results) && results.length > 0) {
                allRawResults.push(...results);
            }
        }

        // Deduplicate results by URL
        const seenUrls = new Set();
        const uniqueResults = [];
        for (const res of allRawResults) {
            if (res.url && !seenUrls.has(res.url)) {
                seenUrls.add(res.url);
                uniqueResults.push(res);
            }
        }

        // Score and rank sources
        const rankedResults = scoreAndRankSources(uniqueResults, studentProfile);

        const searchOutput = {
            queriesExecuted: plannedQueries,
            rankedResults: rankedResults.slice(0, 6),
            hasOfficialResults: rankedResults.some((r) => r.isOfficial),
            searchedAt: new Date().toISOString()
        };

        setCachedAcademicData(cacheKey, searchOutput, 60 * 60 * 1000); // 1 Hour TTL
        return searchOutput;
    }
}

export const webSearchEngine = new WebSearchEngine();
