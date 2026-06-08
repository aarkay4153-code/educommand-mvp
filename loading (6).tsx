import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function BoardCommandLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-56 rounded-md bg-muted" />
        <div className="mt-3 h-4 w-full max-w-3xl rounded-md bg-muted" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {[0, 1].map((item) => (
          <Card key={item}>
            <CardHeader title="Loading Board Command" />
            <CardContent>
              <div className="h-40 rounded-md bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
