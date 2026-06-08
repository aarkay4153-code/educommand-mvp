import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function TasksLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-44 rounded-md bg-muted" />
        <div className="mt-3 h-4 w-full max-w-2xl rounded-md bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent>
              <div className="h-4 w-28 rounded-md bg-muted" />
              <div className="mt-4 h-8 w-12 rounded-md bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader title="Loading tasks" description="Fetching delegated work." />
        <CardContent>
          <div className="h-56 rounded-md bg-muted" />
        </CardContent>
      </Card>
    </div>
  );
}
