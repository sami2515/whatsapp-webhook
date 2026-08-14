import dotenv from 'dotenv';
dotenv.config();

import { extractStudentProfile } from './services/academicProfileService.js';
import { isSearchRequired } from './services/freshnessRouter.js';
import { webSearchEngine } from './services/webSearchService.js';
import { buildVerifiedAcademicFacts } from './services/factVerifier.js';
import { generateAIResponse } from './services/aiService.js';

async function testSingleMessage(userMsg, history = [], context = {}) {
    console.log(`\n============================================================`);
    console.log(`USER: "${userMsg}"`);
    
    const profile = extractStudentProfile(userMsg, context.lead || {});
    console.log(`Extracted Profile:`, JSON.stringify(profile));
    
    const searchDecision = isSearchRequired(userMsg, profile);
    console.log(`Search Decision:`, searchDecision);
    
    let searchResults = {};
    if (searchDecision.required) {
        searchResults = await webSearchEngine.executeAcademicSearch(profile, userMsg);
        console.log(`Search Queries Executed:`, searchResults.queriesExecuted);
        console.log(`Search Results Count:`, searchResults.rankedResults?.length);
        if (searchResults.rankedResults?.length > 0) {
            console.log(`Top Result Snippet:`, searchResults.rankedResults[0]?.snippet?.slice(0, 150));
        }
    }
    
    const verified = buildVerifiedAcademicFacts(profile, searchResults);
    console.log(`Verified Facts:`, verified.verifiedFacts);
    
    const aiResponse = await generateAIResponse(userMsg, 'active', history, null, context);
    console.log(`\n🤖 AI REPLY:\n${aiResponse.reply}`);
    console.log(`============================================================\n`);
    return aiResponse;
}

async function runAll() {
    console.log("Starting Real-World Behavioral Audit...");
    
    let history = [];
    let lead = {};
    
    // Message 1: AIOU Admissions
    const res1 = await testSingleMessage("aiou amission kab tk open hain?", history, { lead });
    history.push({ role: 'user', content: 'aiou amission kab tk open hain?' });
    history.push({ role: 'assistant', content: res1.reply });
    lead = { ...lead, ...res1.leadUpdate };
    
    // Message 2: AIOU ADP
    const res2 = await testSingleMessage("aiou adp ky lie", history, { lead });
    history.push({ role: 'user', content: 'aiou adp ky lie' });
    history.push({ role: 'assistant', content: res2.reply });
    lead = { ...lead, ...res2.leadUpdate };
    
    // Message 3: BIEK 12th Result
    const res3 = await testSingleMessage("acha 12year pre enigineering 2026 biek ka result agya?", history, { lead });
    history.push({ role: 'user', content: 'acha 12year pre enigineering 2026 biek ka result agya?' });
    history.push({ role: 'assistant', content: res3.reply });
    lead = { ...lead, ...res3.leadUpdate };
    
    // Message 4: Sindh jobs without screening
    const res4 = await testSingleMessage("muja ye btao kya curent jobs ai hoi hain sindh ma jo bina screening tes", history, { lead });
    
    // Message 5: FIA LDC typing test date
    const res5 = await testSingleMessage("fia ldc ka test kb ha typing?", history, { lead });
}

runAll().catch(console.error);
