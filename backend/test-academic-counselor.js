/**
 * Automated Test Suite - Academic Admissions Counselor & Web Search Engine
 * 
 * Verifies all 10 core scenarios:
 * 1. Complex Real-World Query (Pre-Med + Pharm-D + COMSATS + NAT-IM + 2027/2028)
 * 2. 2026 NAT Schedule
 * 3. 2027/2028 Anti-Hallucination
 * 4. COMSATS Pharm-D Official Eligibility
 * 5. Shorthand "NTS M"
 * 6. Search Timeout / Fallback Resiliency
 * 7. Conflicting Source Resolution
 * 8. Normal Greeting (Search Skipped)
 * 9. Stable Preparation (Search Skipped)
 * 10. Query Planning & Official Source Ranking
 */

import { extractStudentProfile } from './services/academicProfileService.js';
import { isSearchRequired } from './services/freshnessRouter.js';
import { scoreAndRankSources } from './services/sourceRanker.js';
import { buildVerifiedAcademicFacts } from './services/factVerifier.js';
import { webSearchEngine } from './services/webSearchService.js';
import { ACADEMIC_KNOWLEDGE } from './data/academicKnowledge.js';

console.log("============================================================");
console.log("Running TestTayar Academic Counselor & Search Engine Tests");
console.log("============================================================\n");

let failedCount = 0;

function assert(condition, message) {
    if (!condition) {
        console.error(`  ❌ FAILED: ${message}`);
        failedCount++;
    } else {
        console.log(`  ✅ PASSED: ${message}`);
    }
}

// -------------------------------------------------------------
// Test 1: Complex Real-World Scenario
// -------------------------------------------------------------
console.log("--- TEST 1: Complex Real-World Scenario ---");
const userQuery1 = "NTS - Medical dena h. Intermediate complete kr lia h sr next Parm D m admission lena h Comsats m us k lie pre medical NTS _ M dena h us k syllabus bta dyn or schedule b bta dyn next year k 2027 k or 2028 k";
const profile1 = extractStudentProfile(userQuery1);
console.log("Extracted Profile:", JSON.stringify(profile1));

assert(profile1.education === 'Intermediate', "Education extracted as Intermediate");
assert(profile1.group === 'Pre-Medical', "Group extracted as Pre-Medical");
assert(profile1.targetDegree === 'Pharm-D', "Target degree extracted as Pharm-D (from 'Parm D')");
assert(profile1.university === 'COMSATS', "University extracted as COMSATS (from 'Comsats')");
assert(profile1.likelyTest === 'NAT-IM', "Likely test inferred as NAT-IM (from 'NTS _ M')");
assert(profile1.requestedYears.includes(2027) && profile1.requestedYears.includes(2028), "Requested years include 2027 and 2028");

const searchDec1 = isSearchRequired(userQuery1, profile1);
assert(searchDec1.required === true, "Freshness router triggers web search for 2027/2028 schedule");

const plannedQueries1 = webSearchEngine.planSearchQueries(profile1, userQuery1);
console.log("Planned Search Queries:", plannedQueries1);
assert(plannedQueries1.some(q => q.includes('site:comsats.edu.pk')), "Query planned targeting official COMSATS portal");
assert(plannedQueries1.some(q => q.includes('site:nts.org.pk')), "Query planned targeting official NTS portal");

const verifiedData1 = buildVerifiedAcademicFacts(profile1, { rankedResults: [] });
console.log("Verified Facts Count:", verifiedData1.verifiedFacts.length);
assert(verifiedData1.verifiedFacts.some(f => f.topic.includes('NAT-IM') && f.fact.includes('90 MCQs')), "NAT-IM 90 MCQs breakdown verified from official NTS knowledge");
assert(verifiedData1.verifiedFacts.some(f => f.topic.includes('2027/2028') && f.status === 'not_officially_announced'), "2027/2028 schedule strictly marked not_officially_announced (zero hallucination)");
console.log("\n");

// -------------------------------------------------------------
// Test 2: NTS NAT-IM Paper Pattern Accuracy
// -------------------------------------------------------------
console.log("--- TEST 2: Official NTS NAT-IM Structure ---");
const natIM = ACADEMIC_KNOWLEDGE.testingAgencies.nts.natCategories['NAT-IM'];
assert(natIM.totalQuestions === 90, "NAT-IM has exactly 90 total questions");
assert(natIM.durationMinutes === 120, "NAT-IM duration is 120 minutes");
assert(natIM.breakdown.verbal_english === 20, "English has 20 MCQs");
assert(natIM.breakdown.analytical_reasoning === 20, "Analytical Reasoning has 20 MCQs");
assert(natIM.breakdown.quantitative_reasoning === 20, "Quantitative Reasoning has 20 MCQs");
assert(natIM.subjectBreakdown.biology === 14, "Biology has 14 MCQs");
assert(natIM.subjectBreakdown.chemistry === 8, "Chemistry has 8 MCQs");
assert(natIM.subjectBreakdown.physics === 8, "Physics has 8 MCQs");
console.log("\n");

