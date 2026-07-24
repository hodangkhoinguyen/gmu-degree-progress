// Hand-verified overrides for the flagship Computer Science programs, since
// the generic scraper can't reliably infer area-constrained rules ("2 core
// courses from 2 different areas") or distinguish concrete requirements from
// exam/thesis alternatives. Sourced from https://catalog.gmu.edu (School of
// Computing, Department of Computer Science) — re-check against the live
// catalog periodically, as requirements change by catalog year.

const SOURCE = {
  bs: "https://catalog.gmu.edu/colleges-schools/engineering-computing/school-computing/computer-science/computer-science-bs/",
  ms: "https://catalog.gmu.edu/colleges-schools/engineering-computing/school-computing/computer-science/computer-science-ms/",
  phd: "https://catalog.gmu.edu/colleges-schools/engineering-computing/school-computing/computer-science/computer-science-phd/",
};

const COLLEGE = "College of Engineering and Computing";
const DEPARTMENT = "Department of Computer Science";

const csBs = {
  id: "bachelor-s-bs-computer-science",
  level: "Bachelor's",
  degreeType: "BS",
  name: "Computer Science",
  college: COLLEGE,
  department: DEPARTMENT,
  totalCredits: 120,
  sourceUrl: SOURCE.bs,
  needsReview: false,
  handVerified: true,
  notes: [
    "At most 6 credits total of CS 499 Special Topics may count toward the senior computer science requirement.",
  ],
  requirementGroups: [
    {
      key: "cs-core",
      label: "Computer Science Core",
      type: "all-of",
      courseCodes: ["CS 110", "CS 112", "CS 108", "CS 211", "CS 262", "CS 310", "CS 321", "CS 330", "CS 367", "CS 405", "CS 450"],
    },
    {
      key: "cs-core-select-one",
      label: "Computer Science Core — select one of the following",
      type: "choose-n-courses",
      minCourses: 1,
      courseCodes: ["CS 471", "CS 571", "CS 483", "CS 583"],
    },
    {
      key: "senior-cs-select-one",
      label: "Senior Computer Science — select one of the following",
      type: "choose-n-courses",
      minCourses: 1,
      courseCodes: ["CS 455", "CS 555", "CS 468", "CS 475"],
    },
    {
      key: "senior-cs-select-three",
      label: "Senior Computer Science — select three additional courses from the following",
      type: "choose-n-courses",
      minCourses: 3,
      courseCodes: [
        "CS 425", "CS 440", "CS 540", "CS 450", "CS 451", "CS 551", "CS 452", "CS 453",
        "CS 455", "CS 555", "CS 463", "CS 465", "CS 468", "CS 475", "CS 477", "CS 478",
        "CS 480", "CS 580", "CS 482", "CS 484", "CS 584", "CS 485", "CS 487", "CS 587",
        "CS 489", "CS 491", "CS 499", "MATH 446", "OR 481",
      ],
    },
    {
      key: "mathematics",
      label: "Mathematics",
      type: "all-of",
      courseCodes: ["MATH 113", "MATH 123", "MATH 114", "MATH 125", "MATH 203", "MATH 213"],
    },
    {
      key: "statistics",
      label: "Statistics",
      type: "all-of",
      courseCodes: ["STAT 344"],
    },
    {
      key: "cs-related-electives",
      label: "Computer Science-Related Courses — select 6 credits from the following",
      type: "choose-n-credits",
      minCredits: 6,
      courseCodes: [
        "STAT 354", "OR 335", "OR 441", "OR 442", "ECE 301", "ECE 231", "ECE 350", "ECE 446",
        "ECE 447", "ECE 455", "ECE 511", "SWE 419", "SWE 619", "SWE 432", "SWE 642", "SWE 437",
        "SWE 637", "SWE 443", "SYST 371", "SYST 470", "PHIL 371", "PHIL 376", "ENGH 388",
        "MATH 351", "SWE 301",
      ],
    },
    {
      key: "lab-science-sequence",
      label: "Approved two-course lab science sequence (lecture + lab)",
      type: "choose-n-courses",
      minCourses: 2,
      courseCodes: ["BIOL 102", "BIOL 106", "BIOL 107", "BIOL 103", "CHEM 211", "CHEM 212", "GEOL 101", "GEOL 102", "PHYS 160", "PHYS 260"],
    },
  ],
  concentrations: [],
};

