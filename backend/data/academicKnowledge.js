/**
 * TestTayar.pk - Permanent Academic Knowledge Base
 * 
 * Provides verified, structured academic and entry test facts with source metadata.
 * Volatile facts (like future 2027/2028 dates or live merit lists) are explicitly marked.
 */

export const ACADEMIC_KNOWLEDGE = {
    testingAgencies: {
        nts: {
            name: 'National Testing Service (NTS)',
            website: 'https://www.nts.org.pk',
            description: 'Pakistan\'s premier testing organization conducting NAT (National Aptitude Test) and GAT (Graduate Assessment Test).',
            
            // Standard NAT Categories
            natCategories: {
                'NAT-IM': {
                    fullName: 'NAT-IM (Pre-Medical)',
                    targetGroup: 'F.Sc Pre-Medical graduates',
                    targetDegrees: ['Pharm-D', 'Doctor of Physical Therapy (DPT)', 'BS Biotechnology', 'BS Microbiology', 'BS Biochemistry', 'BS Botany', 'BS Zoology', 'Allied Health Sciences'],
                    totalQuestions: 90,
                    durationMinutes: 120,
                    breakdown: {
                        verbal_english: 20,
                        analytical_reasoning: 20,
                        quantitative_reasoning: 20,
                        subject_portion: 30
                    },
                    subjectBreakdown: {
                        biology: 14,
                        chemistry: 8,
                        physics: 8
                    },
                    passingMarks: 50,
                    validityPeriod: '1 Year from test date',
                    sourceName: 'NTS Official Paper Pattern',
                    sourceUrl: 'https://www.nts.org.pk/Products/NTSNAT/nat-paper-pattern.php',
                    verifiedAt: '2026-08-14',
                    validity: 'current'
                },
                'NAT-IE': {
                    fullName: 'NAT-IE (Pre-Engineering)',
                    targetGroup: 'F.Sc Pre-Engineering graduates',
                    targetDegrees: ['BS Engineering (Electrical, Mechanical, Civil)', 'BS Computer Science', 'BS Software Engineering', 'BS Physics', 'BS Mathematics'],
                    totalQuestions: 90,
                    durationMinutes: 120,
                    breakdown: {
                        verbal_english: 20,
                        analytical_reasoning: 20,
                        quantitative_reasoning: 20,
                        subject_portion: 30
                    },
                    subjectBreakdown: {
                        physics: 10,
                        chemistry: 10,
                        mathematics: 10
                    },
                    sourceName: 'NTS Official Paper Pattern',
                    sourceUrl: 'https://www.nts.org.pk/Products/NTSNAT/nat-paper-pattern.php',
                    verifiedAt: '2026-08-14',
                    validity: 'current'
                },
                'NAT-ICS': {
                    fullName: 'NAT-ICS (Computer Science)',
                    targetGroup: 'Intermediate with Computer Science graduates',
                    targetDegrees: ['BS Computer Science', 'BS Software Engineering', 'BS IT', 'BS Artificial Intelligence', 'BS Data Science'],
                    totalQuestions: 90,
                    durationMinutes: 120,
                    breakdown: {
                        verbal_english: 20,
                        analytical_reasoning: 20,
                        quantitative_reasoning: 20,
                        subject_portion: 30
                    },
                    subjectBreakdown: {
                        physics: 10,
                        computer_science: 10,
                        mathematics: 10
                    },
                    sourceName: 'NTS Official Paper Pattern',
                    sourceUrl: 'https://www.nts.org.pk/Products/NTSNAT/nat-paper-pattern.php',
                    verifiedAt: '2026-08-14',
                    validity: 'current'
                },
                'NAT-ICOM': {
                    fullName: 'NAT-ICOM (Commerce)',
                    targetGroup: 'I.Com graduates',
                    targetDegrees: ['BBA', 'BS Accounting & Finance', 'BS Commerce', 'BS Economics'],
                    totalQuestions: 90,
                    durationMinutes: 120,
                    breakdown: {
                        verbal_english: 20,
                        analytical_reasoning: 20,
                        quantitative_reasoning: 20,
                        subject_portion: 30
                    },
                    sourceName: 'NTS Official Paper Pattern',
                    sourceUrl: 'https://www.nts.org.pk/Products/NTSNAT/nat-paper-pattern.php',
                    verifiedAt: '2026-08-14',
                    validity: 'current'
                },
                'NAT-IA': {
                    fullName: 'NAT-IA (Arts / Humanities)',
                    targetGroup: 'F.A. / Arts graduates',
                    targetDegrees: ['BS English', 'BS International Relations', 'BS Psychology', 'BS Mass Communication', 'BS Sociology'],
                    totalQuestions: 90,
                    durationMinutes: 120,
                    breakdown: {
                        verbal_english: 20,
                        analytical_reasoning: 20,
                        quantitative_reasoning: 20,
                        subject_portion: 30
                    },
                    sourceName: 'NTS Official Paper Pattern',
                    sourceUrl: 'https://www.nts.org.pk/Products/NTSNAT/nat-paper-pattern.php',
                    verifiedAt: '2026-08-14',
                    validity: 'current'
                }
            },

            // Recurring Schedule Nature
            schedulePattern: {
                frequency: 'Conducted monthly (12 tests per calendar year, from NAT-I in January to NAT-XII in December).',
                registrationWindow: 'Usually opens 3-4 weeks before each test date.',
                futureYearStatus: {
                    year2027: {
                        status: 'not_officially_announced',
                        officialScheduleAvailable: false,
                        note: 'NTS publishes annual schedules near December of the preceding year. 2027 exact dates are not officially published yet.'
                    },
                    year2028: {
                        status: 'not_officially_announced',
                        officialScheduleAvailable: false,
                        note: '2028 schedule will only be announced at the end of 2027.'
                    }
                }
            }
        },

        pmdc: {
            mdcat: {
                name: 'Medical & Dental College Admission Test (MDCAT)',
                purpose: 'Mandatory centralized entry test for admission into public and private MBBS and BDS colleges across Pakistan.',
                totalMarks: 200,
                passingPercentage: 'MBBS: 55%, BDS: 50%',
                breakdown: 'Biology (68 MCQs), Chemistry (54 MCQs), Physics (54 MCQs), English (18 MCQs), Logical Reasoning (6 MCQs). Total: 200 MCQs (No Negative Marking).',
                conductedBy: 'Provincial Admitting Universities under PMDC regulations (UHS Punjab, DUHS Sindh, KMU KPK, BUMHS Balochistan, SZABMU Islamabad).',
                sourceUrl: 'https://pmdc.pk'
            }
        },

        commissions: {
            fpsc: {
                name: 'Federal Public Service Commission (FPSC)',
                website: 'https://www.fpsc.gov.pk',
                description: 'Conducts General Recruitment (GR) One-Paper MCQs screening tests (100 Marks, 100 MCQs, 100 Minutes) and CSS Competitive Examination.',
                onePaperPattern: 'Part-I: English (Grammar, Vocabulary, Sentence Structuring) - 20 Marks. Part-II: General Intelligence / Professional / Subject Knowledge - 80 Marks.',
                keyPosts: ['Inspector Customs', 'Appraising Officer', 'Assistant Director FIA', 'Inspector FIA', 'Patrol Officer', 'Preventive Officer']
            },
            ppsc: {
                name: 'Punjab Public Service Commission (PPSC)',
                website: 'https://www.ppsc.gop.pk',
                description: 'Conducts Provincial Single Paper MCQs Tests (100 MCQs, 90 Minutes) with -0.25 Negative Marking and PMS Examination.',
                onePaperPattern: '100 MCQs covering General Knowledge, Pakistan Studies, Current Affairs, Islamic Studies, Geography, Basic Math, English, Urdu, Everyday Science, Basic Computer Skills.',
                keyPosts: ['Junior Clerk (25-30 WPM Typing + MS Office)', 'Tehsildar / Naib Tehsildar', 'Sub-Inspector', 'Assistant', 'Lecturer']
            }
        },

        uniformAndDefence: {
            fia: {
                name: 'Federal Investigation Agency (FIA)',
                posts: ['Assistant Director (BPS-17)', 'Inspector (BPS-16)', 'Sub-Inspector (BPS-14)', 'Assistant Sub-Inspector (BPS-09)', 'Constable (BPS-05)'],
                screeningStages: 'Physical Test (Running, Height, Chest) -> Written MCQs Test -> Interview.'
            },
            asf: {
                name: 'Airports Security Force (ASF)',
                posts: ['Assistant Director', 'Inspector', 'ASI (BPS-09)', 'Corporal (BPS-07)'],
                screeningStages: 'Physical / Medical Test -> Written Test -> Interview.'
            },
            police: {
                name: 'Islamabad Police & Provincial Police',
                posts: ['ASI', 'Constable', 'LDC', 'UDC', 'DEO'],
                requirements: 'LDC: 30 WPM typing, UDC: 40 WPM typing. Written test has 100 MCQs.'
            }
        },

        hec: {
            lat: {
                name: 'Law Admission Test (LAT)',
                purpose: 'Mandatory test for 5-Year LLB admissions in Pakistan public & private law colleges.',
                totalMarks: 100,
                passingMarks: 50,
                breakdown: 'Essay (15), Personal Statement (10), MCQs (75): English (20), General Knowledge (20), Islamic Studies (10), Pak Studies (10), Urdu (10), Math (5).',
                conductedBy: 'HEC ETC',
                sourceUrl: 'https://etc.hec.gov.pk'
            },
            usat: {
                name: 'Undergraduate Studies Aptitude Test (USAT)',
                purpose: 'Standardized HEC aptitude test for university admissions (USAT-M for Medical, USAT-E for Engineering, USAT-CS for Computing, USAT-A for Arts, USAT-Com for Commerce).',
                totalMarks: 100,
                passingMarks: 50,
                conductedBy: 'HEC ETC',
                sourceUrl: 'https://etc.hec.gov.pk'
            }
        }
    },

    universities: {
        comsats: {
            name: 'COMSATS University Islamabad (CUI)',
            officialWebsite: 'https://www.comsats.edu.pk',
            admissionsWebsite: 'https://ww2.comsats.edu.pk/admissionoffice/',
            campuses: ['Islamabad (Main)', 'Lahore', 'Abbottabad', 'Wah', 'Attock', 'Sahiwal', 'Vehari'],
            admissionIntakes: ['Fall Admissions (Applications open June/July)', 'Spring Admissions (Applications open November/December)'],
            testPolicy: 'Accepts valid NTS NAT test scores or conducts CUI NTS special tests for applicants.',
            
            programs: {
                'pharm-d': {
                    degreeName: 'Doctor of Pharmacy (Pharm-D)',
                    duration: '5 Years (10 Semesters)',
                    campusesOffering: ['Lahore Campus', 'Abbottabad Campus'],
                    eligibility: {
                        intermediateQualification: 'Intermediate Pre-Medical (F.Sc / A-Levels with Biology, Chemistry, Physics) or equivalent.',
                        minimumIntermediatePercentage: '60%',
                        testRequirement: 'Valid NTS NAT-IM test score as per CUI admission policy.'
                    },
                    offeredIntake: 'Offered primarily in Fall intake annually.',
                    sourceName: 'COMSATS Lahore Pharmacy Department & CUI Admission Office',
                    sourceUrl: 'https://lahore.comsats.edu.pk/pharmacy/pharma-d.aspx',
                    verifiedAt: '2026-08-14',
                    validity: 'current'
                },
                'bs-cs': {
                    degreeName: 'BS Computer Science (BS CS)',
                    duration: '4 Years',
                    eligibility: {
                        intermediateQualification: 'Intermediate with Mathematics (Pre-Engineering / ICS) or Pre-Medical with additional math.',
                        minimumIntermediatePercentage: '50%',
                        testRequirement: 'Valid NTS NAT (NAT-ICS / NAT-IE / NAT-IM with math) score.'
                    },
                    sourceUrl: 'https://ww2.comsats.edu.pk/admissionoffice/'
                },
                'bs-se': {
                    degreeName: 'BS Software Engineering',
                    duration: '4 Years',
                    eligibility: {
                        intermediateQualification: 'Intermediate with Math (Pre-Eng / ICS) min 50% + valid NTS score.'
                    }
                }
            }
        },

        nust: {
            name: 'National University of Sciences and Technology (NUST)',
            officialWebsite: 'https://nust.edu.pk',
            testName: 'NUST Entry Test (NET) Series (NET-1, NET-2, NET-3, NET-4)',
            description: 'NUST conducts its own computerized NET series in Islamabad, Karachi, and Quetta.'
        },

        fast: {
            name: 'FAST National University of Computer and Emerging Sciences (NUCES)',
            officialWebsite: 'https://www.nu.edu.pk',
            testPolicy: 'Conducts FAST NU Online Admission Test, and also accepts NTS NAT / SAT scores for eligibility computation.'
        },

        uet: {
            name: 'University of Engineering and Technology (UET)',
            officialWebsite: 'https://uet.edu.pk',
            testName: 'ECAT (Engineering Colleges Admission Test)',
            description: 'Mandatory for all engineering universities in Punjab.'
        },

        lums: {
            name: 'Lahore University of Management Sciences (LUMS)',
            officialWebsite: 'https://lums.edu.pk',
            testPolicy: 'Accepts SAT / LCAT scores with high academic distinction.'
        },

        iba: {
            name: 'Institute of Business Administration (IBA Karachi)',
            officialWebsite: 'https://iba.edu.pk',
            testPolicy: 'Conducts IBA Online / Paper Entry Test for BBA, BS CS, BS Economics.'
        }
    }
};
