import { detectIntent, getRuleBasedAssistantResponse, inferLeadUpdateFromMessage } from './utils/assistantLogic.js';

const testCases = [
    {
        name: 'Islamic Greeting (Walaikum Assalam)',
        text: 'Assalam o Alikum',
        expectedIntent: 'greeting_salam',
        checkReply: (reply) => reply.startsWith('Walaikum Assalam') && !reply.includes('Rs. 300')
    },
    {
        name: 'English Greeting (Hello / Hi)',
        text: 'Hello',
        expectedIntent: 'greeting_hello',
        checkReply: (reply) => reply.startsWith('Hello') && !reply.includes('Walaikum Assalam')
    },
    {
        name: 'General Book Inquiry (Must provide details & ask for post)',
        text: 'Mujhe preparation book aur pdf notes chahiye',
        expectedIntent: 'ask_pdf_book',
        checkReply: (reply) => reply.includes('post') && reply.includes('300')
    },
    {
        name: 'GHQ LDC Book Inquiry (Clerical Tailored + Direct Accounts)',
        text: 'GHQ LDC ki preparation book kitne ki hai aur payment kaise karni hai?',
        expectedIntent: 'ask_pdf_book',
        checkReply: (reply) => reply.includes('past papers') && reply.includes('03039512277') && reply.includes('01990112309796') && !reply.includes('+92 318')
    },
    {
        name: 'Police ASI Book Inquiry (Uniform Tailored + Direct Accounts)',
        text: 'Islamabad Police ASI ke liye notes aur book chahiye',
        expectedIntent: 'ask_pdf_book',
        checkReply: (reply) => reply.includes('laws') && reply.includes('current affairs') && reply.includes('03039512277')
    },
    {
        name: 'Payment Proof Handoff (Direct delivery acknowledgment + [PAUSE])',
        text: 'Meny JazzCash se 300 rupay bhej diye hain ye screenshot hai book send kr dein',
        expectedIntent: 'payment_proof_submitted',
        checkReply: (reply) => reply.includes('[PAUSE]') && reply.includes('deliver')
    },
    {
        name: 'Payment Proof Typo (Done pavement)',
        text: 'Done pavement',
        expectedIntent: 'payment_proof_submitted',
        checkReply: (reply) => reply.includes('[PAUSE]') && reply.includes('deliver')
    },
    {
        name: 'Typing Coaching (How to increase speed)',
        text: 'typing speed fast kaise karein aur mistakes kam kaise hon?',
        expectedIntent: 'ask_typing_coaching',
        checkReply: (reply) => reply.includes('accuracy') && reply.includes('Home Row')
    },
    {
        name: 'GHQ LDC Typing Inquiry',
        text: 'GHQ LDC ke liye typing test ka kya criteria hai?',
        expectedIntent: 'ask_department_ldc',
        checkReply: (reply) => reply.includes('GHQ') && reply.includes('30 WPM')
    },
    {
        name: 'Discount / Bargaining Inquiry',
        text: 'kuch paise munasib ho sakte hain kya book ke?',
        expectedIntent: 'ask_discount',
        checkReply: (reply) => reply.includes('300') && reply.includes('munasib')
    },
    {
        name: 'Website Guide Link (NTS Preparation Guide)',
        text: 'Assalam-o-Alaikum TestTayar.pk team, I want to contact you regarding:\n\nPage Link: https://testtayar.pk/guides/nts-test-preparation-guide-syllabus-and-strategy',
        expectedIntent: 'website_page_guide',
        checkReply: (reply) => reply.includes('NTS') && reply.includes('Rs. 300')
    },
    {
        name: 'Website Typing Room Link (LDC Room)',
        text: 'Assalam-o-Alaikum TestTayar.pk team, I want to contact you regarding:\n\nPage Link: https://testtayar.pk/typing-test/ldc',
        expectedIntent: 'website_page_typing',
        checkReply: (reply) => reply.includes('30 WPM') && reply.includes('accuracy')
    },
    {
        name: 'Website MCQs Link (Current Affairs)',
        text: 'Assalam-o-Alaikum TestTayar.pk team, I want to contact you regarding:\n\nPage Link: https://testtayar.pk/mcqs/current-affairs',
        expectedIntent: 'website_page_mcqs',
        checkReply: (reply) => reply.includes('Current Affairs') && reply.includes('free')
    },
    {
        name: 'Wrong MCQ / Bug Report',
        text: 'is mcq ka option b ghalat hai sahi answer option c hai mistake in mcq',
        expectedIntent: 'report_bug_or_wrong_mcq',
        checkReply: (reply) => reply.includes('editorial team') && reply.includes('point out')
    }
];

console.log("Starting TestTayar Book Flow & Logic Tests...\n");

let failed = 0;
for (const tc of testCases) {
    const detected = detectIntent(tc.text);
    const leadUpdate = inferLeadUpdateFromMessage(tc.text);
    const ruleRes = getRuleBasedAssistantResponse(detected, tc.text, leadUpdate);

    console.log(`============================================================`);
    console.log(`Test: ${tc.name}`);
    console.log(`Input: "${tc.text}"`);
    console.log(`  - Detected Intent: "${detected}" (Expected: "${tc.expectedIntent}")`);
    console.log(`  - Extracted Lead:`, JSON.stringify(leadUpdate));
    console.log(`  - Bot Reply:\n${ruleRes?.reply}`);
    console.log(`  - Paused AI: ${ruleRes?.pauseAI || false}`);

    const isIntentOk = detected === tc.expectedIntent;
    const isReplyOk = tc.checkReply ? tc.checkReply(ruleRes?.reply || '') : true;

    if (!isIntentOk || !isReplyOk) {
        console.error("  ==> TEST FAILED!");
        failed++;
    } else {
        console.log("  ==> Test Passed ✅");
    }
    console.log(`============================================================\n`);
}

if (failed === 0) {
    console.log("ALL BOOK & PAYMENT FLOW TESTS PASSED! 🚀");
    process.exit(0);
} else {
    console.error(`${failed} test(s) failed. ❌`);
    process.exit(1);
}
