import {
  class10BoardDashboard,
  class12BoardDashboard,
} from "@/lib/board-command-data";
import {
  calculateClass10ReadinessScore,
  calculateClass12ReadinessScore,
  generateClass10Alerts,
  generateClass12Alerts,
  riskFromScore,
} from "@/lib/board-command-scoring";

export function getClass10BoardOverview() {
  const readinessScore = calculateClass10ReadinessScore();
  const criticalStudents =
    class10BoardDashboard.studentRiskCategories.find((item) => item.label === "Critical Support Needed")?.value ?? 0;
  const needsExtraCoaching =
    class10BoardDashboard.studentRiskCategories.find((item) => item.label === "Needs Extra Coaching")?.value ?? 0;
  const highScorers =
    class10BoardDashboard.studentRiskCategories.find((item) => item.label === "High Scorer / Merit Potential")
      ?.value ?? 0;
  const criticalAlerts = generateClass10Alerts().filter((alert) => alert.severity === "red").length;

  return {
    title: "Class 10 Board Command",
    href: "/board-command/class-10",
    readinessScore,
    risk: riskFromScore(readinessScore),
    criticalStudents,
    needsExtraCoaching,
    highScorers,
    syllabusCompletionAverage: class10BoardDashboard.metrics.syllabusCompletion,
    mockStatus: class10BoardDashboard.mockStatus[0]?.averageScore ?? "Not available",
    urgentAlerts: criticalAlerts,
    keyRisks: [
      `${criticalStudents} critical support students`,
      `${class10BoardDashboard.parentIntervention.pendingParentMeetings} parent meetings pending`,
      class10BoardDashboard.subjectWeaknessMap[0]?.subject
        ? `${class10BoardDashboard.subjectWeaknessMap[0].subject} weakness needs review`
        : "Subject weakness review pending",
    ],
    parentInterventionCount: class10BoardDashboard.parentIntervention.studentsNeedingParentMeeting,
  };
}

export function getClass12BoardOverview() {
  const readinessScore = calculateClass12ReadinessScore();
  const highestRiskStream =
    class12BoardDashboard.streamReadiness.find((stream) => stream.risk === "critical") ??
    class12BoardDashboard.streamReadiness.find((stream) => stream.risk === "needs_attention") ??
    class12BoardDashboard.streamReadiness[0];
  const boardRiskStudents =
    class12BoardDashboard.studentRiskCategories.find((item) => item.label === "Board Risk")?.value ?? 0;
  const competitiveFocusGroup =
    class12BoardDashboard.studentRiskCategories.find((item) => item.label === "Competitive Exam Focus Group")
      ?.value ?? 0;
  const highScorers =
    class12BoardDashboard.studentRiskCategories.find((item) => item.label === "High Scorer / Topper Potential")
      ?.value ?? 0;
  const practicalPending = class12BoardDashboard.practicalProjectTracker.reduce(
    (sum, item) => sum + item.internalPending,
    0,
  );
  const criticalAlerts = generateClass12Alerts().filter((alert) => alert.severity === "red").length;

  return {
    title: "Class 12 Board Command",
    href: "/board-command/class-12",
    readinessScore,
    risk: riskFromScore(readinessScore),
    streamAtHighestRisk: highestRiskStream?.stream ?? "Not available",
    boardRiskStudents,
    competitiveFocusGroup,
    highScorers,
    practicalProjectPending: practicalPending,
    urgentAlerts: criticalAlerts,
    mockStatus: class12BoardDashboard.mockStatus[0]?.averageScore ?? "Not available",
    keyRisks: [
      `${boardRiskStudents} board risk students`,
      `${practicalPending} practical/internal items pending`,
      `${class12BoardDashboard.parentCounselling.urgentCases} urgent counselling cases`,
    ],
    parentInterventionCount: class12BoardDashboard.parentCounselling.studentsNeedingCounselling,
  };
}

export function getBoardCommandReportSummary() {
  const class10 = getClass10BoardOverview();
  const class12 = getClass12BoardOverview();

  return {
    class10,
    class12,
    riskCategoryCounts: {
      class10: class10BoardDashboard.studentRiskCategories.map((item) => ({
        label: item.label,
        value: item.value,
      })),
      class12: class12BoardDashboard.studentRiskCategories.map((item) => ({
        label: item.label,
        value: item.value,
      })),
    },
    subjectWeaknessSummary: [
      ...class10BoardDashboard.subjectWeaknessMap.slice(0, 3).map((item) => ({
        className: "Class 10",
        subject: item.subject,
        detail: item.weakTopics,
        affected: item.weakStudents,
      })),
      ...class12BoardDashboard.performanceHeatmap.slice(0, 3).map((item) => ({
        className: "Class 12",
        subject: item.subject,
        detail: `${item.weakTopicCount} weak topics`,
        affected: item.highRiskCount,
      })),
    ],
    interventionPending:
      class10.parentInterventionCount +
      class12.parentInterventionCount +
      class12.practicalProjectPending,
  };
}
