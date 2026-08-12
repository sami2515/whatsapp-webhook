export const TESTTAYAR_KNOWLEDGE = {
    platformName: 'TestTayar.pk',
    urduName: 'ٹیسٹ تیار',
    mainWebsiteUrl: 'https://testtayar.pk',
    typingTestUrl: 'https://testtayar.pk/typing-test',
    mcqsUrl: 'https://testtayar.pk/mcqs',
    dailyDrillUrl: 'https://testtayar.pk/daily-drill',
    leaderboardUrl: 'https://testtayar.pk/leaderboard',
    testPreparationUrl: 'https://testtayar.pk/test-preparation',
    dashboardUrl: 'https://testtayar.pk/dashboard',
    contactEmail: 'info@testtayar.pk',
    officialWhatsApp: '+92 318 2402515',
    assistantName: 'TestTayar Assistant',
    
    natureOfService: 'Independent Pakistan exam practice and typing simulator platform (not an official government body).',

    freeFeatures: {
        typingTests: {
            description: 'Free touch-typing simulator with real-time feedback',
            durations: ['1 Minute', '2 Minutes', '3 Minutes', '5 Minutes', '10 Minutes'],
            metrics: ['Gross WPM', 'Net WPM', 'Accuracy %', 'Mistake counter', 'Combined Readiness Score'],
            specialFeatures: ['Instant red mistake highlighter', 'Mechanical keyboard sound effects (toggle)', 'Strict No-Backspace mode'],
            examTracks: [
                { name: 'LDC Typing Test', path: '/typing-test/ldc', target: '30+ WPM with 90%+ accuracy (Federal/Provincial standard)' },
                { name: 'UDC Typing Test', path: '/typing-test/udc', target: '30-40+ WPM' },
                { name: 'GHQ / MOD Typing Test', path: '/typing-test/mod', target: 'GHQ / MOD clerical test (30 WPM standard, recommended 35+ WPM, strict accuracy & no-backspace drill)' },
                { name: 'NADRA Typing Test', path: '/typing-test/nadra', target: 'Data Entry Operator (DEO) & Junior Executive speed' },
                { name: 'FPSC Typing Test', path: '/typing-test/fpsc', target: 'Federal clerical & assistant screening (30 WPM)' },
                { name: 'PPSC Typing Test', path: '/typing-test/ppsc', target: 'Punjab Junior Clerk (BPS-11, 25-30 WPM)' },
                { name: 'NTS Typing Test', path: '/typing-test/nts', target: 'NTS screening mock' }
            ],
            coachingTips: [
                'Pehle Accuracy par focus karein: Rushing ke bajaye 95%+ accuracy maintain karein, speed automatically develop hogi.',
                'Home Row Technique: Fingers ko hamesha ASDF (left hand) aur JKL; (right hand) par set karein.',
                'Keyboard ki taraf na dekhein: Screen aur passage par focus karein taake muscle memory build ho.',
                'Daily Practice: Rozana 10-15 minute ke 2-3 sessions TestTayar.pk par 1-minute aur 3-minute tests karein.',
                'Test Center Simulation: TestTayar par No-Backspace mode on karke practice karein taake exam hall mein errors na hon.'
            ]
        },
        departmentCriteria: {
            ghq: 'GHQ (General Headquarters) LDC requirement is 30 WPM in English with high accuracy. Recommended practice speed is 35+ WPM to ensure a safe margin.',
            mod: 'Ministry of Defence (MOD) clerical / LDC requirement is 30 WPM with strict evaluation. Use /typing-test/mod for no-backspace drill.',
            police: 'Islamabad Police & Provincial Police LDC is 30 WPM, UDC is 40 WPM. Written exam includes 100 MCQs covering English, General Knowledge, Islamiat, Pak Studies and Computer basics.',
            fbr: 'FBR / Inland Revenue / Customs LDC is 30 WPM (BPS-11), UDC is 40 WPM (BPS-13/14).',
            ppsc: 'PPSC Junior Clerk (BPS-11) requires 25-30 WPM on English typing. Written test has -0.25 negative marking.',
            fpsc: 'FPSC Federal Secretariat LDC requires 30 WPM, UDC 40 WPM.',
            nadra: 'NADRA Data Entry Operator requires speed of 30-35+ WPM with high numeric & alphanumeric accuracy.',
            general: 'Across Pakistan Federal & Provincial departments, standard LDC (BPS-11) is 30 WPM (90%+ accuracy), and UDC (BPS-13/14) is 30-40+ WPM.'
        },
        mcqs: {
            description: '8 core subjects with interactive practice and solved directory modes',
            subjects: [
                { name: 'English', path: '/mcqs/english', topics: 'Grammar, Prepositions, Tenses, Vocabulary, Active/Passive, Direct/Indirect, Sentence Correction, Comprehension' },
                { name: 'Computer Knowledge', path: '/mcqs/computer', topics: 'MS Word, MS Excel, PowerPoint, Windows, Shortcuts, Hardware, Networking, IT Basics' },
                { name: 'Mathematics & IQ', path: '/mcqs/mathematics', topics: 'Basic Arithmetic, Percentages, Algebra, Ratios, Series, Word Problems' },
                { name: 'Pakistan Studies', path: '/mcqs/pakistan-studies', topics: 'Historical timeline, 1973 Constitution, Geography, Pakistan Movement' },
                { name: 'Islamic Studies (Islamiat)', path: '/mcqs/islamiat', topics: 'Quran, Hadith, Seerah of Prophet Muhammad (PBUH), Pillars, Islamic History' },
                { name: 'Everyday Science', path: '/mcqs/everyday-science', topics: 'Physics, Chemistry, Biology, Environment, Human Physiology' },
                { name: 'General Knowledge', path: '/mcqs/general-knowledge', topics: 'World Geography, Capitals, Currencies, International Organizations, Famous Records' },
                { name: 'Current Affairs', path: '/mcqs/current-affairs', topics: 'Updated Pakistan & International events' }
            ],
            modes: [
                { name: 'Practice Mode', details: 'Timed interactive quiz with randomized questions, options, instant explanations, and score review.' },
                { name: 'Solved Directory', details: 'Chapter-wise readable textbook directory with clear answers and Urdu/English explanations.' }
            ]
        },
        dailyDrill: {
            path: '/daily-drill',
            description: '3-stage daily routine: 1-minute typing round + 10 mixed MCQs + Combined Readiness Rating score.'
        },
        examCbtRooms: [
            { name: 'LDC Test Mock', path: '/ldc-test' },
            { name: 'UDC Test Mock', path: '/udc-test' },
            { name: 'MOD LDC Test', path: '/mod-ldc-test' },
            { name: 'NADRA Test', path: '/nadra-test' },
            { name: 'FPSC One Paper Test', path: '/fpsc-one-paper-test' },
            { name: 'PPSC One Paper Test', path: '/ppsc-one-paper-test', note: 'Includes -0.25 negative marking simulation' },
            { name: 'NTS Test Mock', path: '/nts-test' }
        ],
        accountBenefits: 'Guest practice is 100% free without sign-up. Free account creation saves streaks, history, bookmarks wrong MCQs in /dashboard/saved-questions, and lets you practice weak questions.'
    },

    paidProduct: {
        name: 'Complete Solved Job Preparation PDF Book / Notes',
        pricePkr: 300,
        flow: [
            '1. When candidate asks for book/pdf/notes, first ask which post/department they are preparing for.',
            '2. Tailor description: For uniform posts (Police, ASI, FIA, ASF) highlight relevant laws, acts, month current affairs, past paper MCQs, essays. For clerical posts (GHQ, MOD, LDC, UDC, DEO) highlight past papers, short notes, typing test guide & computer shortcuts.',
            '3. Provide exact payment accounts (JazzCash & Meezan Bank) directly in the chat for Rs. 300.',
            '4. Ask candidate to share payment screenshot in this chat. Once sent, AI pauses for manual delivery.'
        ],
        paymentAccounts: {
            jazzcash: {
                accountTitle: 'MUHAMMAD SAMI',
                number: '03039512277'
            },
            meezanBank: {
                accountTitle: 'MUHAMMAD SAMI',
                accountNumber: '01990112309796',
                iban: 'PK69MEZN0001990112309796'
            }
        },
        paymentInstructions: `Rs. 300 payment ke liye details:\n\n*JazzCash:*\nAccount Title: MUHAMMAD SAMI\nNumber: \`03039512277\` (Tap to copy)\n\n*Meezan Bank:*\nAccount Title: MUHAMMAD SAMI\nAccount Number: \`01990112309796\` (Tap to copy)\nIBAN: \`PK69MEZN0001990112309796\` (Tap to copy)\n\nPayment bhej kar screenshot isi chat par share karein, PDF book foran deliver kar di jayegi.`
    },

    faqs: [
        {
            question: 'What typing speed is required for LDC/UDC jobs in Pakistan?',
            answer: 'Most departments (Federal ministries, FPSC, PPSC, NTS) require a minimum speed of 30 Words Per Minute (WPM) with at least 90% accuracy for LDC (BPS-11), and 30 to 40+ WPM for UDC (BPS-13/14) or Computer Operators.'
        },
        {
            question: 'How is typing speed calculated on TestTayar?',
            answer: 'Gross WPM is (Total characters / 5) / Minutes. Net WPM deducts penalties for uncorrected errors. Accuracy % is (Correct characters / Total typed characters) * 100.'
        },
        {
            question: 'Is an account mandatory to practice?',
            answer: 'No, all typing tests and MCQs are 100% free without any account. Creating a free account lets you track your streaks and bookmark weak questions.'
        },
        {
            question: 'Does PPSC practice include negative marking?',
            answer: 'Yes! In our PPSC simulator (/ppsc-one-paper-test), each incorrect answer deducts 0.25 marks, exactly like the real PPSC exam.'
        },
        {
            question: 'How to purchase the Complete Preparation PDF Book / Notes for Rs. 300?',
            answer: 'Tell the assistant which post you are applying for. The assistant will provide payment accounts (JazzCash / Meezan Bank) for Rs. 300. After sending payment, share the screenshot in this WhatsApp chat and the PDF will be delivered directly.'
        }
    ],

    handoffRules: [
        'User sends payment screenshot, receipt, or transaction ID for the Rs. 300 PDF book',
        'User asks to talk to support or human representative',
        'User reports a technical issue or payment query',
        'User is confused, angry, or asks repeatedly off-topic questions'
    ]
};

// Aliases for backwards compatibility
export const SAMI_KNOWLEDGE = {
    ...TESTTAYAR_KNOWLEDGE,
    businessName: 'TestTayar.pk',
    portfolioUrl: TESTTAYAR_KNOWLEDGE.mainWebsiteUrl,
    developerCardUrl: TESTTAYAR_KNOWLEDGE.mainWebsiteUrl,
    services: [
        '1-Minute Typing Test Simulator',
        'LDC/UDC Exam Typing Rooms',
        '8 Subject MCQ Banks (English, Computer, Math, Pak Studies, Islamiat, Science, GK, Current Affairs)',
        'Daily Drill 3-Stage Routine',
        'CBT Exam Simulators (FPSC, PPSC, NTS, MOD, NADRA)',
        'Rs. 300 Complete Preparation PDF Book'
    ],
    techStack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Node.js', 'MongoDB'],
    portfolioProjects: []
};
