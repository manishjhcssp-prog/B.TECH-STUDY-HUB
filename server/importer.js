const fs = require('fs');
const path = require('path');
const { db, initDb } = require('./db');
const { extractTextFromFile } = require('./textExtractor');

const MATERIALS_ROOT = path.join(__dirname, '..', 'study-materials');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// Default curriculum definition
const CURRICULUM = [
  {
    yearNumber: 1,
    name: '1st Year',
    semesters: [
      {
        semNumber: 1,
        name: 'Semester 1',
        categories: ['MID-1', 'MID-2', 'SEM-1', 'Records', 'Assignments'],
        subjects: [
          {
            name: 'Mathematics-I',
            code: 'MATH101',
            syllabus: {
              title: 'Linear Algebra & Calculus',
              units: [
                {
                  unitNumber: 1,
                  title: 'UNIT 1: Matrices and Linear Systems',
                  topics: ['Rank of a Matrix', 'Echelon Form and Normal Form', 'System of Linear Equations', 'Eigenvalues and Eigenvectors', 'Cayley-Hamilton Theorem']
                },
                {
                  unitNumber: 2,
                  title: 'UNIT 2: Differential Calculus',
                  topics: ["Rolle's Theorem", "Cauchy's Mean Value Theorem", "Taylor's and Maclaurin's Theorems", 'Curvature and Evolutes']
                },
                {
                  unitNumber: 3,
                  title: 'UNIT 3: Multivariable Calculus',
                  topics: ['Partial Differentiation', 'Euler Theorem on Homogeneous Functions', 'Total Derivatives', 'Jacobians', 'Maxima and Minima of Two Variables']
                },
                {
                  unitNumber: 4,
                  title: 'UNIT 4: Multiple Integrals',
                  topics: ['Double Integrals', 'Change of Order of Integration', 'Triple Integrals', 'Area and Volume Calculations']
                },
                {
                  unitNumber: 5,
                  title: 'UNIT 5: Vector Calculus',
                  topics: ['Gradient, Divergence and Curl', 'Line, Surface and Volume Integrals', "Green's Theorem", 'Gauss Divergence Theorem', "Stokes' Theorem"]
                }
              ]
            }
          },
          {
            name: 'Applied Physics',
            code: 'PHY101',
            syllabus: {
              title: 'Applied Physics Syllabus',
              units: [
                {
                  unitNumber: 1,
                  title: 'UNIT 1: Wave Optics',
                  topics: ['Interference of Light', 'Diffraction (Fraunhofer and Fresnel)', 'Polarization', 'Brewster Law']
                },
                {
                  unitNumber: 2,
                  title: 'UNIT 2: Lasers & Fiber Optics',
                  topics: ['Spontaneous and Stimulated Emission', 'Ruby Laser and He-Ne Laser', 'Optical Fibers: Acceptance Angle & Numerical Aperture', 'Applications of Fiber Optics']
                },
                {
                  unitNumber: 3,
                  title: 'UNIT 3: Quantum Mechanics',
                  topics: ['De Broglie Hypothesis', "Schrodinger's Time Independent Wave Equation", 'Particle in a 1D Box', 'Physical Significance of Wave Function']
                }
              ]
            }
          },
          {
            name: 'Programming for Problem Solving',
            code: 'CS101',
            syllabus: {
              title: 'C Programming & Algorithms',
              units: [
                {
                  unitNumber: 1,
                  title: 'UNIT 1: Introduction to Programming & C Basics',
                  topics: ['Algorithms and Flowcharts', 'Data Types, Operators and Expressions', 'Control Structures (if-else, switch)', 'Loops (for, while, do-while)']
                },
                {
                  unitNumber: 2,
                  title: 'UNIT 2: Arrays & Strings',
                  topics: ['1D and 2D Arrays', 'String Manipulation Functions', 'Searching (Linear, Binary)', 'Sorting (Bubble, Selection)']
                },
                {
                  unitNumber: 3,
                  title: 'UNIT 3: Functions & Pointers',
                  topics: ['Function Declaration and Definition', 'Call by Value and Call by Reference', 'Recursion', 'Pointer Arithmetic and Pointers with Arrays']
                },
                {
                  unitNumber: 4,
                  title: 'UNIT 4: Structures & Unions',
                  topics: ['User Defined Data Types', 'Array of Structures', 'Nested Structures', 'Unions and Typedef']
                },
                {
                  unitNumber: 5,
                  title: 'UNIT 5: File Handling & Preprocessor',
                  topics: ['File Operations (fopen, fclose, fread, fwrite)', 'Command Line Arguments', 'Macros and Preprocessor Directives']
                }
              ]
            }
          },
          {
            name: 'Digital Electronics',
            code: 'EC101',
            syllabus: {
              title: 'Digital Logic Design & Circuits',
              units: [
                {
                  unitNumber: 1,
                  title: 'UNIT 1: Number Systems & Boolean Algebra',
                  topics: ['Binary, Octal, Hexadecimal Systems', 'Signed Number Representation & 2s Complement', 'Boolean Postulates and Theorems', "De Morgan's Laws", 'Standard SOP and POS Forms']
                },
                {
                  unitNumber: 2,
                  title: 'UNIT 2: Gate-Level Minimization',
                  topics: ['2, 3, 4 Variable Karnaugh Maps (K-Maps)', "Don't Care Conditions", 'Quine-McCluskey (Tabular) Method', 'NAND and NOR Implementation']
                },
                {
                  unitNumber: 3,
                  title: 'UNIT 3: Combinational Logic',
                  topics: ['Half Adder and Full Adder', 'Half Subtractor and Full Subtractor', 'Multiplexers & Demultiplexers', 'Decoders and Priority Encoders', 'Magnitude Comparators']
                },
                {
                  unitNumber: 4,
                  title: 'UNIT 4: Sequential Logic Circuits',
                  topics: ['Latches and Flip-Flops (SR, JK, D, T)', 'Master-Slave JK Flip Flop', 'State Tables and State Diagrams', 'SISO, SIPO, PISO, PIPO Shift Registers', 'Synchronous & Asynchronous Up/Down Counters']
                },
                {
                  unitNumber: 5,
                  title: 'UNIT 5: Programmable Logic & Memories',
                  topics: ['Read Only Memory (ROM)', 'Programmable Logic Array (PLA)', 'Programmable Array Logic (PAL)', 'CMOS and TTL Logic Families']
                }
              ]
            }
          },
          {
            name: 'English & Professional Communication',
            code: 'ENG101',
            syllabus: {
              title: 'Professional Communication',
              units: [
                {
                  unitNumber: 1,
                  title: 'UNIT 1: Vocabulary & Grammar',
                  topics: ['Articles, Prepositions, Tenses', 'Synonyms and Antonyms', 'Common Errors in English', 'Sentence Structure and Concord']
                },
                {
                  unitNumber: 2,
                  title: 'UNIT 2: Reading & Writing Skills',
                  topics: ['Reading Comprehension', 'Paragraph Writing & Précis Writing', 'Formal Letter and Email Writing', 'Resume Preparation']
                }
              ]
            }
          }
        ]
      },
      {
        semNumber: 2,
        name: 'Semester 2',
        categories: ['MID-1', 'MID-2', 'SEM-2', 'Records', 'Assignments'],
        subjects: [
          { name: 'Mathematics-II', code: 'MATH102' },
          { name: 'Basic Electrical Engineering', code: 'EE102' },
          { name: 'Data Structures', code: 'CS102' },
          { name: 'Engineering Chemistry', code: 'CHEM102' },
          { name: 'Environmental Science', code: 'ENV102' }
        ]
      }
    ]
  },
  {
    yearNumber: 2,
    name: '2nd Year',
    semesters: [
      {
        semNumber: 3,
        name: 'Semester 3',
        categories: ['MID-1', 'MID-2', 'SEM-3', 'Presentation', 'Records', 'Assignments', 'Previous Papers'],
        subjects: [
          {
            name: 'Probability and Statistics',
            code: 'CS301',
            syllabus: {
              title: 'Probability and Statistics Curriculum',
              units: [
                {
                  unitNumber: 1,
                  title: 'UNIT 1: Basic Probability & Random Variables',
                  topics: ['Sample Space and Probability Axioms', 'Conditional Probability & Bayes Theorem', 'Discrete and Continuous Random Variables', 'Probability Density Functions (PDF & CDF)', 'Mathematical Expectation, Variance and Moments']
                },
                {
                  unitNumber: 2,
                  title: 'UNIT 2: Probability Distributions',
                  topics: ['Binomial Distribution', 'Poisson Distribution', 'Normal (Gaussian) Distribution', 'Uniform and Exponential Distributions']
                },
                {
                  unitNumber: 3,
                  title: 'UNIT 3: Sampling & Estimation Theory',
                  topics: ['Population and Sample', 'Central Limit Theorem', 'Sampling Distributions of Mean and Variance', 'Point Estimation vs Interval Estimation', 'Confidence Intervals']
                },
                {
                  unitNumber: 4,
                  title: 'UNIT 4: Hypothesis Testing',
                  topics: ['Null and Alternative Hypotheses, Type I & Type II Errors', 'Large Sample Tests (Z-test for Means and Proportions)', 'Small Sample Tests (Student t-test, F-test)', 'Chi-Square Test of Independence']
                },
                {
                  unitNumber: 5,
                  title: 'UNIT 5: Correlation & Regression',
                  topics: ["Karl Pearson's Coefficient of Correlation", 'Spearman Rank Correlation', 'Linear Regression Lines and Equations', 'Angle between Two Regression Lines']
                }
              ]
            }
          },
          {
            name: 'Design and Analysis of Algorithms',
            code: 'CS302',
            syllabus: {
              title: 'Design and Analysis of Algorithms (DAA)',
              units: [
                {
                  unitNumber: 1,
                  title: 'UNIT 1: Foundations & Divide-and-Conquer',
                  topics: ['Algorithm Specification & Performance Analysis (Time/Space Complexity)', 'Asymptotic Notations (Big-O, Omega, Theta)', 'Divide and Conquer: Binary Search, Merge Sort, Quick Sort', "Strassen's Matrix Multiplication"]
                },
                {
                  unitNumber: 2,
                  title: 'UNIT 2: Greedy Method',
                  topics: ['General Method & Knapsack Problem', 'Job Sequencing with Deadlines', "Minimum Cost Spanning Trees (Prim's and Kruskal's Algorithms)", "Single Source Shortest Path (Dijkstra's Algorithm)", 'Huffman Codes']
                },
                {
                  unitNumber: 3,
                  title: 'UNIT 3: Dynamic Programming',
                  topics: ['Principle of Optimality', '0/1 Knapsack Problem', 'All Pairs Shortest Paths (Floyd-Warshall Algorithm)', 'Matrix Chain Multiplication', 'Longest Common Subsequence (LCS)', 'Optimal Binary Search Trees (OBST)']
                },
                {
                  unitNumber: 4,
                  title: 'UNIT 4: Backtracking & Branch-and-Bound',
                  topics: ['8-Queens Problem', 'Sum of Subsets Problem', 'Graph Coloring & Chromatic Number', 'Hamiltonian Cycles', 'Traveling Salesperson Problem (TSP)', 'FIFO and LC Branch and Bound']
                },
                {
                  unitNumber: 5,
                  title: 'UNIT 5: NP-Hard and NP-Complete Problems',
                  topics: ['Basic Concepts, Non-deterministic Algorithms', 'P, NP, NP-Hard and NP-Complete Classes', "Cook's Theorem", 'Reducibility and NP-Completeness Proofs']
                }
              ]
            }
          },
          {
            name: 'Backend Development',
            code: 'CS303',
            syllabus: {
              title: 'Backend Engineering & APIs',
              units: [
                {
                  unitNumber: 1,
                  title: 'UNIT 1: Node.js Core Architecture',
                  topics: ['V8 Engine & Single Threaded Event Loop', 'Modules and CommonJS vs ES Modules', 'File System Operations & Streams', 'Handling Buffers and Events']
                },
                {
                  unitNumber: 2,
                  title: 'UNIT 2: Express.js Framework',
                  topics: ['Express Application Architecture & Routing', 'Custom Middleware & Third-Party Middlewares', 'Request Processing, Query Parameters and Body Parsing', 'Centralized Error Handling']
                },
                {
                  unitNumber: 3,
                  title: 'UNIT 3: Database Integration & Storage',
                  topics: ['Relational Database Systems (SQLite / PostgreSQL)', 'Schema Modeling, Foreign Keys & Indexes', 'CRUD Operations & Transactions', 'File Uploads with Multer & Storage Architecture']
                },
                {
                  unitNumber: 4,
                  title: 'UNIT 4: RESTful APIs & Authentication',
                  topics: ['REST Principles & HTTP Verbs/Status Codes', 'User Authentication with JWT Tokens', 'Password Security with Bcrypt Hashing', 'CORS, Rate Limiting and Security Headers']
                },
                {
                  unitNumber: 5,
                  title: 'UNIT 5: Full-Text Search & Deployment',
                  topics: ['Search Engines and Inverted Indexing', 'Text Extraction from PDFs and Office Documents', 'Building Production Builds', 'Server Deployment and Monitoring']
                }
              ]
            }
          },
          {
            name: 'Digital Electronics',
            code: 'EC301',
            syllabus: {
              title: 'Digital Electronics & Logic Gates',
              units: [
                {
                  unitNumber: 1,
                  title: 'UNIT 1: Number Systems and Boolean Algebra',
                  topics: ['Binary, Octal, Hexadecimal Systems', 'Boolean Theorems & De Morgan Laws', 'Logic Gates (AND, OR, NOT, NAND, NOR, XOR, XNOR)']
                },
                {
                  unitNumber: 2,
                  title: 'UNIT 2: Combinational Logic',
                  topics: ['K-Maps 3 and 4 Variables', 'Adders, Subtractors, Comparators', 'Multiplexers and Demultiplexers']
                },
                {
                  unitNumber: 3,
                  title: 'UNIT 3: Sequential Circuits',
                  topics: ['SR, JK, D, T Flip-Flops', 'Registers and Counters', 'Finite State Machines']
                }
              ]
            }
          },
          {
            name: 'Logical Reasoning',
            code: 'APT301',
            syllabus: {
              title: 'Logical Reasoning & Quantitative Aptitude',
              units: [
                {
                  unitNumber: 1,
                  title: 'UNIT 1: Blood Relations & Directions',
                  topics: ['Decoded Blood Relations', 'Family Tree Problems', 'Direction Sense & Displacement', 'Angle Rotations']
                },
                {
                  unitNumber: 2,
                  title: 'UNIT 2: Coding-Decoding & Series',
                  topics: ['Letter Coding, Number Coding', 'Alpha-numeric Series', 'Analogy and Classification', 'Odd Man Out']
                },
                {
                  unitNumber: 3,
                  title: 'UNIT 3: Seating Arrangement & Puzzles',
                  topics: ['Linear Seating Arrangement', 'Circular Seating Arrangement', 'Floor Puzzles and Scheduling', 'Syllogisms and Venn Diagrams']
                }
              ]
            }
          },
          {
            name: 'Advanced Communication Skills',
            code: 'ENG301',
            syllabus: {
              title: 'Advanced Communication Skills (ACS)',
              units: [
                {
                  unitNumber: 1,
                  title: 'UNIT 1: Functional English & Presentation Skills',
                  topics: ['Slide Design & Structure', 'Body Language and Voice Modulation', 'Interactive Presentations', 'Handling Q&A Sessions']
                },
                {
                  unitNumber: 2,
                  title: 'UNIT 2: Group Discussions & Interviews',
                  topics: ['Group Discussion Dynamics', 'Extempore Speaking', 'Technical and HR Interview Strategies', 'Resume Building & Cover Letters']
                }
              ]
            }
          }
        ]
      },
      {
        semNumber: 4,
        name: 'Semester 4',
        categories: ['MID-1', 'MID-2', 'SEM-4', 'Records', 'Assignments'],
        subjects: [
          { name: 'Database Management Systems (DBMS)', code: 'CS401' },
          { name: 'Operating Systems', code: 'CS402' },
          { name: 'Computer Organization & Architecture', code: 'CS403' },
          { name: 'Discrete Mathematics', code: 'CS404' },
          { name: 'Java Programming', code: 'CS405' }
        ]
      }
    ]
  },
  {
    yearNumber: 3,
    name: '3rd Year',
    semesters: [
      {
        semNumber: 5,
        name: 'Semester 5',
        categories: ['MID-1', 'MID-2', 'SEM-5', 'Presentation', 'Records', 'Assignments'],
        subjects: [
          { name: 'Computer Networks', code: 'CS501' },
          { name: 'Software Engineering', code: 'CS502' },
          { name: 'Theory of Computation', code: 'CS503' },
          { name: 'Artificial Intelligence', code: 'CS504' },
          { name: 'Web Technologies', code: 'CS505' }
        ]
      },
      {
        semNumber: 6,
        name: 'Semester 6',
        categories: ['MID-1', 'MID-2', 'SEM-6', 'Presentation', 'Records', 'Assignments'],
        subjects: [
          { name: 'Machine Learning', code: 'CS601' },
          { name: 'Compiler Design', code: 'CS602' },
          { name: 'Cryptography & Network Security', code: 'CS603' },
          { name: 'Cloud Computing', code: 'CS604' },
          { name: 'Full Stack Development', code: 'CS605' }
        ]
      }
    ]
  },
  {
    yearNumber: 4,
    name: '4th Year',
    semesters: [
      {
        semNumber: 7,
        name: 'Semester 7',
        categories: ['MID-1', 'MID-2', 'SEM-7', 'Projects', 'Assignments'],
        subjects: [
          { name: 'Distributed Systems', code: 'CS701' },
          { name: 'Deep Learning', code: 'CS702' },
          { name: 'Big Data Analytics', code: 'CS703' },
          { name: 'Cyber Security', code: 'CS704' },
          { name: 'Major Project Phase-I', code: 'CS705' }
        ]
      },
      {
        semNumber: 8,
        name: 'Semester 8',
        categories: ['MID-1', 'MID-2', 'SEM-8', 'Projects', 'Internship'],
        subjects: [
          { name: 'Major Project Phase-II', code: 'CS801' },
          { name: 'Professional Ethics & Intellectual Property', code: 'CS802' },
          { name: 'Technical Seminar & Viva Voce', code: 'CS803' }
        ]
      }
    ]
  }
];