const csMs = {
  id: "master-s-ms-computer-science",
  level: "Master's",
  degreeType: "MS",
  name: "Computer Science",
  college: COLLEGE,
  department: DEPARTMENT,
  totalCredits: 30,
  sourceUrl: SOURCE.ms,
  needsReview: false,
  handVerified: true,
  notes: [
    "CS 530 and CS 531 must be taken as your first two courses; strong students may substitute electives or test out via placement exam.",
    "All core courses require a grade of B- or higher — a lower grade must be retaken or counted as an elective instead.",
    "Up to 6 advanced credits may be replaced by CS 798 Research Project (3 cr) or CS 799 MS Thesis (6 cr) with advisor approval.",
    "Up to 2 courses outside the pre-approved list may count with program director approval.",
  ],
  requirementGroups: [
    {
      key: "foundation-courses",
      label: "Foundation Courses (first two courses in the program)",
      type: "all-of",
      minGrade: "B-",
      courseCodes: ["CS 530", "CS 531"],
    },
    {
      key: "core-by-area",
      label: "Core by Area — CS 583, plus 2 more core courses from 2 different areas",
      type: "area-constrained",
      minGrade: "B-",
      requiredCourseCodes: ["CS 583"],
      minAreas: 2,
      areas: [
        { name: "Artificial Intelligence and Databases", courseCodes: ["CS 550", "CS 580", "CS 584"] },
        { name: "Programming Languages and Software Engineering", courseCodes: ["CS 540", "SWE 619", "SWE 621"] },
        { name: "Systems and Networks", courseCodes: ["CS 555", "CS 571", "ISA 562"] },
        { name: "Visual Computing", courseCodes: ["CS 551"] },
      ],
    },
    {
      key: "advanced-electives",
      label: "Advanced Electives — 4 courses (12 credits) spanning at least 2 areas",
      type: "area-constrained",
      minAreas: 2,
      minCourses: 4,
      areas: [
        {
          name: "Artificial Intelligence and Databases",
          courseCodes: ["CS 650", "CS 657", "CS 661", "CS 678", "CS 685", "CS 687", "CS 688", "CS 690", "CS 747", "CS 757", "CS 782", "CS 787", "INFS 740", "INFS 760", "INFS 772", "INFS 774"],
        },
        {
          name: "Programming Languages and Software Engineering",
          courseCodes: ["CS 691", "SWE 631", "SWE 632", "SWE 637", "SWE 642", "SWE 645", "SWE 681", "ISA 681", "SWE 699", "SWE 795", "SWE 796"],
        },
        {
          name: "Systems and Networks",
          courseCodes: ["CS 635", "CS 655", "CS 665", "CS 672", "CS 675", "CS 677", "CS 692", "CS 719", "CS 773", "ISA 656", "ISA 673", "ISA 674", "SWE 660"],
        },
        {
          name: "Theoretical Computer Science",
          courseCodes: ["CS 600", "CS 630", "CS 683", "CS 684", "CS 693"],
        },
        {
          name: "Visual Computing",
          courseCodes: ["CS 653", "CS 662", "CS 663", "CS 682", "CS 694"],
        },
      ],
    },
    {
      key: "constrained-elective",
      label: "Constrained Elective — 1 more basic or advanced course",
      type: "choose-n-courses",
      minCourses: 1,
      courseCodes: [
        "CS 550", "CS 580", "CS 584", "INFS 623", "CS 540", "SWE 619", "SWE 621", "SWE 622", "SWE 625",
        "CS 531", "CS 555", "CS 571", "CS 587", "ISA 562", "ISA 564", "CS 530", "CS 583", "CS 551", "CS 595",
      ],
    },
  ],
  concentrations: [
    {
      key: "cysc",
      name: "Cyber Security",
      requirementGroups: [
        {
          key: "cysc-required",
          label: "Cyber Security — Required",
          type: "all-of",
          courseCodes: ["ISA 656", "ISA 562"],
        },
        {
          key: "cysc-electives",
          label: "Cyber Security — choose 2-3 electives",
          type: "choose-n-courses",
          minCourses: 2,
          courseCodes: ["CS 587", "ISA 564", "ISA 673", "ISA 674", "SWE 637", "SWE 681", "ISA 681"],
        },
        {
          key: "cysc-related",
          label: "Cyber Security — choose 0-1 related course",
          type: "choose-n-courses",
          minCourses: 0,
          courseCodes: ["CS 540", "CS 555", "CS 571", "CS 600", "CS 655"],
        },
      ],
    },
    {
      key: "ml",
      name: "Machine Learning",
      requirementGroups: [
        {
          key: "ml-required",
          label: "Machine Learning — Required",
          type: "all-of",
          courseCodes: ["CS 584", "CS 688"],
        },
        {
          key: "ml-electives",
          label: "Machine Learning — choose 2-3 electives",
          type: "choose-n-courses",
          minCourses: 2,
          courseCodes: ["CS 657", "CS 661", "CS 678", "CS 747", "CS 757", "CS 782"],
        },
        {
          key: "ml-related",
          label: "Machine Learning — choose 0-1 related course",
          type: "choose-n-courses",
          minCourses: 0,
          courseCodes: ["CS 580", "CS 687", "CS 685", "CS 682"],
        },
      ],
    },
  ],
};

const csPhd = {
  id: "doctoral-phd-computer-science",
  level: "Doctoral",
  degreeType: "PhD",
  name: "Computer Science",
  college: COLLEGE,
  department: DEPARTMENT,
  totalCredits: 72,
  sourceUrl: SOURCE.phd,
  needsReview: false,
  handVerified: true,
  notes: [
    "48 credits of coursework + 24 credits of dissertation research (CS 998/999-type courses managed with your advisor).",
    "Beyond the 4 required courses below: 9 credits of advanced graduate courses (B or better, no independent study) and 30 credits of graduate-level courses in CS or a related research area, chosen with your advisor — not a fixed list, so not tracked as checkable requirements here.",
    "Breadth Requirement (separate from coursework): superior grades (A- or better in 3 of 4, B or better in the 4th) in 4 graduate courses including CS 583, spanning at least 3 of 8 areas — or pass the written qualifying exams instead. Not auto-evaluated; check with the CS graduate office.",
    "Students entering with a conferred MS may transfer up to 30 credits.",
  ],
  requirementGroups: [
    {
      key: "doctoral-coursework-required",
      label: "Doctoral Coursework — required",
      type: "all-of",
      minGrade: "B",
      courseCodes: ["CS 600", "CS 700", "CS 701", "CS 800"],
    },
  ],
  concentrations: [],
};

export const csPrograms = [csBs, csMs, csPhd];
