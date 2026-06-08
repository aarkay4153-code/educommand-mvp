import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Class10BoardDashboard } from "@/components/board-command/class-10-board-dashboard";
import { Class12BoardDashboard } from "@/components/board-command/class-12-board-dashboard";
import { BoardRiskBadge } from "@/components/board-command/board-risk-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/table";
import { boardCommandDetails, type BoardClassKey } from "@/lib/board-command-data";

export default async function BoardCommandDetailPage({
  params,
}: {
  params: Promise<{ classKey: string }>;
}) {
  const { classKey } = await params;

  if (classKey !== "class-10" && classKey !== "class-12") {
    notFound();
  }

  const detail = boardCommandDetails[classKey as BoardClassKey];

  if (classKey === "class-10") {
    return (
      <>
        <PageHeader
          title={detail.title}
          description="Summarized Class 10 board readiness first. Student names and remarks stay inside detail panels."
          action={
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md border bg-card px-4 text-sm font-medium text-foreground transition hover:opacity-90"
              href="/board-command"
            >
              Back to Board Command
            </Link>
          }
        />
        <Class10BoardDashboard />
      </>
    );
  }

  if (classKey === "class-12") {
    return (
      <>
        <PageHeader
          title={detail.title}
          description="Stream-wise Class 12 readiness, admission sensitivity, toppers, practicals and competitive exam balance."
          action={
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md border bg-card px-4 text-sm font-medium text-foreground transition hover:opacity-90"
              href="/board-command"
            >
              Back to Board Command
            </Link>
          }
        />
        <Class12BoardDashboard />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={detail.title}
        description={detail.subtitle}
        action={
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border bg-card px-4 text-sm font-medium text-foreground transition hover:opacity-90"
            href="/board-command"
          >
            Back to Board Command
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">Overall readiness</p>
            <p className="mt-3 text-3xl font-semibold">{detail.readinessScore}%</p>
            <div className="mt-3">
              <BoardRiskBadge risk={detail.risk} />
            </div>
          </CardContent>
        </Card>
        {detail.trends.map((trend) => (
          <Card key={trend.label}>
            <CardContent>
              <p className="text-sm text-muted-foreground">{trend.label}</p>
              <p className="mt-3 text-3xl font-semibold">{trend.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{trend.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader
            title="Subject Readiness"
            description="Summary-level view only. Student names and detailed remarks stay inside panels."
          />
          <CardContent>
            <DataTable
              headers={["Subject", "Syllabus", "Revision", "Mock average", "Risk", "Action pending"]}
              rows={detail.subjects.map((subject) => [
                subject.subject,
                subject.syllabus,
                subject.revision,
                subject.mock,
                <BoardRiskBadge key={subject.subject} risk={subject.risk} />,
                subject.action,
              ])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Urgent Alerts" description="Principal attention items for this week." />
          <CardContent className="space-y-3">
            {detail.alerts.map((alert) => (
              <div className="rounded-md border bg-background p-3" key={alert.alert}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium">{alert.alert}</p>
                  <BoardRiskBadge risk={alert.level} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{alert.action}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Click-In Panels"
          description="Detailed student names and teacher remarks are intentionally not shown on the main board."
        />
        <CardContent className="grid gap-4 md:grid-cols-2">
          {detail.panels.map((panel) => (
            <div className="rounded-md border bg-background p-4" key={panel.title}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{panel.title}</p>
                <Badge tone="info">Click-in only</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{panel.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
