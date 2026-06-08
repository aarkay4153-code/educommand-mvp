import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { BoardRiskBadge } from "@/components/board-command/board-risk-badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getClass10BoardOverview, getClass12BoardOverview } from "@/lib/board-command-summary";

export default function DemoBoardCommandPage() {
  const class10Board = getClass10BoardOverview();
  const class12Board = getClass12BoardOverview();

  return (
    <>
      <PageHeader
        title="Board Command Demo"
        description="Sample Class 10 and Class 12 board exam readiness view for principal presentations."
        action={
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border bg-card px-4 text-sm font-medium text-foreground transition hover:opacity-90"
            href="/demo/school-dashboard"
          >
            Back to School Demo
          </Link>
        }
      />

      <DemoBanner />

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <BoardClassCard
          actionLabel="Open Class 10 Board Command"
          href="/demo/board-command/class-10"
          metrics={[
            ["Readiness score", `${class10Board.readinessScore}%`],
            ["Critical students", String(class10Board.criticalStudents)],
            ["Needs extra coaching", String(class10Board.needsExtraCoaching)],
            ["High scorer / merit potential", String(class10Board.highScorers)],
            ["Syllabus completion average", `${class10Board.syllabusCompletionAverage}%`],
            ["Mock/pre-board status", class10Board.mockStatus],
            ["Urgent alerts", String(class10Board.urgentAlerts)],
          ]}
          risk={class10Board.risk}
          subtitle="Principal-level Class 10 board readiness snapshot."
          title={class10Board.title}
        />

        <BoardClassCard
          actionLabel="Open Class 12 Board Command"
          href="/demo/board-command/class-12"
          metrics={[
            ["Readiness score", `${class12Board.readinessScore}%`],
            ["Stream at highest risk", class12Board.streamAtHighestRisk],
            ["Board risk students", String(class12Board.boardRiskStudents)],
            ["Competitive exam focus group", String(class12Board.competitiveFocusGroup)],
            ["High scorer / topper potential", String(class12Board.highScorers)],
            ["Practical/project pending", String(class12Board.practicalProjectPending)],
            ["Urgent alerts", String(class12Board.urgentAlerts)],
          ]}
          risk={class12Board.risk}
          subtitle="Stream-wise Class 12 board, practical and intervention snapshot."
          title={class12Board.title}
        />
      </div>
    </>
  );
}

function BoardClassCard({
  actionLabel,
  href,
  metrics,
  risk,
  subtitle,
  title,
}: {
  actionLabel: string;
  href: string;
  metrics: [string, string][];
  risk: "critical" | "needs_attention" | "safe" | "high_performer";
  subtitle: string;
  title: string;
}) {
  return (
    <Card>
      <CardHeader title={title} description={subtitle} action={<BoardRiskBadge risk={risk} />} />
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {metrics.map(([label, value]) => (
            <div className="rounded-md border bg-background p-3" key={label}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-2 text-xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          href={href}
        >
          {actionLabel}
        </Link>
      </CardContent>
    </Card>
  );
}

function DemoBanner() {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
      Demo Mode - Sample Board Exam Data
    </div>
  );
}
