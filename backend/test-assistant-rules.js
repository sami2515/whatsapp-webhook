import { detectIntent, getRuleBasedAssistantResponse } from './utils/assistantLogic.js';

const testCases = [
    { text: 'Ji', expectedIntent: 'nonsense', expectedRuleResult: null },
    { text: 'Jee', expectedIntent: 'nonsense', expectedRuleResult: null },
    { text: 'Assalam o Alikum', expectedIntent: 'greeting', expectedRuleResult: null },
    { text: 'hello there', expectedIntent: 'greeting', expectedRuleResult: null },
    { text: 'hi sami', expectedIntent: 'greeting', expectedRuleResult: null },
    { text: 'fuck', expectedIntent: 'abusive', expectedRuleResult: 'abuse_reply' },
    { text: 'hi sami, i want a web development build plan.', expectedIntent: 'new_project', expectedRuleResult: 'new_project_reply' }
];

console.log("Starting tests on assistantLogic...");
console.log("-----------------------------------------");

let failed = 0;
for (const tc of testCases) {
    const detected = detectIntent(tc.text);
    const ruleRes = getRuleBasedAssistantResponse({
        messageText: tc.text,
        intent: detected,
        lead: {},
        parsedLead: tc.text.includes('build plan') ? { serviceType: 'E-commerce' } : {}
    });

    console.log(`Input: "${tc.text}"`);
    console.log(`  - Detected Intent: "${detected}" (Expected: "${tc.expectedIntent}")`);
    
    let isRuleCorrect = false;
    if (tc.expectedRuleResult === null) {
        isRuleCorrect = (ruleRes === null);
    } else if (tc.expectedRuleResult === 'abuse_reply') {
        isRuleCorrect = (ruleRes && ruleRes.reply && ruleRes.reply.includes('conversation'));
    } else if (tc.expectedRuleResult === 'new_project_reply') {
        isRuleCorrect = (ruleRes && ruleRes.reply && ruleRes.reply.includes('Jee samajh gaya'));
    }

    console.log(`  - Rule Reply: ${ruleRes ? `"${ruleRes.reply}"` : 'null'} (Match expected: ${isRuleCorrect})`);

    if (detected !== tc.expectedIntent || !isRuleCorrect) {
        console.error("  ==> TEST FAILED!");
        failed++;
    } else {
        console.log("  ==> Test Passed");
    }
    console.log("-----------------------------------------");
}

if (failed === 0) {
    console.log("ALL TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
} else {
    console.error(`${failed} test(s) failed.`);
    process.exit(1);
}
