import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function CalendarLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-48 rounded-md bg-muted" />
        <div className="mt-3 h-4 w-full max-w-2xl rounded-md bg-muted" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader title="Loading calendar" description="Fetching events and milestones." />
          <CardContent>
            <div className="h-96 rounded-md bg-muted" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Loading actions" description="Preparing event work." />
          <CardContent>
            <div className="h-96 rounded-md bg-muted" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
