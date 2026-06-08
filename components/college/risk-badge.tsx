import { Badge } from "@/components/ui/badge";
import type { Risk } from "@/lib/college-mode-data";
import type { StatusTone } from "@/lib/types";

const riskTone: Record<Risk, StatusTone> = {
  red: "danger",
  amber: "warning",
  green: "success",
  blue: "info",
  grey: "neutral",
};

const riskLabel: Record<Risk, string> = {
  red: "Critical",
  amber: "Needs Attention",
  green: "Safe",
  blue: "Strong",
  grey: "Not Started",
};

export function RiskBadge({ risk, label }: { risk: Risk; label?: string }) {
  return <Badge tone={riskTone[risk]}>{label ?? riskLabel[risk]}</Badge>;
}
