import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { BoardRiskBadge } from "@/components/board-command/board-risk-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import { getClass10BoardOverview, getClass12BoardOverview } from "@/lib/board-command-summary";
import { schoolModeStats, schoolOperations } from "@/lib/demo-data";

export default function SchoolModeDemoPage() {
  const class10Board = getClass10BoardOverview();
  const class12Board = getClass12BoardOverview();
  const criticalAlerts = class10Board.urgentAlerts + class12Board.urgentAlerts;
  const parentIntervention = class10Board.parentInterventionCount + class12Board.parentInterventionCount;

  return (
    <>
      <PageHeader
        title="School Mode Dashboard"
        description="A sample command board for principals, headmasters and school management."
        action={
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border bg-card px-4 text-sm font-medium text-foreground transition hover:opacity-90"
            href="/demo/college-dashboard"
          >
            View College Demo
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {schoolModeStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-3 text-3xl font-semibold">{stat.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{stat.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader
            title="Board Command Preview"
            description="Sample board readiness summary for Class 10 and Class 12."
            action={
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md border bg-card px-4 text-sm font-medium text-foreground transition hover:opacity-90"
                href="/demo/board-command"
              >
                Open Demo
              </Link>
            }
          />
          <CardContent className="space-y-4">
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              Demo Mode - Sample Board Exam Data
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <BoardPreviewCard
                href="/demo/board-command/class-10"
                metrics={[
                  ["Readiness", `${class10Board.readinessScore}%`],
                  ["Mock/pre-board", class10Board.mockStatus],
                  ["Critical alerts", String(class10Board.urgentAlerts)],
                ]}
                risk={class10Board.risk}
                title="Class 10"
              />
              <BoardPreviewCard
                href="/demo/board-command/class-12"
                metrics={[
                  ["Readiness", `${class12Board.readinessScore}%`],
                  ["Mock/pre-board", class12Board.mockStatus],
                  ["Critical alerts", String(class12Board.urgentAlerts)],
                ]}
                risk={class12Board.risk}
                title="Class 12"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Preview label="Critical board alerts" value={String(criticalAlerts)} />
              <Preview label="Parent intervention required" value={String(parentIntervention)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="PTM / Exam Readiness" description="Sample readiness signals for the current week." />
          <CardContent className="space-y-3">
            <Readiness label="PTM circular" status="Draft ready" tone="success" />
            <Readiness label="Progress sheets" status="6 classes pending" tone="warning" />
            <Readiness label="Exam seating plan" status="Needs review" tone="warning" />
            <Readiness label="Parent complaints" status="1 urgent escalation" tone="danger" />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="School Operations" description="Events, complaints, maintenance and brief readiness." />
          <CardContent>
            <DataTable
              headers={["Area", "Status", "Owner"]}
              rows={schoolOperations.map((row) => [row.area, row.status, row.owner])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Institution Brief Preview" description="One-click school brief for visitors and management." />
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Preview label="Students" value="1,240" />
            <Preview label="Teachers" value="68" />
            <Preview label="Classes" value="32" />
            <Preview label="Compliance vault" value="78% ready" />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function BoardPreviewCard({
  href,
  metrics,
  risk,
  title,
}: {
  href: string;
  metrics: [string, string][];
  risk: "critical" | "needs_attention" | "safe" | "high_performer";
  title: string;
}) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium">{title}</p>
        <BoardRiskBadge risk={risk} />
      </div>
      <div className="mt-3 space-y-2">
        {metrics.map(([label, value]) => (
          <div className="flex items-center justify-between gap-3 text-sm" key={label}>
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>
      <Link className="mt-3 inline-flex text-sm font-medium text-primary" href={href}>
        View details
      </Link>
    </div>
  );
}

function Readiness({
  label,
  status,
  tone,
}: {
  label: string;
  status: string;
  tone: "success" | "warning" | "danger";
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-background p-3">
      <span className="text-sm font-medium">{label}</span>
      <Badge tone={tone}>{status}</Badge>
    </div>
  );
}

function Preview({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
