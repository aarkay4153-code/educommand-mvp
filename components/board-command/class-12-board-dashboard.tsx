"use client";

import { useState } from "react";
import { BoardRiskBadge } from "@/components/board-command/board-risk-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import {
  class12BoardDashboard,
  type BoardRisk,
} from "@/lib/board-command-data";
import { calculateClass12ReadinessScore, riskFromScore } from "@/lib/board-command-scoring";

type DetailPanel = "riskStudents" | "topperSupport" | "practicals" | "counselling" | null;

export function Class12BoardDashboard() {
  const [openPanel, setOpenPanel] = useState<DetailPanel>(null);
  const readinessScore = calculateClass12ReadinessScore();
  const readinessRisk = riskFromScore(readinessScore);
  const detailRows = openPanel ? class12BoardDashboard.detailPanels[openPanel] : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Overall Board Readiness Score"
          description="Weighted MVP score from syllabus/revision, mock performance, practicals, attendance, stream risk and intervention alerts."
          action={<BoardRiskBadge risk={readinessRisk} />}
        />
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
            <div className="rounded-md border bg-background p-5">
              <p className="text-sm text-muted-foreground">Readiness score</p>
              <p className="mt-3 text-5xl font-semibold">{readinessScore}%</p>
              <p className="mt-2 text-sm text-muted-foreground">Action pending in Science, Commerce, practical files and counselling.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-5">
              <ScorePart label="Syllabus" value={`${class12BoardDashboard.metrics.syllabusCompletion}%`} />
              <ScorePart label="Revision" value={`${class12BoardDashboard.metrics.revisionCompletion}%`} />
              <ScorePart label="Mock" value={`${class12BoardDashboard.metrics.mockPerformance}%`} />
              <ScorePart label="Practicals/projects" value={`${class12BoardDashboard.metrics.practicalProjectScore}%`} />
              <ScorePart label="Exam balance" value={`${class12BoardDashboard.metrics.competitiveBalanceScore}%`} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Stream-wise Readiness" description="Science, Commerce and Humanities readiness summary." />
        <CardContent>
          <DataTable
            headers={["Stream", "Syllabus completion", "Revision status", "Mock/pre-board status", "Risk"]}
            rows={class12BoardDashboard.streamReadiness.map((row) => [
              row.stream,
              row.syllabus,
              row.revisionStatus.replaceAll("_", " "),
              row.mockStatus,
              <BoardRiskBadge key={row.stream} risk={row.risk} />,
            ])}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Student Risk Categories"
            description="Summary first. Names appear only after opening details."
            action={<DetailsButton panel="riskStudents" setOpenPanel={setOpenPanel} />}
          />
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {class12BoardDashboard.studentRiskCategories.map((item) => (
              <SummaryTile detail={item.detail} key={item.label} label={item.label} risk={item.risk} value={String(item.value)} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Topper and High-Scorer Tracker" description="Merit potential without cluttering the main view." action={<DetailsButton panel="topperSupport" setOpenPanel={setOpenPanel} />} />
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <SummaryTile label="High scorer count" value={String(class12BoardDashboard.topperTracker.highScorerCount)} risk="high_performer" />
            <SummaryTile label="Topper potential count" value={String(class12BoardDashboard.topperTracker.topperPotentialCount)} risk="high_performer" />
            <SummaryTile label="Merit improvement alerts" value={String(class12BoardDashboard.topperTracker.meritImprovementAlerts)} risk="needs_attention" />
            <div className="rounded-md border bg-background p-3">
              <p className="text-sm font-medium">Subjects needing support</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{class12BoardDashboard.topperTracker.supportSubjects}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader title="Subject-wise Performance Heatmap" description="Subject performance, weak topic count and performer distribution." />
          <CardContent>
            <DataTable
              headers={["Subject", "Average", "Weak topics", "High risk", "High performers", "Risk"]}
              rows={class12BoardDashboard.performanceHeatmap.map((row) => [
                row.subject,
                row.average,
                String(row.weakTopicCount),
                String(row.highRiskCount),
                String(row.highPerformerCount),
                <BoardRiskBadge key={row.subject} risk={row.risk} />,
              ])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Board vs Competitive Exam Balance" description="Balance between board readiness and entrance preparation." />
          <CardContent className="grid gap-3">
            <SummaryTile label="Competitive exam focus" value={String(class12BoardDashboard.competitiveBalance.competitiveExamFocusStudents)} risk="high_performer" />
            <SummaryTile label="Board risk among focus group" value={String(class12BoardDashboard.competitiveBalance.boardPerformanceRiskAmongFocus)} risk="critical" />
            <SummaryTile label="Balance intervention needed" value={String(class12BoardDashboard.competitiveBalance.balanceInterventionNeeded)} risk="needs_attention" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader title="Subject Combination Risk" description="Risks from difficult combinations or weak performance across subject groups." />
        <CardContent>
          <DataTable
            headers={["Combination", "Risk summary", "Affected students", "Risk"]}
            rows={class12BoardDashboard.combinationRisks.map((row) => [
              row.combination,
              row.riskSummary,
              String(row.affectedStudents),
              <BoardRiskBadge key={row.combination} risk={row.risk} />,
            ])}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader title="Practical / Project / Internal Assessment Tracker" description="Completion and pending internal assessment risk." action={<DetailsButton panel="practicals" setOpenPanel={setOpenPanel} />} />
          <CardContent>
            <DataTable
              headers={["Subject", "Practical completion", "Project submission", "Internal pending", "Risk"]}
              rows={class12BoardDashboard.practicalProjectTracker.map((row) => [
                row.subject,
                row.practicalCompletion,
                row.projectSubmission,
                String(row.internalPending),
                <BoardRiskBadge key={row.subject} risk={row.risk} />,
              ])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Attendance Risk" description="Attendance issues affecting board preparation." />
          <CardContent className="grid gap-3">
            <SummaryTile label="Below attendance threshold" value={String(class12BoardDashboard.attendanceRisk.belowThreshold)} risk="critical" />
            <SummaryTile label="Daily absentee alerts" value={String(class12BoardDashboard.attendanceRisk.dailyAbsenteeAlerts)} risk="needs_attention" />
            <div className="rounded-md border bg-background p-3">
              <p className="text-sm font-medium">Subject-wise attendance risk</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{class12BoardDashboard.attendanceRisk.subjectWiseRisk}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Syllabus Completion and Revision Status" description="Subject-wise completion and revision." />
          <CardContent>
            <DataTable
              headers={["Subject", "Completion", "Revision status", "Risk"]}
              rows={class12BoardDashboard.syllabusRevision.map((row) => [
                row.subject,
                row.completion,
                row.revisionStatus.replaceAll("_", " "),
                <BoardRiskBadge key={row.subject} risk={row.risk} />,
              ])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Mock / Pre-board Test Status" description="Conducted tests, score movement and pending marks." />
          <CardContent>
            <DataTable
              headers={["Test", "Conducted", "Average score", "Declining subjects", "Pending marks", "Risk"]}
              rows={class12BoardDashboard.mockStatus.map((row) => [
                row.test,
                row.conducted,
                row.averageScore,
                row.decliningSubjects,
                String(row.pendingMarks),
                <BoardRiskBadge key={row.test} risk={row.risk} />,
              ])}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader title="Parent Counselling Required" description="Counselling summary by urgency and stream." action={<DetailsButton panel="counselling" setOpenPanel={setOpenPanel} />} />
        <CardContent className="grid gap-3 md:grid-cols-3">
          <SummaryTile label="Students needing counselling" value={String(class12BoardDashboard.parentCounselling.studentsNeedingCounselling)} risk="needs_attention" />
          <SummaryTile label="Urgent cases" value={String(class12BoardDashboard.parentCounselling.urgentCases)} risk="critical" />
          <div className="rounded-md border bg-background p-3">
            <p className="text-sm font-medium">Stream-wise count</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{class12BoardDashboard.parentCounselling.streamWiseCount}</p>
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
              headers={["Name / Area", "Category", "Remark"]}
              rows={detailRows.map((row) => [row.name, row.category, row.remark])}
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
