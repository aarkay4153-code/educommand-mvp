import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-36 rounded-md bg-muted" />
        <div className="mt-3 h-4 w-full max-w-2xl rounded-md bg-muted" />
      </div>
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardHeader title="Loading settings" description="Fetching configuration." />
          <CardContent>
            <div className="h-48 rounded-md bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
