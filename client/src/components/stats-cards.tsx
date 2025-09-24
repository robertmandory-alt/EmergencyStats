import { Card } from "@/components/ui/card";
import { Users, Building2, Car, Clock } from "lucide-react";
import { formatPersianNumber } from "@/lib/jalali-utils";

interface StatsCardsProps {
  stats: {
    totalPersonnel: number;
    urbanMissions: number;
    roadMissions: number;
    totalHours: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "کل پرسنل",
      value: stats.totalPersonnel,
      icon: Users,
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "ماموریت‌های شهری",
      value: stats.urbanMissions,
      icon: Building2,
      bgColor: "bg-secondary/10",
      iconColor: "text-secondary",
    },
    {
      title: "ماموریت‌های جاده‌ای",
      value: stats.roadMissions,
      icon: Car,
      bgColor: "bg-accent/10",
      iconColor: "text-accent-foreground",
    },
    {
      title: "کل ساعات کار",
      value: stats.totalHours,
      icon: Clock,
      bgColor: "bg-destructive/10",
      iconColor: "text-destructive",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <Card key={index} className="p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {card.title}
              </p>
              <p
                className="text-2xl font-bold"
                data-testid={`stat-${index}`}
              >
                {formatPersianNumber(card.value)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${card.bgColor}`}>
              <card.icon className={`h-6 w-6 ${card.iconColor}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
