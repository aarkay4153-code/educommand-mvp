"use client";

import { useState } from "react";
import { BoardRiskBadge } from "@/components/board-command/board-risk-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import {
  class10BoardDashboard,
  type BoardRisk,
} from "@/lib/board-command-data";
import { calculateClass10ReadinessScore, riskFromScore } from "@/lib/board-command-scoring";

type DetailPanel = "studentRisks" | "subjectWeakness" | "intervention" | "dailyAlerts" | null;

export function Class10BoardDashboard() {
  const [openPanel, setOpenPanel] = useState<DetailPanel>(null);
  const readinessScore = calculateClass10ReadinessScore();
  const readinessRisk = riskFromScore(readinessScore);
  const detailRows = openPanel ? class10BoardDashboard.detailPanels[openPanel] : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Overall Board Readiness Score"
          description="Weighted MVP score from syllabus, revision, mock performance, student risk reduction, remedial attendance and alerts."
          action={<BoardRiskBadge risk={readinessRisk} />}
        />
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
            <div className="rounded-md border bg-background p-5">
              <p className="text-sm text-muted-foreground">Readiness score</p>
              <p className="mt-3 text-5xl font-semibold">{readinessScore}%</p>
              <p className="mt-2 text-sm text-muted-foreground">Action pending in Maths, Science and remedial attendance.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-5">
              <ScorePart label="Syllabus" value={`${class10BoardDashboard.metrics.syllabusCompletion}%`} />
              <ScorePart label="Revision" value={`${class10BoardDashboard.metrics.revisionCompletion}%`} />
              <ScorePart label="Mock" value={`${class10BoardDashboard.metrics.mockPerformance}%`} />
              <ScorePart label="Attendance" value={`${class10BoardDashboard.metrics.attendanceScore}%`} />
              <ScorePart label="Weak student control" value={`${class10BoardDashboard.metrics.weakStudentScore}%`} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Student Risk Categories"
            description="Names hidden from the main view."
            action={<DetailsButton panel="studentRisks" setOpenPanel={setOpenPanel} />}
          />
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {class10BoardDashboard.studentRiskCategories.map((item) => (
              <SummaryTile detail={item.detail} key={item.label} label={item.label} risk={item.risk} value={String(item.value)} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Student Improvement Trend" description="Movement from latest weekly teacher inputs." />
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {class10BoardDashboard.improvementTrend.map((item) => (
              <SummaryTile key={item.label} label={item.label} risk={item.risk} value={String(item.value)} />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader
            title="Subject-wise Weakness Map"
            description="Weak chapters and subject risk summary."
            action={<DetailsButton panel="subjectWeakness" setOpenPanel={setOpenPanel} />}
          />
          <CardContent>
            <DataTable
              headers={["Subject", "Weak chapters/topics", "Weak students", "Severity"]}
              rows={class10BoardDashboard.subjectWeaknessMap.map((row) => [
                row.subject,
                row.weakTopics,
                String(row.weakStudents),
                <BoardRiskBadge key={row.subject} risk={row.severity} />,
              ])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Extra Coaching Attendance" description="Remedial participation summary." />
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <SummaryTile label="Remedial classes conducted" value={String(class10BoardDashboard.extraCoaching.remedialClassesConducted)} risk="safe" />
            <SummaryTile label="Students assigned" value={String(class10BoardDashboard.extraCoaching.studentsAssigned)} risk="needs_attention" />
            <SummaryTile label="Students attending" value={String(class10BoardDashboard.extraCoaching.studentsAttending)} risk="safe" />
            <SummaryTile label="Remedial absentees" value={String(class10BoardDashboard.extraCoaching.remedialAbsentees)} risk="critical" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader title="Syllabus Completion and Revision Status" description="Subject-wise teacher update summary." />
        <CardContent>
          <DataTable
            headers={["Subject", "Syllabus completion", "Revision status", "Teacher input latest date", "Risk"]}
            rows={class10BoardDashboard.syllabusRevision.map((row) => [
              row.subject,
              `${row.syllabus}%`,
              row.revisionStatus.replaceAll("_", " "),
              row.teacherLatestDate,
              <BoardRiskBadge key={row.subject} risk={row.risk} />,
            ])}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader title="Mock Test Status" description="Pre-board and mock performance without student clutter." />
          <CardContent>
            <DataTable
              headers={["Mock/pre-board", "Conducted", "Average score", "Weak subjects", "High scorers", "Pending marks", "Risk"]}
              rows={class10BoardDashboard.mockStatus.map((row) => [
                row.exam,
                row.conducted,
                row.averageScore,
                row.weakSubjects,
                String(row.highScorers),
                String(row.pendingMarksEntry),
                <BoardRiskBadge key={row.exam} risk={row.risk} />,
              ])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Parent Intervention Required"
            description="Parent follow-up status for critical board cases."
            action={<DetailsButton panel="intervention" setOpenPanel={setOpenPanel} />}
          />
          <CardContent className="grid gap-3">
            <SummaryTile label="Students needing parent meeting" value={String(class10BoardDashboard.parentIntervention.studentsNeedingParentMeeting)} risk="needs_attention" />
            <SummaryTile label="Critical cases" value={String(class10BoardDashboard.parentIntervention.criticalCases)} risk="critical" />
            <SummaryTile label="Pending parent meetings" value={String(class10BoardDashboard.parentIntervention.pendingParentMeetings)} risk="critical" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Daily Alerts"
          description="Absentees, weak students, teacher concerns, remedial absentees and syllabus delay."
          action={<DetailsButton panel="dailyAlerts" setOpenPanel={setOpenPanel} />}
        />
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {class10BoardDashboard.dailyAlerts.map((alert) => (
              <div className="rounded-md border bg-background p-3" key={alert.type}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium">{alert.type}</p>
                  <BoardRiskBadge risk={alert.risk} />
                </div>
                <p className="mt-3 text-3xl font-semibold">{alert.count}</p>
                <p className="mt-2 text-sm text-muted-foreground">{alert.message}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {openPanel ? (
        <Card>
          <CardHeader
            title="Details Panel"
            description="Student names and remarks are shown only after opening this panel."
            action={
              <Button onClick={() => setOpenPanel(null)} type="button" variant="secondary">
                Hide Details
              </Button>
            }
          />
          <CardContent>
            <DataTable
              headers={["Name / Area", "Category / Subject", "Remark"]}
              rows={detailRows.map((row) => {
                const name = "name" in row ? row.name : row.subject;
                const category = "category" in row ? row.category : "Detail";
                return [String(name), String(category), row.remark];
              })}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function ScorePart({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function SummaryTile({
  detail,
  label,
  risk,
  value,
}: {
  detail?: string;
  label: string;
  risk: BoardRisk;
  value: string;
}) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        <BoardRiskBadge risk={risk} />
      </div>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      {detail ? <p className="mt-2 text-sm text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

function DetailsButton({
  panel,
  setOpenPanel,
}: {
  panel: Exclude<DetailPanel, null>;
  setOpenPanel: (panel: DetailPanel) => void;
}) {
  return (
    <Button onClick={() => setOpenPanel(panel)} type="button" variant="secondary">
      View Details
    </Button>
  );
}
