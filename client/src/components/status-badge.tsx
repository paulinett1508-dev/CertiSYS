import { Badge } from "@/components/ui/badge";
import type { Certificate } from "@shared/schema";

interface StatusBadgeProps {
  status: Certificate["status"];
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    valid: {
      label: "Válida",
      variant: "default" as const,
      className: "bg-green-500 hover:bg-green-600 text-white border-green-600",
    },
    expiring_soon: {
      label: "Vence em breve",
      variant: "default" as const,
      className: "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600",
    },
    expired: {
      label: "Vencida",
      variant: "destructive" as const,
      className: "",
    },
  };

  const { label, variant, className } = config[status];

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
