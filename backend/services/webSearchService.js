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

// Provider 1: DuckDuckGo Instant HTML & Lite Scraper
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
                    results.push({
                        url: link,
                        title,
                        snippet
                    });
                }
            }

            return results;
        } catch (err) {
            console.warn(`[WebSearchProvider: DuckDuckGo] Query "${query}" failed or timed out: ${err.message}`);
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

export class WebSearchEngine {
    constructor() {
        this.tavilyProvider = new TavilyProvider();
        this.ddgProvider = new DuckDuckGoProvider();
    }

    /**
     * Generates high-yield search queries from student profile & query context
     */
    planSearchQueries(studentProfile = {}, rawQuery = '') {
        const queries = [];
        const { targetDegree, university, likelyTest, requestedYears } = studentProfile;

        // 1. University & Program Specific Queries
        if (university && targetDegree) {
            if (/comsats/i.test(university)) {
                queries.push(`site:comsats.edu.pk ${targetDegree} admission eligibility NTS`);
                queries.push(`site:lahore.comsats.edu.pk ${targetDegree} admission requirements`);
            } else {
                queries.push(`${university} ${targetDegree} admission eligibility NTS criteria`);
            }
        }

        // 2. NTS Test Schedule & Pattern Queries
        if (likelyTest || /nts/i.test(rawQuery)) {
            const testName = likelyTest || 'NAT';
            if (requestedYears && (requestedYears.includes(2027) || requestedYears.includes(2028))) {
                queries.push(`site:nts.org.pk ${testName} 2027 schedule announcement`);
                queries.push(`site:nts.org.pk ${testName} test schedule`);
            } else {
                queries.push(`site:nts.org.pk ${testName} paper pattern syllabus`);
                queries.push(`site:nts.org.pk NAT schedule test dates`);
            }
        }

        // 3. Fallback targeted clean query
        if (queries.length === 0) {
            const clean = rawQuery.replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
            queries.push(`Pakistan ${clean}`);
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

            // Try Tavily if available
            if (process.env.TAVILY_API_KEY) {
                results = await this.tavilyProvider.search(query, 4);
            }

            // Fallback to DuckDuckGo
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
