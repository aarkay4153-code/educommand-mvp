import {
  class10BoardDashboard,
  class12BoardDashboard,
  type BoardRisk,
} from "@/lib/board-command-data";

export type BoardAlertSeverity = "red" | "amber" | "green" | "blue";
export type BoardClassValue = "class_10" | "class_12";

export type GeneratedBoardAlert = {
  board_class: BoardClassValue;
  alert_type: string;
  severity: BoardAlertSeverity;
  title: string;
  message: string;
  status: "new";
};

type Class10ReadinessInput = {
  syllabusCompletion: number;
  revisionStatusScore: number;
  mockPerformance: number;
  criticalStudents: number;
  totalStudents: number;
  remedialAttendancePercentage: number;
  dailyUrgentConcerns: number;
  attendanceRiskCount: number;
};

type Class12ReadinessInput = {
  syllabusRevisionScore: number;
  mockPerformance: number;
  practicalInternalScore: number;
  attendanceRiskCount: number;
  totalStudents: number;
  streamSubjectRiskScore: number;
  interventionAlertCount: number;
};

function clampScore(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function penaltyScore(count: number, total: number, maxPenaltyRatio = 0.3) {
  if (total <= 0) return 100;
  const ratio = Math.min(maxPenaltyRatio, Math.max(0, count / total));
  return clampScore(100 - (ratio / maxPenaltyRatio) * 100);
}

export function riskFromScore(score: number): BoardRisk {
  if (score < 60) return "critical";
  if (score < 75) return "needs_attention";
  if (score < 90) return "safe";
  return "high_performer";
}

export function severityToRisk(severity: BoardAlertSeverity): BoardRisk {
  if (severity === "red") return "critical";
  if (severity === "amber") return "needs_attention";
  if (severity === "blue") return "high_performer";
  return "safe";
}

export function calculateClass10ReadinessScore(input: Class10ReadinessInput = buildClass10ScoringInput()) {
  const studentRiskReductionScore = penaltyScore(input.criticalStudents, input.totalStudents);
  const alertConcernScore = clampScore(
    (penaltyScore(input.dailyUrgentConcerns, 10, 0.5) + penaltyScore(input.attendanceRiskCount, input.totalStudents)) / 2,
  );

  return clampScore(
    input.syllabusCompletion * 0.25 +
      input.revisionStatusScore * 0.2 +
      input.mockPerformance * 0.25 +
      studentRiskReductionScore * 0.15 +
      input.remedialAttendancePercentage * 0.1 +
      alertConcernScore * 0.05,
  );
}

export function calculateClass12ReadinessScore(input: Class12ReadinessInput = buildClass12ScoringInput()) {
  const attendanceScore = penaltyScore(input.attendanceRiskCount, input.totalStudents);
  const interventionScore = penaltyScore(input.interventionAlertCount, 20, 0.5);

  return clampScore(
    input.syllabusRevisionScore * 0.25 +
      input.mockPerformance * 0.25 +
      input.practicalInternalScore * 0.15 +
      attendanceScore * 0.1 +
      input.streamSubjectRiskScore * 0.15 +
      interventionScore * 0.1,
  );
}

export function buildClass10ScoringInput(): Class10ReadinessInput {
  const totalStudents = class10BoardDashboard.studentRiskCategories.reduce((sum, item) => sum + item.value, 0);
  const criticalStudents =
    class10BoardDashboard.studentRiskCategories.find((item) => item.risk === "critical")?.value ?? 0;
  const remedialAttendancePercentage =
    class10BoardDashboard.extraCoaching.studentsAssigned > 0
      ? (class10BoardDashboard.extraCoaching.studentsAttending / class10BoardDashboard.extraCoaching.studentsAssigned) * 100
      : 100;
  const dailyUrgentConcerns = class10BoardDashboard.dailyAlerts
    .filter((alert) => alert.risk === "critical" || alert.risk === "needs_attention")
    .reduce((sum, alert) => sum + alert.count, 0);
  const attendanceRiskCount =
    class10BoardDashboard.dailyAlerts.find((alert) => alert.type === "Absentees")?.count ?? 0;

  return {
    syllabusCompletion: class10BoardDashboard.metrics.syllabusCompletion,
    revisionStatusScore: class10BoardDashboard.metrics.revisionCompletion,
    mockPerformance: class10BoardDashboard.metrics.mockPerformance,
    criticalStudents,
    totalStudents,
    remedialAttendancePercentage,
    dailyUrgentConcerns,
    attendanceRiskCount,
  };
}

export function buildClass12ScoringInput(): Class12ReadinessInput {
  const syllabusRevisionScore =
    (class12BoardDashboard.metrics.syllabusCompletion + class12BoardDashboard.metrics.revisionCompletion) / 2;
  const streamSubjectRiskScore = clampScore(
    100 -
      class12BoardDashboard.streamReadiness.filter((item) => item.risk === "critical").length * 18 -
      class12BoardDashboard.performanceHeatmap.filter((item) => item.risk === "critical").length * 10,
  );
  const interventionAlertCount =
    class12BoardDashboard.parentCounselling.urgentCases +
    class12BoardDashboard.attendanceRisk.dailyAbsenteeAlerts +
    class12BoardDashboard.competitiveBalance.balanceInterventionNeeded;

  return {
    syllabusRevisionScore,
    mockPerformance: class12BoardDashboard.metrics.mockPerformance,
    practicalInternalScore: class12BoardDashboard.metrics.practicalProjectScore,
    attendanceRiskCount: class12BoardDashboard.attendanceRisk.belowThreshold,
    totalStudents: class12BoardDashboard.studentRiskCategories.reduce((sum, item) => sum + item.value, 0),
    streamSubjectRiskScore,
    interventionAlertCount,
  };
}

export function generateClass10Alerts(): GeneratedBoardAlert[] {
  const alerts: GeneratedBoardAlert[] = [];
  const repeatedAbsentees = class10BoardDashboard.dailyAlerts.find((alert) => alert.type === "Absentees");
  const declining = class10BoardDashboard.improvementTrend.find((item) => item.label === "Declining");
  const remedialAbsentees = class10BoardDashboard.extraCoaching.remedialAbsentees;
  const parentMeetings = class10BoardDashboard.parentIntervention.pendingParentMeetings;

  if ((repeatedAbsentees?.count ?? 0) > 0) {
    alerts.push(boardAlert("class_10", "student_repeatedly_absent", "amber", "Repeated board absenteeism", repeatedAbsentees?.message ?? "Students are repeatedly absent during board preparation."));
  }

  if ((declining?.value ?? 0) > 0) {
    alerts.push(boardAlert("class_10", "student_declining_trend", "red", "Declining student trend", `${declining?.value ?? 0} Class 10 students are showing a declining academic trend.`));
  }

  class10BoardDashboard.syllabusRevision
    .filter((subject) => subject.syllabus < 90 || subject.risk === "critical")
    .forEach((subject) => {
      alerts.push(boardAlert("class_10", "subject_syllabus_behind", subject.risk === "critical" ? "red" : "amber", `${subject.subject} syllabus/revision behind`, `${subject.subject} is at ${subject.syllabus}% syllabus completion with ${subject.revisionStatus.replaceAll("_", " ")} revision.`));
    });

  if (remedialAbsentees > 0) {
    alerts.push(boardAlert("class_10", "remedial_absentee", "amber", "Remedial absentee follow-up needed", `${remedialAbsentees} students missed remedial support sessions.`));
  }

  class10BoardDashboard.subjectWeaknessMap
    .filter((subject) => subject.weakStudents >= 15)
    .forEach((subject) => {
      alerts.push(boardAlert("class_10", "weak_topic_repeated", subject.severity === "critical" ? "red" : "amber", `${subject.subject} weak topics repeated`, `${subject.weakTopics} are affecting ${subject.weakStudents} students.`));
    });

  class10BoardDashboard.dailyAlerts
    .filter((alert) => alert.type === "Teacher concerns" && alert.count > 0)
    .forEach((alert) => {
      alerts.push(boardAlert("class_10", "teacher_urgent_concern", "red", "Teacher urgent concern pending", alert.message));
    });

  if (parentMeetings > 0) {
    alerts.push(boardAlert("class_10", "parent_meeting_pending", "red", "Parent meetings pending", `${parentMeetings} parent meetings are pending for Class 10 board cases.`));
  }

  return alerts;
}

export function generateClass12Alerts(): GeneratedBoardAlert[] {
  const alerts: GeneratedBoardAlert[] = [];

  class12BoardDashboard.studentRiskCategories
    .filter((category) => category.label === "Board Risk" && category.value > 0)
    .forEach((category) => {
      alerts.push(boardAlert("class_12", "board_risk_student", "red", "Class 12 board risk students", `${category.value} students are below the expected board readiness threshold.`));
    });

  if (class12BoardDashboard.competitiveBalance.boardPerformanceRiskAmongFocus > 0) {
    alerts.push(boardAlert("class_12", "competitive_focus_board_risk", "amber", "Competitive exam focus affecting boards", `${class12BoardDashboard.competitiveBalance.boardPerformanceRiskAmongFocus} competitive-focus students are at board performance risk.`));
  }

  class12BoardDashboard.practicalProjectTracker
    .filter((item) => item.internalPending > 0 || item.risk === "critical")
    .forEach((item) => {
      alerts.push(boardAlert("class_12", "practical_project_pending", item.risk === "critical" ? "red" : "amber", `${item.subject} practical/internal pending`, `${item.internalPending} internal assessment items are pending.`));
    });

  class12BoardDashboard.combinationRisks
    .filter((item) => item.risk === "critical" || item.risk === "needs_attention")
    .forEach((item) => {
      alerts.push(boardAlert("class_12", "subject_combination_risk", item.risk === "critical" ? "red" : "amber", `${item.combination} combination risk`, `${item.riskSummary}. Affected students: ${item.affectedStudents}.`));
    });

  class12BoardDashboard.streamReadiness
    .filter((stream) => stream.risk === "critical" || stream.risk === "needs_attention")
    .forEach((stream) => {
      alerts.push(boardAlert("class_12", "stream_readiness_below_threshold", stream.risk === "critical" ? "red" : "amber", `${stream.stream} readiness below threshold`, `${stream.stream} has ${stream.syllabus} syllabus completion and ${stream.mockStatus.toLowerCase()}.`));
    });

  if (class12BoardDashboard.topperTracker.meritImprovementAlerts > 0) {
    alerts.push(boardAlert("class_12", "topper_potential_declining", "blue", "Merit group needs protection", `${class12BoardDashboard.topperTracker.meritImprovementAlerts} merit improvement alerts need subject support.`));
  }

  if (class12BoardDashboard.attendanceRisk.belowThreshold > 0) {
    alerts.push(boardAlert("class_12", "attendance_below_threshold", "red", "Attendance below threshold", `${class12BoardDashboard.attendanceRisk.belowThreshold} students are below the expected attendance threshold.`));
  }

  if (class12BoardDashboard.parentCounselling.urgentCases > 0) {
    alerts.push(boardAlert("class_12", "parent_counselling_pending", "red", "Parent counselling pending", `${class12BoardDashboard.parentCounselling.urgentCases} Class 12 counselling cases are urgent.`));
  }

  return alerts;
}

export function generateBoardAlertsForMvp() {
  return [...generateClass10Alerts(), ...generateClass12Alerts()];
}

function boardAlert(
  boardClass: BoardClassValue,
  alertType: string,
  severity: BoardAlertSeverity,
  title: string,
  message: string,
): GeneratedBoardAlert {
  return {
    alert_type: alertType,
    board_class: boardClass,
    message,
    severity,
    status: "new",
    title,
  };
}
