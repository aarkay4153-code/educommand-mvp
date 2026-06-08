import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { BoardRiskBadge } from "@/components/board-command/board-risk-badge";
import { RefreshBoardAlertsButton } from "@/components/board-command/refresh-board-alerts-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import {
  getBoardAlertsForCurrentUser,
  refreshBoardAlertsForCurrentUser,
} from "@/lib/board-command-alerts.server";
import { boardCommandSummaries } from "@/lib/board-command-data";
import {
  calculateClass10ReadinessScore,
  calculateClass12ReadinessScore,
  riskFromScore,
  severityToRisk,
} from "@/lib/board-command-scoring";

export default async function BoardCommandPage() {
  await refreshBoardAlertsForCurrentUser();
  const alerts = await getBoardAlertsForCurrentUser();

  return (
    <>
      <PageHeader
        title="Board Command"
        description="Principal view for Class 10 and Class 12 board exam readiness."
        action={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md border bg-card px-4 text-sm font-medium text-foreground transition hover:opacity-90"
              href="/board-command/teacher-inputs"
            >
              Teacher Inputs
            </Link>
            <RefreshBoardAlertsButton />
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        {boardCommandSummaries.map((summary) => {
          const readinessScore =
            summary.classKey === "class-10"
              ? calculateClass10ReadinessScore()
              : calculateClass12ReadinessScore();
          const readinessRisk = riskFromScore(readinessScore);

          return (
            <Card key={summary.classKey}>
              <CardHeader
                title={summary.title}
                description={summary.riskSummary}
                action={<BoardRiskBadge risk={readinessRisk} />}
              />
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Metric label="Readiness" value={`${readinessScore}%`} detail={summary.trend} />
                  <Metric label="Urgent alerts" value={String(summary.urgentAlerts)} detail="Needs review" />
                  <Metric label="Action pending" value={summary.actionPending} detail="This week" compact />
                </div>

                <div className="space-y-3 rounded-md border bg-background p-4">
                  <Row label="Syllabus / revision" value={summary.syllabusStatus} />
                  <Row label="Mock / pre-board" value={summary.mockStatus} />
                </div>

                <Link
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                  href={summary.href}
                >
                  Open detailed dashboard
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Generated Board Alerts"
          description="Alerts are refreshed from the current Board Command score inputs when the page opens or when the principal clicks refresh."
        />
        <CardContent>
          <DataTable
            emptyMessage="No stored Board Command alerts yet. A principal can refresh alerts after Supabase is configured."
            headers={["Class", "Severity", "Alert", "Message", "Status"]}
            rows={alerts.map((alert) => [
              alert.board_class === "class_12" ? "Class 12" : "Class 10",
              <BoardRiskBadge
                key={`${alert.id}-severity`}
                risk={severityToRisk(alert.severity ?? "amber")}
              />,
              alert.title ?? "Board alert",
              alert.message ?? "Review this board readiness item.",
              normalizeStatus(alert.status),
            ])}
          />
        </CardContent>
      </Card>
    </>
  );
}

function Metric({
  compact,
  detail,
  label,
  value,
}: {
  compact?: boolean;
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-2 font-semibold ${compact ? "text-base" : "text-3xl"}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 text-sm sm:grid-cols-[160px_1fr]">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function normalizeStatus(status: string | null) {
  return status ? status.replaceAll("_", " ") : "new";
}
