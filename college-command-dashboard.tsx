import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Class12BoardDashboard } from "@/components/board-command/class-12-board-dashboard";

export default function DemoClass12BoardCommandPage() {
  return (
    <>
      <PageHeader
        title="Class 12 Board Command Demo"
        description="Sample stream-wise readiness, subject heatmap, topper tracker, competitive balance, practicals, attendance and counselling."
        action={
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border bg-card px-4 text-sm font-medium text-foreground transition hover:opacity-90"
            href="/demo/board-command"
          >
            Back to Board Demo
          </Link>
        }
      />

      <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        Demo Mode - Sample Board Exam Data
      </div>

      <Class12BoardDashboard />
    </>
  );
}
