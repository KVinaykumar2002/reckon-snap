import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  icon: LucideIcon;
  variant?: "income" | "expense" | "default";
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  variant = "default",
  className 
}: StatCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "income":
        return "border-income/20 bg-income/5";
      case "expense":
        return "border-expense/20 bg-expense/5";
      default:
        return "border-primary/20 bg-primary/5";
    }
  };

  const getIconStyles = () => {
    switch (variant) {
      case "income":
        return "text-income bg-income/10";
      case "expense":
        return "text-expense bg-expense/10";
      default:
        return "text-primary bg-primary/10";
    }
  };

  return (
    <Card className={cn("transition-all hover:shadow-lg", getVariantStyles(), className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", getIconStyles())}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={cn(
            "text-xs mt-1",
            change.startsWith("+") ? "text-income" : "text-expense"
          )}>
            {change} from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}