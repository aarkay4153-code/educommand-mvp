export type BoardRisk = "critical" | "needs_attention" | "safe" | "high_performer";

export type BoardClassKey = "class-10" | "class-12";

export const boardRiskLabels: Record<BoardRisk, string> = {
  critical: "Critical",
  needs_attention: "Needs Attention",
  safe: "Safe",
  high_performer: "High Performer",
};

export const boardRiskTone: Record<BoardRisk, "danger" | "warning" | "success" | "info"> = {
  critical: "danger",
  needs_attention: "warning",
  safe: "success",
  high_performer: "info",
};

export const boardCommandSummaries = [
  {
    classKey: "class-10" as const,
    title: "Class 10 Board Command",
    readinessScore: 78,
    trend: "+4% this week",
    risk: "needs_attention" as BoardRisk,
    riskSummary: "Maths revision and Science practical records need closer follow-up.",
    syllabusStatus: "88% syllabus complete, 64% revision complete",
    mockStatus: "Pre-board 1 complete, Pre-board 2 papers under review",
    urgentAlerts: 5,
    actionPending: "2 HOD reviews, 3 remedial batches",
    href: "/board-command/class-10",
  },
  {
    classKey: "class-12" as const,
    title: "Class 12 Board Command",
    readinessScore: 71,
    trend: "+2% this week",
    risk: "critical" as BoardRisk,
    riskSummary: "Physics practical records and Commerce accountancy revision are behind target.",
    syllabusStatus: "82% syllabus complete, 52% revision complete",
    mockStatus: "Pre-board 1 average below target in two streams",
    urgentAlerts: 8,
    actionPending: "4 teacher actions, 2 parent calls, 2 practical file closures",
    href: "/board-command/class-12",
  },
];

export const boardCommandDetails = {
  "class-10": {
    title: "Class 10 Board Command",
    subtitle: "Principal view of Class 10 board readiness.",
    readinessScore: 78,
    risk: "needs_attention" as BoardRisk,
    trends: [
      { label: "Readiness trend", value: "+4%", detail: "Improved after revision timetable change" },
      { label: "Mock average", value: "68%", detail: "Target is 75%" },
      { label: "Revision completion", value: "64%", detail: "Maths and Science behind" },
      { label: "Action pending", value: "5", detail: "Requires coordinator follow-up" },
    ],
    subjects: [
      { subject: "Mathematics", syllabus: "92%", revision: "58%", mock: "61%", risk: "critical" as BoardRisk, action: "Daily revision batch" },
      { subject: "Science", syllabus: "86%", revision: "62%", mock: "65%", risk: "needs_attention" as BoardRisk, action: "Practical file closure" },
      { subject: "English", syllabus: "95%", revision: "78%", mock: "74%", risk: "safe" as BoardRisk, action: "Writing practice" },
      { subject: "Social Studies", syllabus: "88%", revision: "70%", mock: "69%", risk: "safe" as BoardRisk, action: "Map practice review" },
      { subject: "Hindi", syllabus: "91%", revision: "82%", mock: "79%", risk: "high_performer" as BoardRisk, action: "Maintain pace" },
    ],
    alerts: [
      { alert: "Maths mock average below target", level: "critical" as BoardRisk, action: "Principal review with subject teacher" },
      { alert: "Science practical records pending for 18 students", level: "needs_attention" as BoardRisk, action: "Close by Friday" },
      { alert: "Three students missed remedial test", level: "needs_attention" as BoardRisk, action: "Class teacher follow-up" },
    ],
    panels: [
      { title: "At-risk student panel", detail: "12 students below 50% in Maths mock. Names and teacher remarks should open only in this panel." },
      { title: "Teacher remarks panel", detail: "Subject-wise remarks are intentionally hidden from the summary view." },
    ],
  },
  "class-12": {
    title: "Class 12 Board Command",
    subtitle: "Principal view of Class 12 board readiness.",
    readinessScore: 71,
    risk: "critical" as BoardRisk,
    trends: [
      { label: "Readiness trend", value: "+2%", detail: "Slow improvement this week" },
      { label: "Mock average", value: "63%", detail: "Target is 75%" },
      { label: "Revision completion", value: "52%", detail: "Stream-wise backlog exists" },
      { label: "Action pending", value: "8", detail: "Requires principal escalation" },
    ],
    subjects: [
      { subject: "Physics", syllabus: "80%", revision: "45%", mock: "55%", risk: "critical" as BoardRisk, action: "Practical file closure and numericals plan" },
      { subject: "Accountancy", syllabus: "78%", revision: "49%", mock: "58%", risk: "critical" as BoardRisk, action: "Extra problem-solving sessions" },
      { subject: "Chemistry", syllabus: "84%", revision: "55%", mock: "62%", risk: "needs_attention" as BoardRisk, action: "Organic revision timetable" },
      { subject: "English", syllabus: "94%", revision: "76%", mock: "72%", risk: "safe" as BoardRisk, action: "Writing practice" },
      { subject: "Business Studies", syllabus: "90%", revision: "68%", mock: "70%", risk: "safe" as BoardRisk, action: "Case study drill" },
    ],
    alerts: [
      { alert: "Physics practical records behind target", level: "critical" as BoardRisk, action: "HOD intervention today" },
      { alert: "Commerce revision completion below 50%", level: "critical" as BoardRisk, action: "Daily accountancy tracker" },
      { alert: "Pre-board 2 paper moderation pending", level: "needs_attention" as BoardRisk, action: "Close moderation by Thursday" },
    ],
    panels: [
      { title: "Stream-wise risk panel", detail: "Science and Commerce risk lists open here, away from the main summary." },
      { title: "Student support panel", detail: "Student names, parent-call status and remarks are hidden until opened." },
    ],
  },
};

