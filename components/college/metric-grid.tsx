import { Card, CardContent } from "@/components/ui/card";

type Metric = {
  detail?: string;
  label: string;
  value: string;
};

export function MetricGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardContent>
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <p className="mt-3 text-2xl font-semibold">{metric.value}</p>
            {metric.detail ? <p className="mt-2 text-sm text-muted-foreground">{metric.detail}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
