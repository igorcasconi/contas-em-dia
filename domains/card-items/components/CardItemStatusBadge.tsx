import { Badge } from "@/shared/components/ui/badge";
import { formatRemainingMonths } from "@/shared/utils/month";

import type { ActiveCardItem } from "../services/card-items";

const statusLabel = ({ status, remaining_months }: Pick<ActiveCardItem, "status" | "remaining_months">) => {
  if (status === "paused") return "Pausado";
  if (remaining_months === null) return "Recorrente";
  return formatRemainingMonths(remaining_months);
};

export const CardItemStatusBadge = ({ item }: { item: Pick<ActiveCardItem, "status" | "remaining_months"> }) => (
  <Badge variant={item.status === "paused" ? "outline" : "secondary"}>{statusLabel(item)}</Badge>
);
