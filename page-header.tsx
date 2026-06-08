import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function WeeklyWorkflowLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-56 rounded-md bg-muted" />
        <div className="mt-3 h-4 w-full max-w-2xl rounded-md bg-muted" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader title="Loading workflow" description="Preparing weekly rhythm." />
            <CardContent>
              <div className="h-48 rounded-md bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