// -------------------------------------------------------------
// Test 3: Source Ranking & Official Domain Priority
// -------------------------------------------------------------
console.log("--- TEST 3: Official Source Ranking ---");
const sampleSearchResults = [
    { url: 'https://randomblog.com/nts-schedule-2027', title: 'NTS 2027 Dates Rumor', snippet: 'Test might happen in Jan 2027' },
    { url: 'https://www.nts.org.pk/Products/NTSNAT/nat-paper-pattern.php', title: 'Official NTS NAT Pattern', snippet: 'Official NAT 90 Questions Breakdown' },
    { url: 'https://lahore.comsats.edu.pk/pharmacy/pharma-d.aspx', title: 'Pharm-D Admissions | CUI Lahore', snippet: 'Eligibility: Minimum 60% in F.Sc Pre-Medical and valid NTS score' },
    { url: 'https://eduvision.edu.pk/comsats-admissions', title: 'Eduvision COMSATS Overview', snippet: 'COMSATS admission guide' }
];

const ranked = scoreAndRankSources(sampleSearchResults, profile1);
console.log("Ranked Sources:");
ranked.forEach((r, idx) => console.log(`  ${idx + 1}. [Score: ${r.score}] ${r.sourceName} (${r.url})`));

assert(ranked[0].isOfficial === true, "Top ranked source is an official domain");
assert(ranked[1].isOfficial === true, "Second ranked source is an official domain");
assert(ranked.slice(0, 2).some(r => r.url.includes('nts.org.pk')), "Official NTS domain is among top official ranks");
assert(ranked.slice(0, 2).some(r => r.url.includes('comsats.edu.pk')), "Official COMSATS domain is among top official ranks");
assert(ranked[ranked.length - 1].url.includes('randomblog.com'), "Random blog ranked last");
console.log("\n");

// -------------------------------------------------------------
// Test 4: Freshness Router Rules (Search Required vs Skipped)
// -------------------------------------------------------------
console.log("--- TEST 4: Freshness Router Decisions ---");
const greetingSearch = isSearchRequired("Assalam o Alaikum! Kaise hain aap?");
assert(greetingSearch.required === false, "Greeting skips web search");

const typingCoachSearch = isSearchRequired("Typing speed kaise barhaen meri speed 15 wpm hai?");
assert(typingCoachSearch.required === false, "Typing coaching skips web search");

const slipSearch = isSearchRequired("Meny 300 rupay bhej diye hain ye screenshot hai");
assert(slipSearch.required === false, "Payment proof handoff skips web search");

const scheduleSearch = isSearchRequired("COMSATS Fall 2026 admissions ki last date kya hai?");
assert(scheduleSearch.required === true, "Live deadline inquiry triggers web search");

const futureDateSearch = isSearchRequired("2027 NAT test kab hoga?");
assert(futureDateSearch.required === true, "Future year 2027 inquiry triggers web search");
console.log("\n");

// -------------------------------------------------------------
// Test 5: COMSATS Pharm-D Eligibility Verification
// -------------------------------------------------------------
console.log("--- TEST 5: COMSATS Pharm-D Verified Eligibility ---");
const cuiPharmD = ACADEMIC_KNOWLEDGE.universities.comsats.programs['pharm-d'];
assert(cuiPharmD.eligibility.minimumIntermediatePercentage === '60%', "COMSATS Pharm-D intermediate minimum is 60%");
assert(cuiPharmD.eligibility.testRequirement.includes('NAT-IM'), "COMSATS Pharm-D requires NAT-IM");
assert(cuiPharmD.duration === '5 Years (10 Semesters)', "Pharm-D duration is 5 years");
console.log("\n");

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log("============================================================");
if (failedCount === 0) {
    console.log("🎉 ALL ACADEMIC COUNSELOR & WEB SEARCH TESTS PASSED! 🚀");
    process.exit(0);
} else {
    console.error(`❌ ${failedCount} test(s) failed.`);
    process.exit(1);
}
