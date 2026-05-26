import { Badge } from "@/components/ui/badge"

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const isOk = status.toUpperCase() === 'ACTIVE' || status.toUpperCase() === 'COMPLETED'
  
  return (
    <Badge 
      variant="outline" 
      className={`px-2.5 py-0.5 font-semibold text-[10px] tracking-wider rounded-full border ${
        isOk 
          ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
          : "bg-amber-50 text-amber-600 border-amber-200"
      }`}
    >
      {status.toUpperCase()}
    </Badge>
  )
}
