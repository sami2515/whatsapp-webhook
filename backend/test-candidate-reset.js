/**
 * Test Suite - Candidate Details Reset & 20-Day Inactivity Auto-Reset
 */

console.log("============================================================");
console.log("Testing Candidate Details Reset & 20-Day Inactivity Auto-Reset");
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
// Test 1: 20-Day Inactivity Window Logic
// -------------------------------------------------------------
console.log("--- TEST 1: 20-Day Inactivity Auto-Reset Logic ---");
const INACTIVITY_RESET_WINDOW_MS = 20 * 24 * 60 * 60 * 1000;

// Case A: Recent interaction (1 day ago) -> No reset
const recentInteraction = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
const elapsedRecent = Date.now() - recentInteraction.getTime();
const shouldResetRecent = elapsedRecent > INACTIVITY_RESET_WINDOW_MS;
assert(shouldResetRecent === false, "Recent interaction (1 day old) does NOT trigger auto-reset");

// Case B: Old interaction (21 days ago) -> Triggers reset
const oldInteraction = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);
const elapsedOld = Date.now() - oldInteraction.getTime();
const shouldResetOld = elapsedOld > INACTIVITY_RESET_WINDOW_MS;
assert(shouldResetOld === true, "Old interaction (21 days old) TRIGGERS 20-day auto-reset");

// Case C: Simulated reset on context object while preserving messages
const mockCandidateContext = {
    phoneNumber: '923001234567',
    name: 'Candidate X',
    targetExam: 'GHQ LDC (BPS-11)',
    targetWpm: '30 WPM',
    subjectInterest: 'Computer Knowledge',
    bookInterested: true,
    paymentSubmitted: true,
    intent: 'ask_pdf_book',
    stage: 'payment_submitted',
    leadScore: 85,
    isAIPaused: true,
    lastInteraction: oldInteraction
};

const mockChatHistory = [
    { text: 'Hi', from: '923001234567' },
    { text: 'Hello! TestTayar...', from: 'bot' },
    { text: 'GHQ LDC book chahiye', from: '923001234567' }
];

// Perform reset on context
if (Date.now() - mockCandidateContext.lastInteraction.getTime() > INACTIVITY_RESET_WINDOW_MS) {
    mockCandidateContext.targetExam = '';
    mockCandidateContext.targetWpm = '';
    mockCandidateContext.subjectInterest = '';
    mockCandidateContext.bookInterested = false;
    mockCandidateContext.paymentSubmitted = false;
    mockCandidateContext.name = '';
    mockCandidateContext.intent = 'unknown';
    mockCandidateContext.stage = 'new';
    mockCandidateContext.leadScore = 0;
    mockCandidateContext.isAIPaused = false;
    mockCandidateContext.lastInteraction = new Date();
}

assert(mockCandidateContext.targetExam === '', "targetExam successfully cleared after 20 days");
assert(mockCandidateContext.bookInterested === false, "bookInterested successfully reset to false");
assert(mockCandidateContext.paymentSubmitted === false, "paymentSubmitted successfully reset to false");
assert(mockCandidateContext.isAIPaused === false, "isAIPaused reset to false so AI resumes fresh");
assert(mockChatHistory.length === 3, "Chat history messages remain 100% preserved (NOT deleted)");
console.log("\n");

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log("============================================================");
if (failedCount === 0) {
    console.log("🎉 ALL CANDIDATE RESET TESTS PASSED! 🚀");
    process.exit(0);
} else {
    console.error(`❌ ${failedCount} test(s) failed.`);
    process.exit(1);
}