export const class10BoardDashboard = {
  metrics: {
    syllabusCompletion: 88,
    revisionCompletion: 64,
    mockPerformance: 68,
    attendanceScore: 82,
    weakStudentScore: 70,
  },
  studentRiskCategories: [
    { label: "Critical Support Needed", value: 12, risk: "critical" as BoardRisk, detail: "Students below 50% in latest mock or declining in two subjects." },
    { label: "Needs Extra Coaching", value: 28, risk: "needs_attention" as BoardRisk, detail: "Students assigned for remedial batches this week." },
    { label: "Safe Zone", value: 86, risk: "safe" as BoardRisk, detail: "Students currently above minimum board readiness threshold." },
    { label: "High Scorer / Merit Potential", value: 18, risk: "high_performer" as BoardRisk, detail: "Students consistently scoring above 85%." },
  ],
  subjectWeaknessMap: [
    { subject: "Mathematics", weakTopics: "Quadratic equations, trigonometry identities", weakStudents: 22, severity: "critical" as BoardRisk },
    { subject: "Science", weakTopics: "Electricity numericals, chemical reactions", weakStudents: 18, severity: "needs_attention" as BoardRisk },
    { subject: "Social Studies", weakTopics: "Map work, modern history dates", weakStudents: 11, severity: "needs_attention" as BoardRisk },
    { subject: "English", weakTopics: "Formal letter format, long answers", weakStudents: 7, severity: "safe" as BoardRisk },
  ],
  improvementTrend: [
    { label: "Improving", value: 46, risk: "safe" as BoardRisk },
    { label: "Stagnant", value: 31, risk: "needs_attention" as BoardRisk },
    { label: "Declining", value: 14, risk: "critical" as BoardRisk },
  ],
  extraCoaching: {
    remedialClassesConducted: 9,
    studentsAssigned: 40,
    studentsAttending: 32,
    remedialAbsentees: 8,
    risk: "needs_attention" as BoardRisk,
  },
  syllabusRevision: [
    { subject: "Mathematics", syllabus: 92, revisionStatus: "in_progress", teacherLatestDate: "27 May", risk: "critical" as BoardRisk },
    { subject: "Science", syllabus: 86, revisionStatus: "in_progress", teacherLatestDate: "27 May", risk: "needs_attention" as BoardRisk },
    { subject: "English", syllabus: 95, revisionStatus: "in_progress", teacherLatestDate: "26 May", risk: "safe" as BoardRisk },
    { subject: "Social Studies", syllabus: 88, revisionStatus: "started", teacherLatestDate: "25 May", risk: "needs_attention" as BoardRisk },
    { subject: "Hindi", syllabus: 91, revisionStatus: "completed", teacherLatestDate: "27 May", risk: "high_performer" as BoardRisk },
  ],
  mockStatus: [
    { exam: "Pre-board 1", conducted: "Yes", averageScore: "68%", weakSubjects: "Maths, Science", highScorers: 18, pendingMarksEntry: 0, risk: "needs_attention" as BoardRisk },
    { exam: "Unit Mock 2", conducted: "Yes", averageScore: "71%", weakSubjects: "Maths", highScorers: 21, pendingMarksEntry: 2, risk: "needs_attention" as BoardRisk },
    { exam: "Pre-board 2", conducted: "Scheduled", averageScore: "Not available", weakSubjects: "Pending", highScorers: 0, pendingMarksEntry: 5, risk: "critical" as BoardRisk },
  ],
  parentIntervention: {
    studentsNeedingParentMeeting: 19,
    criticalCases: 7,
    pendingParentMeetings: 11,
    risk: "critical" as BoardRisk,
  },
  dailyAlerts: [
    { type: "Absentees", count: 9, message: "Repeated absence in revision periods", risk: "needs_attention" as BoardRisk },
    { type: "Weak students", count: 12, message: "Critical support group needs daily tracking", risk: "critical" as BoardRisk },
    { type: "Teacher concerns", count: 3, message: "Maths and Science concerns pending review", risk: "critical" as BoardRisk },
    { type: "Remedial absentees", count: 8, message: "Absent from extra coaching sessions", risk: "needs_attention" as BoardRisk },
    { type: "Syllabus delay", count: 2, message: "Revision plan behind in Maths and Social Studies", risk: "needs_attention" as BoardRisk },
  ],
  detailPanels: {
    studentRisks: [
      { name: "Student A", category: "Critical Support Needed", remark: "Below 50% in Maths and Science mock." },
      { name: "Student B", category: "Needs Extra Coaching", remark: "Improving attendance but weak in trigonometry." },
      { name: "Student C", category: "High Scorer / Merit Potential", remark: "Potential 90%+ if writing practice continues." },
    ],
    subjectWeakness: [
      { subject: "Mathematics", remark: "Teacher requests daily 30-minute trigonometry revision." },
      { subject: "Science", remark: "Numericals practice and practical file closure required." },
      { subject: "Social Studies", remark: "Map work drill to be repeated twice this week." },
    ],
    intervention: [
      { name: "Student D", remark: "Parent meeting pending for repeated remedial absence." },
      { name: "Student E", remark: "Principal intervention requested by class teacher." },
      { name: "Student F", remark: "Needs attendance and revision commitment from parent." },
    ],
    dailyAlerts: [
      { name: "Student G", remark: "Absent for two consecutive revision periods." },
      { name: "Student H", remark: "Declining in Maths weekly test." },
      { name: "Teacher note", remark: "Science teacher flagged practical records as urgent." },
    ],
  },
};

