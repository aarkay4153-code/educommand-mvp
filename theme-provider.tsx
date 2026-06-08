import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SyllabusLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-56 rounded-md bg-muted" />
        <div className="mt-3 h-4 w-full max-w-2xl rounded-md bg-muted" />
      </div>
      <Card>
        <CardHeader title="Loading syllabus module" description="Fetching assignments and updates." />
        <CardContent>
          <div className="h-56 rounded-md bg-muted" />
        </CardContent>
      </Card>
    </div>
  );
}
