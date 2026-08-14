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
        }
    }
};
