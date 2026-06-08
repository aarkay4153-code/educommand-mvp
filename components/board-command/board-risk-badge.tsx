import { Badge } from "@/components/ui/badge";
import { boardRiskLabels, boardRiskTone, type BoardRisk } from "@/lib/board-command-data";

export function BoardRiskBadge({ risk }: { risk: BoardRisk }) {
  return <Badge tone={boardRiskTone[risk]}>{boardRiskLabels[risk]}</Badge>;
}
