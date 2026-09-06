/**
 * TestTayar.pk - Knowledge Base Trained from 226 Real Candidate & Student Conversations
 * 
 * Contains real-world FAQs, student behavioral patterns, typing exam hardware advice,
 * department-specific admission & job test procedures, and natural counselor guidance.
 */

export const LEARNED_COUNSELOR_KNOWLEDGE = {
    // 1. Critical Practical Advice Learned from Real Candidate Conversations
    practicalExamAdvice: {
        keyboardAdvice: {
            topic: "Laptop vs Desktop Keyboard for Typing Tests",
            rule: "Hamesha candidates ko mashwara dein ke typing test ki tayari laptop ke flat keyboard par na karein, balkay alag se regular USB Desktop Keyboard attach kar ke practice karein.",
            reason: "Government test centers (GHQ, MOD, LDC, Police, NADRA, NTS) mein standard desktop keyboards hote hain jin ka key-travel deep hota hai. Flat laptop keyboard par practice karne wale candidates ka exam hall mein 5-10 WPM drop ho jata hai aur mistakes barh jati hain."
        },
        accuracyVsSpeed: {
            topic: "Speed vs Accuracy Golden Rule",
            rule: "Tez type karne se pehle 95%+ accuracy maintain karna zaroori hai.",
            reason: "Aksar departments (jaise MOD, PPSC, Police) mein har ghalti par negative penalty ya word deduction hoti hai. Agar speed 45 WPM ho lekin accuracy 80% ho to candidate fail ho jata hai."
        },
        rollNumberSlips: {
            topic: "Roll Number Slips & Test Dates",
            rule: "Roll number slips test date se taqreeban 7 se 10 din pehle official portal (NTS, FPSC, PPSC, STS, etc.) par upload hoti hain aur candidate ko SMS bhi aata hai.",
            advice: "Jab tak roll number slip na aaye, candidate ko syllabus aur typing practice par full focus rakhna chahiye."
        },
        physicalAndBmi: {
            topic: "Police & Uniform Forces Physical Standards & BMI",
            rule: "Islamabad Police, ASF, FIA, aur Punjab/Sindh Police ke liye physical test mein height, chest, 1.6 km (1 mile) running, aur BMI (Body Mass Index) check hota hai.",
            bmiGuidance: "Candidates apna BMI normal range (18.5 se 24.9) mein check karne ke liye online BMI Calculator (e.g. https://www.calculator.net/bmi-calculator.html) use kar sakte hain taake medical mein overweight ya underweight ka masla na aaye."
        },
        karachiBoardMarksheet: {
            topic: "BIEK Karachi Mark Sheets & Admission Documents",
            rule: "Karachi Board (BIEK Nazimabad Board Office) se duplicate mark sheet ya migration certificate nikalwane ke liye candidate ko khud ya authorized person ko original CNIC/B-form aur admit card ke sath visit karna hota hai.",
            admissionRequirement: "Universities aur colleges mein admission confirm karne ke liye original mark sheets mandatory hoti hain; photocopy sirf provisional verification ke liye chalti hai."
        }
    },

    // 2. Department & Post Specific Q&A learned from chats
    departmentSpecificQnA: [
        {
            keywords: ['irsa', 'irsa ldc', 'irsa nts'],
            topic: 'IRSA LDC (NTS) Test Preparation',
            advice: 'IRSA (Indus River System Authority) LDC test NTS ke standard clerical pattern par hota hai jisme English (Grammar/Vocabulary), General Knowledge, Pakistan Studies, Basic Computer/IT, aur relevant water/irrigation acts shamil hote hain. 3 din ki short revision ke liye TestTayar.pk ki Rs. 300 solved PDF notes book aur /typing-test/ldc par 30 WPM practice behtareen hai.'
        },
        {
            keywords: ['nadra overseas', 'nadra foreign', 'nadra posting'],
            topic: 'NADRA Overseas Posting & DEO Test',
            advice: 'NADRA Overseas test aur Data Entry Operator (DEO) ke liye 30-35+ WPM typing speed aur Computer Knowledge (MS Office shortcuts, Excel formulas, Database basics) sab se zaroori hotay hain. TestTayar par /nadra-test mock aur /typing-test/nadra simulator available hai.'
        },
        {
            keywords: ['ghq ldc', 'ghq clerical', 'mod ldc', 'mod clerical'],
            topic: 'GHQ & MOD Clerical Test Strategy',
            advice: 'GHQ aur MOD tests mein typing speed minimum 30 WPM hoti hai lekin safe selection ke liye 35+ WPM target karein. MOD typing mein aksar Backspace allow nahi hota ya negative deduction hoti hai, is liye TestTayar ka No-Backspace mode (/typing-test/mod) use karein.'
        },
        {
            keywords: ['islamabad police', 'police asi', 'police constable'],
            topic: 'Islamabad Police ASI & Constable Test',
            advice: 'Islamabad Police written test mein 100 MCQs hotay hain: English, General Knowledge, Islamiat, Pak Studies, Current Affairs aur relevant Police Rules/Laws. LDC/UDC posts ke liye 30/40 WPM typing zaroori hai. Hamari Rs. 300 complete solved PDF book mein relevant acts aur updated current affairs shamil hain.'
        }
    ],

    // 3. Real Frequently Asked Questions (Few-Shot Counselor Training)
    fewShotCounselorExamples: [
        {
            user: "Thora UDC LDC ka samjha dy na website py ja kia krna Hy kidr say nikla ga test preparation",
            counselor: "TestTayar.pk par tayari ke liye 2 main cheezein hain:\n1. *Typing Practice:* Agar aap LDC (30 WPM) ya UDC (40 WPM) ki practice karna chahte hain to direct https://testtayar.pk/typing-test/ldc par ja kar 1 se 5 minute ke tests lagayein.\n2. *MCQs & Written Exam:* https://testtayar.pk/mcqs par Computer, English, GK aur Math ke chapter-wise solved MCQs practice karein.\n\nAap abhi kis department ke LDC/UDC ke liye apply kar rahe hain?"
        },
        {
            user: "typing speed laptop per karni chahiye ya computer per?",
            counselor: "Hamesha alag se normal PC / Desktop USB keyboard laga kar practice karein! Examination hall mein laptop ke flat keys nahi hote balkay standard desktop keyboards hote hain jin ke keys dabane mein thora time lagta hai. Laptop par practice karne se exam hall mein speed 5-10 WPM kam ho sakti hai."
        },
        {
            user: "Sir 3din bd irsa ldc me test hi mera or mjhy test ki tyari krni hi koi guides dy skhty hi ap?",
            counselor: "Jee bilkul! IRSA LDC test NTS pattern par hota hai. 3 din mein quick aur focused tayari ke liye:\n1. TestTayar par English prepositions, Computer MS Office aur Current Affairs ke MCQs review karein: https://testtayar.pk/mcqs\n2. Hamari Rs. 300 complete solved PDF notes book le lein jisme IRSA/NTS past papers, short revision notes aur updated current affairs majood hain jo aap 1-2 din mein aasani se revise kar sakte hain.\n3. Daily 15 minute /typing-test/ldc par lagayein taake 30 WPM speed confirm rahe."
        },
        {
            user: "kya guest practice free hai ya account banana lazmi hai?",
            counselor: "TestTayar par typing tests aur MCQs bilkul 100% free hain bina kisi account ke! Lekin agar aap free account bana lein to aapki daily practice streaks, wrong answers ka bookmark record (/dashboard/saved-questions), aur readiness score save rehta hai."
        },
        {
            user: "Police test ke liye medical aur physical ka kya hisab hota hai?",
            counselor: "Police aur uniform forces ke liye standard physical requirements yeh hoti hain:\n- *Height:* Male ke liye minimum 5'7\" (Provincial rules ke mutabiq thora farq ho sakta hai).\n- *Running:* 1.6 km (1 mile) running 7 se 8 minutes mein.\n- *Chest:* 33\" x 34.5\" (with expansion).\n- *BMI (Body Mass Index):* Normal range (18.5 se 24.9) honi chahiye. Aap https://www.calculator.net/bmi-calculator.html par apni height aur weight daal kar apna BMI pehle hi verify kar sakte hain."
        },
        {
            user: "Karachi Board se duplicate marksheet nikalwani hai kaise niklegi?",
            counselor: "BIEK Karachi (Nazimabad Board Office) se duplicate mark sheet ke liye aapko Board Office ke designated bank booth par prescribed fee challan jama karwana hota hai. Sath mein apna admit card copy, CNIC/B-Form copy aur result slip attach karni hoti hai. Normal processing mein 1 se 2 haftay lagte hain aur urgent fee par 2 se 3 din mein mil jati hai."
        }
    ],

    // 4. Graceful Handling for Out-of-Topic Queries (e.g. Shoes, Clothes, Dates, Web Dev)
    outOfTopicGuidelines: {
        principle: "Agar koi candidate ya user TestTayar ke topic se hat kar sawal pooche (e.g. clothes/shalwar kameez matching, leather shoes, dates, web dev), to usay rude reject na karein. Pehle uske sawal ka genuine, informative aur polite jawab dein, aur aakhir mein politely poochein ke kya unko TestTayar ki exam/typing guidance mein bhi koi madad chahiye.",
        examples: {
            shoes_clothing: "Shalwar kameez aur pant shirt dono par chalne wale shoes ke liye Belgian Loafers ya Suede Penny Loafers (dark brown ya black shade mein) sab se versatile rehte hain jo formal aur semi-casual dono outfits ke sath elegant lagte hain.",
            ajwa_dates: "Original Saudi Ajwa dates (Madinah Munawwarah) soft texture, moderate sweetness aur authentic white lines ke sath pehchani jati hain jo health aur sunnah dono aitbar se behtareen hain.",
            web_development: "Web development, portals aur dashboards ke liye modern responsive stacks (React, Node.js, Express, MongoDB/PostgreSQL) behtareen performance aur scalable user experience provide karte hain."
        }
    }
};