// Helper to seed curriculum
function seedCurriculum() {
  const insertYear = db.prepare('INSERT OR IGNORE INTO years (id, name, slug, display_order) VALUES (?, ?, ?, ?)');
  const insertSem = db.prepare('INSERT OR IGNORE INTO semesters (id, year_id, sem_number, name, slug, display_order) VALUES (?, ?, ?, ?, ?, ?)');
  const insertCat = db.prepare('INSERT OR IGNORE INTO categories (semester_id, name, slug, is_default, display_order) VALUES (?, ?, ?, ?, ?)');
  const insertSub = db.prepare('INSERT OR IGNORE INTO subjects (category_id, name, code, slug, description) VALUES (?, ?, ?, ?, ?)');
  const insertSyllabus = db.prepare('INSERT OR IGNORE INTO syllabus (subject_id, title) VALUES (?, ?)');
  const insertUnit = db.prepare('INSERT INTO units (syllabus_id, unit_number, title, display_order) VALUES (?, ?, ?, ?)');
  const insertTopic = db.prepare('INSERT INTO topics (unit_id, topic_name, display_order) VALUES (?, ?, ?)');

  const transaction = db.transaction(() => {
    for (const year of CURRICULUM) {
      insertYear.run(year.yearNumber, year.name, `year-${year.yearNumber}`, year.yearNumber);

      for (const sem of year.semesters) {
        insertSem.run(sem.semNumber, year.yearNumber, sem.semNumber, sem.name, `sem-${sem.semNumber}`, sem.semNumber);

        // Insert categories for this semester
        let catOrder = 1;
        for (const catName of sem.categories) {
          const catSlug = slugify(catName);
          const isDef = ['mid-1', 'mid-2', `sem-${sem.semNumber}`].includes(catSlug) ? 1 : 0;
          insertCat.run(sem.semNumber, catName, catSlug, isDef, catOrder++);
        }

        // Get all categories for this semester
        const cats = db.prepare('SELECT id, slug, name FROM categories WHERE semester_id = ?').all(sem.semNumber);

        // For each category, seed the subjects
        for (const cat of cats) {
          for (const sub of sem.subjects) {
            const subSlug = slugify(sub.name);
            insertSub.run(cat.id, sub.name, sub.code || '', subSlug, `${sub.name} course materials for ${cat.name}`);

            // If syllabus exists, seed it for MID-1, MID-2, SEM-x
            const createdSub = db.prepare('SELECT id FROM subjects WHERE category_id = ? AND slug = ?').get(cat.id, subSlug);
            if (createdSub && sub.syllabus) {
              const existingSyllabus = db.prepare('SELECT id FROM syllabus WHERE subject_id = ?').get(createdSub.id);
              if (!existingSyllabus) {
                const res = insertSyllabus.run(createdSub.id, sub.syllabus.title);
                const syllabusId = res.lastInsertRowid;
                let uOrd = 1;
                for (const unit of sub.syllabus.units) {
                  const uRes = insertUnit.run(syllabusId, unit.unitNumber, unit.title, uOrd++);
                  const unitId = uRes.lastInsertRowid;
                  let tOrd = 1;
                  for (const topic of unit.topics) {
                    insertTopic.run(unitId, topic, tOrd++);
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  transaction();
  console.log('Curriculum seeded successfully!');
}

// Map files to appropriate Year, Semester, Category, Subject
function mapFileToDestination(filename) {
  const lower = filename.toLowerCase();

  // Semester 3 (Year 2, Sem 3) is active for MRV-25
  let yearNum = 2;
  let semNum = 3;
  let catSlug = 'mid-2';
  let subSlug = 'backend-development';

  if (lower.includes('mid-i') || lower.includes('mid-1') || lower.includes('mid 1')) {
    catSlug = 'mid-1';
  } else if (lower.includes('mid-ii') || lower.includes('mid-2') || lower.includes('mid 2')) {
    catSlug = 'mid-2';
  } else if (lower.includes('sem-1')) {
    yearNum = 1;
    semNum = 1;
    catSlug = 'sem-1';
  } else if (lower.includes('sem-2')) {
    yearNum = 1;
    semNum = 2;
    catSlug = 'sem-2';
  } else if (lower.includes('sem-3')) {
    catSlug = 'sem-3';
  }

  // Determine Subject
  if (lower.includes('backend') || lower.includes('express')) {
    subSlug = 'backend-development';
  } else if (lower.includes('daa') || lower.includes('algorithm')) {
    subSlug = 'design-and-analysis-of-algorithms';
  } else if (lower.includes('digital') || lower.includes('logic') || lower.includes('number systems') || lower.includes('boolean')) {
    subSlug = 'digital-electronics';
  } else if (lower.includes('p&s') || lower.includes('probability') || lower.includes('stats')) {
    subSlug = 'probability-and-statistics';
  } else if (lower.includes('english') || lower.includes('communication') || lower.includes('acs')) {
    subSlug = 'advanced-communication-skills';
  } else if (lower.includes('reasoning') || lower.includes('blood relations') || lower.includes('aptitude')) {
    subSlug = 'logical-reasoning';
  } else if (lower.includes('math') || lower.includes('calculus')) {
    subSlug = 'mathematics-i';
  }

  // If filename includes 'presentation', category can be presentation
  if (lower.includes('presentation')) {
    catSlug = 'presentation';
  }

  return { yearNum, semNum, catSlug, subSlug };
}

// Migrate existing files from external locations without deleting or altering them
async function migrateExistingFiles() {
  const candidateSources = [
    {
      dir: 'D:\\SEM-2 ---MID-2',
      files: [
        'B.TECH II YEAR I SEM(MRV-25) MID-I EXAMINATIONS AUG-2026.pdf',
        'backend module 1.pdf',
        'backend module 2.pdf',
        'backend module 3.docx',
        'CSE II-I COURSE SRTUCTURE & SYLLABUS.pdf',
        'daa module 1 and 2 question bank .pdf',
        'DIGITAL ELECTRONICS QUESTION BANK.pdf',
        'english question bank.pdf',
        'LOGICAL REASONING ( QUESTION BANK).docx.pdf',
        'probability and stats module 2.pdf',
        'QUESTION BANK  P&S unit 1.pdf',
        'UNIT 3    P&S QUESTION BANK (2).pdf',
        'unit-3 QB (6).docx.pdf'
      ]
    },
    {
      dir: 'D:\\',
      files: [
        'Blood Relations Presentation.pdf',
        'Introduction to Express JS.pdf',
        'Introduction to Probability and Statistics.pdf',
        'Module 1_ Number Systems, Boolean Algebra & Logic Gates.pdf'
      ]
    },
    {
      dir: 'C:\\Users\\manis\\Downloads',
      files: [
        'Advanced Communication Skills_MRV_MID-2_Assignment-2.pdf',
        'B.Tech II year-I Semester(MRV-25 Regulation) Mid-II Term Examinations October-2026.jpeg',
        'DAA_Exam_Ready_Notes.md',
        'DAA_Exam_Ready_Notes.md.pdf',
        'MID-1--Digital Logic & Number Systems Explained - Google Gemini.pdf'
      ]
    }
  ];

  console.log('Checking and migrating existing study files...');

  for (const src of candidateSources) {
    if (!fs.existsSync(src.dir)) continue;

    for (const fileName of src.files) {
      const srcPath = path.join(src.dir, fileName);
      if (!fs.existsSync(srcPath)) continue;

      const mapping = mapFileToDestination(fileName);

      // Find or create category
      let category = db.prepare(`
        SELECT c.id FROM categories c
        WHERE c.semester_id = ? AND c.slug = ?
      `).get(mapping.semNum, mapping.catSlug);

      if (!category) {
        // Create category if missing
        const catName = mapping.catSlug.toUpperCase();
        db.prepare('INSERT INTO categories (semester_id, name, slug, is_default, display_order) VALUES (?, ?, ?, 0, 10)')
          .run(mapping.semNum, catName, mapping.catSlug);
        category = db.prepare('SELECT id FROM categories WHERE semester_id = ? AND slug = ?').get(mapping.semNum, mapping.catSlug);
      }

      // Find or create subject
      let subject = db.prepare(`
        SELECT s.id, s.name FROM subjects s
        WHERE s.category_id = ? AND s.slug = ?
      `).get(category.id, mapping.subSlug);

      if (!subject) {
        // Fallback: pick any subject in category or create it
        const formattedName = mapping.subSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        db.prepare('INSERT INTO subjects (category_id, name, code, slug, description) VALUES (?, ?, ?, ?, ?)')
          .run(category.id, formattedName, '', mapping.subSlug, `${formattedName} study materials`);
        subject = db.prepare('SELECT id, name FROM subjects WHERE category_id = ? AND slug = ?').get(category.id, mapping.subSlug);
      }

      // Check if file is already imported
      const existingFile = db.prepare('SELECT id FROM files WHERE subject_id = ? AND original_name = ?').get(subject.id, fileName);
      if (existingFile) {
        continue;
      }

      // Prepare target directory: study-materials/year-X/semester-Y/category/subject/
      const targetDir = path.join(
        MATERIALS_ROOT,
        `year-${mapping.yearNum}`,
        `semester-${mapping.semNum}`,
        mapping.catSlug,
        mapping.subSlug
      );
      fs.mkdirSync(targetDir, { recursive: true });

      const safeStoredName = `${Date.now()}-${fileName.replace(/[^\w\.\-]/g, '_')}`;
      const targetFilePath = path.join(targetDir, safeStoredName);

      // Copy file (NEVER delete original)
      try {
        fs.copyFileSync(srcPath, targetFilePath);
        const stats = fs.statSync(targetFilePath);
        const ext = path.extname(fileName).replace('.', '').toLowerCase();

        // Extract text for full text search
        const contentText = await extractTextFromFile(targetFilePath, ext);

        const relPath = path.relative(MATERIALS_ROOT, targetFilePath).replace(/\\/g, '/');

        db.prepare(`
          INSERT INTO files (subject_id, original_name, stored_name, file_path, file_type, mime_type, file_size, is_favorite, content_text)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          subject.id,
          fileName,
          safeStoredName,
          relPath,
          ext,
          getMimeType(ext),
          stats.size,
          fileName.toLowerCase().includes('important') || fileName.toLowerCase().includes('syllabus') ? 1 : 0,
          contentText
        );

        console.log(`Migrated: ${fileName} -> ${relPath}`);
      } catch (err) {
        console.error(`Failed to migrate ${fileName}:`, err.message);
      }
    }
  }

  console.log('File migration check completed.');
}

function getMimeType(ext) {
  const map = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ppt: 'application/vnd.ms-powerpoint',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    txt: 'text/plain',
    md: 'text/markdown',
    csv: 'text/csv',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    mp4: 'video/mp4',
    mp3: 'audio/mpeg',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed'
  };
  return map[ext] || 'application/octet-stream';
}

async function runImporter() {
  initDb();
  seedCurriculum();
  await migrateExistingFiles();
}

module.exports = {
  runImporter,
  slugify,
  MATERIALS_ROOT,
  getMimeType
};
