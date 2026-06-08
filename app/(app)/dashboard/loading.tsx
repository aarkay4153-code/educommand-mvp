import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-40 rounded-md bg-muted" />
        <div className="mt-3 h-4 w-full max-w-2xl rounded-md bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 7 }).map((_, index) => (
          <Card key={index}>
            <CardContent>
              <div className="h-4 w-32 rounded-md bg-muted" />
              <div className="mt-4 h-8 w-16 rounded-md bg-muted" />
              <div className="mt-3 h-4 w-40 rounded-md bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader title="Loading dashboard" description="Fetching the latest school data." />
        <CardContent>
          <div className="h-24 rounded-md bg-muted" />
        </CardContent>
      </Card>
    </div>
  );
}
