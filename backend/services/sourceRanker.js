/**
 * TestTayar.pk - Official Source Ranker
 * 
 * Ranks search results prioritizing official testing and university portals.
 * Filters out low-credibility blogs and irrelevant pages.
 */

const OFFICIAL_DOMAINS = [
    { pattern: /nts\.org\.pk/i, name: 'National Testing Service (NTS)', authority: 'official_testing_body', baseScore: 100 },
    { pattern: /comsats\.edu\.pk/i, name: 'COMSATS University Islamabad', authority: 'official_university', baseScore: 95 },
    { pattern: /hec\.gov\.pk/i, name: 'Higher Education Commission (HEC)', authority: 'official_government_regulator', baseScore: 95 },
    { pattern: /nust\.edu\.pk/i, name: 'NUST University', authority: 'official_university', baseScore: 95 },
    { pattern: /nu\.edu\.pk/i, name: 'FAST NUCES University', authority: 'official_university', baseScore: 95 },
    { pattern: /uet\.edu\.pk/i, name: 'UET Lahore', authority: 'official_university', baseScore: 95 },
    { pattern: /pu\.edu\.pk/i, name: 'Punjab University', authority: 'official_university', baseScore: 95 },
    { pattern: /fpsc\.gov\.pk/i, name: 'Federal Public Service Commission (FPSC)', authority: 'official_government_agency', baseScore: 95 },
    { pattern: /ppsc\.gop\.pk/i, name: 'Punjab Public Service Commission (PPSC)', authority: 'official_government_agency', baseScore: 95 },
    { pattern: /\.gov\.pk/i, name: 'Government of Pakistan Portal', authority: 'official_government_agency', baseScore: 90 },
    { pattern: /\.edu\.pk/i, name: 'Pakistan Higher Education Institute', authority: 'educational_institution', baseScore: 85 }
];

const REPUTABLE_PORTALS = [
    { pattern: /ilmkidunya\.com/i, name: 'IlmKiDunya Portal', baseScore: 65 },
    { pattern: /eduvision\.edu\.pk/i, name: 'Eduvision Pakistan', baseScore: 65 },
    { pattern: /parho\.com/i, name: 'Parho Pakistan', baseScore: 60 }
];

export const scoreAndRankSources = (rawResults = [], searchTarget = {}) => {
    if (!Array.isArray(rawResults)) return [];

    return rawResults
        .map((item) => {
            const url = item.url || item.link || '';
            const title = item.title || '';
            const snippet = item.snippet || item.body || item.description || '';

            let score = 30; // base score for generic web results
            let sourceName = 'Web Source';
            let authorityType = 'generic_web';
            let isOfficial = false;

            // Check against official domain list
            for (const off of OFFICIAL_DOMAINS) {
                if (off.pattern.test(url)) {
                    score = off.baseScore;
                    sourceName = off.name;
                    authorityType = off.authority;
                    isOfficial = true;
                    break;
                }
            }

            // Check against reputable education portals if not official
            if (!isOfficial) {
                for (const rep of REPUTABLE_PORTALS) {
                    if (rep.pattern.test(url)) {
                        score = rep.baseScore;
                        sourceName = rep.name;
                        authorityType = 'reputable_education_portal';
                        break;
                    }
                }
            }

            // Boost score if title or snippet matches target degree or test
            if (searchTarget.likelyTest && (new RegExp(searchTarget.likelyTest, 'i')).test(`${title} ${snippet}`)) {
                score += 10;
            }
            if (searchTarget.targetDegree && (new RegExp(searchTarget.targetDegree, 'i')).test(`${title} ${snippet}`)) {
                score += 10;
            }
            if (searchTarget.university && (new RegExp(searchTarget.university, 'i')).test(`${title} ${snippet}`)) {
                score += 10;
            }

            return {
                url,
                title,
                snippet,
                score,
                sourceName,
                authorityType,
                isOfficial
            };
        })
        .sort((a, b) => b.score - a.score);
};