export function calculateClass10ReadinessScore() {
  const { attendanceScore, mockPerformance, revisionCompletion, syllabusCompletion, weakStudentScore } =
    class10BoardDashboard.metrics;

  return Math.round(
    syllabusCompletion * 0.25 +
      revisionCompletion * 0.25 +
      mockPerformance * 0.25 +
      attendanceScore * 0.15 +
      weakStudentScore * 0.1,
  );
}

export function riskFromScore(score: number): BoardRisk {
  if (score < 60) return "critical";
  if (score < 75) return "needs_attention";
  if (score < 90) return "safe";
  return "high_performer";
}

export const class12BoardDashboard = {
  metrics: {
    syllabusCompletion: 82,
    revisionCompletion: 52,
    mockPerformance: 63,
    practicalProjectScore: 68,
    competitiveBalanceScore: 59,
  },
  streamReadiness: [
    { stream: "Science", syllabus: "80%", revisionStatus: "in_progress", mockStatus: "Average 61%", risk: "critical" as BoardRisk },
    { stream: "Commerce", syllabus: "78%", revisionStatus: "started", mockStatus: "Average 60%", risk: "critical" as BoardRisk },
    { stream: "Humanities", syllabus: "88%", revisionStatus: "in_progress", mockStatus: "Average 71%", risk: "safe" as BoardRisk },
  ],
  studentRiskCategories: [
    { label: "Board Risk", value: 24, risk: "critical" as BoardRisk, detail: "Students below expected board threshold." },
    { label: "Needs Academic Intervention", value: 36, risk: "needs_attention" as BoardRisk, detail: "Subject-specific intervention needed." },
    { label: "College Admission Sensitive", value: 19, risk: "needs_attention" as BoardRisk, detail: "Performance may affect preferred admission paths." },
    { label: "High Scorer / Topper Potential", value: 16, risk: "high_performer" as BoardRisk, detail: "Potential merit list or 90%+ group." },
    { label: "Competitive Exam Focus Group", value: 31, risk: "high_performer" as BoardRisk, detail: "Students balancing boards with entrance preparation." },
  ],
  performanceHeatmap: [
    { subject: "Physics", average: "55%", weakTopicCount: 6, highRiskCount: 18, highPerformerCount: 7, risk: "critical" as BoardRisk },
    { subject: "Chemistry", average: "62%", weakTopicCount: 4, highRiskCount: 12, highPerformerCount: 9, risk: "needs_attention" as BoardRisk },
    { subject: "Mathematics", average: "66%", weakTopicCount: 5, highRiskCount: 14, highPerformerCount: 11, risk: "needs_attention" as BoardRisk },
    { subject: "Accountancy", average: "58%", weakTopicCount: 5, highRiskCount: 16, highPerformerCount: 6, risk: "critical" as BoardRisk },
    { subject: "English", average: "72%", weakTopicCount: 2, highRiskCount: 5, highPerformerCount: 18, risk: "safe" as BoardRisk },
  ],
  combinationRisks: [
    { combination: "Physics + Maths", riskSummary: "Numericals weak across both subjects", affectedStudents: 14, risk: "critical" as BoardRisk },
    { combination: "Accountancy + Economics", riskSummary: "Low application score in problem-based questions", affectedStudents: 11, risk: "needs_attention" as BoardRisk },
    { combination: "History + Political Science", riskSummary: "Answer structuring needs practice", affectedStudents: 7, risk: "safe" as BoardRisk },
  ],
  topperTracker: {
    highScorerCount: 22,
    topperPotentialCount: 9,
    supportSubjects: "Physics, Accountancy, Mathematics",
    meritImprovementAlerts: 5,
    risk: "high_performer" as BoardRisk,
  },
  competitiveBalance: {
    competitiveExamFocusStudents: 31,
    boardPerformanceRiskAmongFocus: 13,
    balanceInterventionNeeded: 10,
    risk: "needs_attention" as BoardRisk,
  },
  practicalProjectTracker: [
    { subject: "Physics", practicalCompletion: "62%", projectSubmission: "Not applicable", internalPending: 18, risk: "critical" as BoardRisk },
    { subject: "Chemistry", practicalCompletion: "74%", projectSubmission: "Not applicable", internalPending: 9, risk: "needs_attention" as BoardRisk },
    { subject: "Business Studies", practicalCompletion: "Not applicable", projectSubmission: "81%", internalPending: 6, risk: "safe" as BoardRisk },
    { subject: "English", practicalCompletion: "Not applicable", projectSubmission: "90%", internalPending: 3, risk: "high_performer" as BoardRisk },
  ],
  attendanceRisk: {
    belowThreshold: 17,
    subjectWiseRisk: "Physics lab, Accountancy remedial, English writing practice",
    dailyAbsenteeAlerts: 9,
    risk: "needs_attention" as BoardRisk,
  },
  syllabusRevision: [
    { subject: "Physics", completion: "80%", revisionStatus: "in_progress", risk: "critical" as BoardRisk },
    { subject: "Chemistry", completion: "84%", revisionStatus: "in_progress", risk: "needs_attention" as BoardRisk },
    { subject: "Mathematics", completion: "86%", revisionStatus: "started", risk: "needs_attention" as BoardRisk },
    { subject: "Accountancy", completion: "78%", revisionStatus: "started", risk: "critical" as BoardRisk },
    { subject: "English", completion: "94%", revisionStatus: "in_progress", risk: "safe" as BoardRisk },
  ],
  mockStatus: [
    { test: "Pre-board 1", conducted: "Yes", averageScore: "63%", decliningSubjects: "Physics, Accountancy", pendingMarks: 0, risk: "critical" as BoardRisk },
    { test: "Stream Mock 2", conducted: "Yes", averageScore: "66%", decliningSubjects: "Mathematics", pendingMarks: 3, risk: "needs_attention" as BoardRisk },
    { test: "Pre-board 2", conducted: "Scheduled", averageScore: "Not available", decliningSubjects: "Pending", pendingMarks: 5, risk: "needs_attention" as BoardRisk },
  ],
  parentCounselling: {
    studentsNeedingCounselling: 21,
    streamWiseCount: "Science 10, Commerce 8, Humanities 3",
    urgentCases: 7,
    risk: "critical" as BoardRisk,
  },
  detailPanels: {
    riskStudents: [
      { name: "Student A", category: "Board Risk", remark: "Physics and Maths below admission-sensitive threshold." },
      { name: "Student B", category: "College Admission Sensitive", remark: "Commerce aggregate needs immediate improvement." },
      { name: "Student C", category: "Competitive Exam Focus Group", remark: "Entrance preparation affecting board revision." },
    ],
    topperSupport: [
      { name: "Student D", category: "Topper Potential", remark: "Needs Physics numericals support to cross 90%." },
      { name: "Student E", category: "High Scorer", remark: "Strong in English and Chemistry; Maths consistency needed." },
    ],
    practicals: [
      { name: "Physics", category: "Practical/Internal", remark: "18 files pending teacher verification." },
      { name: "Chemistry", category: "Practical/Internal", remark: "Lab record completion behind target." },
    ],
    counselling: [
      { name: "Student F", category: "Parent Counselling", remark: "Urgent counselling for attendance and low mock performance." },
      { name: "Student G", category: "Parent Counselling", remark: "Commerce revision plan needs parent alignment." },
    ],
  },
};

export function calculateClass12ReadinessScore() {
  const {
    competitiveBalanceScore,
    mockPerformance,
    practicalProjectScore,
    revisionCompletion,
    syllabusCompletion,
  } = class12BoardDashboard.metrics;

  return Math.round(
    syllabusCompletion * 0.22 +
      revisionCompletion * 0.24 +
      mockPerformance * 0.24 +
      practicalProjectScore * 0.15 +
      competitiveBalanceScore * 0.15,
  );
}
