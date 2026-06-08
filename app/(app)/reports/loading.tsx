import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-40 rounded-md bg-muted" />
        <div className="mt-3 h-4 w-full max-w-2xl rounded-md bg-muted" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardHeader title="Loading report" description="Preparing live summary." />
            <CardContent>
              <div className="h-40 rounded-md bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
