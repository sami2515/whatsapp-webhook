/**
 * TestTayar.pk - Academic Query & Fact Cache
 * 
 * Provides short-TTL in-memory caching for live search results and verified facts.
 */

const cacheStore = new Map();
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 Hour for live search queries

const normalizeKey = (key = '') => {
    return key.toLowerCase().replace(/\s+/g, ' ').trim();
};

export const getCachedAcademicData = (queryKey = '') => {
    const key = normalizeKey(queryKey);
    const entry = cacheStore.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
        cacheStore.delete(key);
        return null;
    }

    return entry.data;
};

export const setCachedAcademicData = (queryKey = '', data = {}, ttlMs = DEFAULT_TTL_MS) => {
    const key = normalizeKey(queryKey);
    cacheStore.set(key, {
        data,
        cachedAt: new Date().toISOString(),
        expiresAt: Date.now() + ttlMs
    });
};

export const clearAcademicCache = () => {
    cacheStore.clear();
};
