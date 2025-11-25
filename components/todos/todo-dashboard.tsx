"use client";

import { useTodoStats } from "@/hooks/use-todo-stats";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BlurFade } from "@/components/ui/blur-fade";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  TrendingUp,
  ListTodo,
  CalendarClock,
  Flame,
} from "lucide-react";

interface TodoDashboardProps {
  userId: string;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  className,
  variant = "default",
}: {
  title: string;
  value: number | string;
  description?: string;
  icon: React.ElementType;
  className?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const variantStyles = {
    default: "bg-card",
    success:
      "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
    warning:
      "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
    danger: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
    info: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
  };

  const iconStyles = {
    default: "text-muted-foreground",
    success: "text-green-600 dark:text-green-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
    info: "text-blue-600 dark:text-blue-400",
  };

  return (
    <Card className={`${variantStyles[variant]} ${className ?? ""}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconStyles[variant]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-8" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function TodoDashboard({ userId }: TodoDashboardProps) {
  const stats = useTodoStats(userId);

  if (stats.isLoading) {
    return <DashboardSkeleton />;
  }

  const hasNoTodos = stats.total === 0;

  if (hasNoTodos) {
    return (
      <div className="text-center py-12">
        <ListTodo className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Ingen oppgaver ennå</h3>
        <p className="text-muted-foreground">
          Opprett din første oppgave for å se statistikk her.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Primary Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <BlurFade delay={0.1} duration={0.5} inView>
          <StatCard
            title="Totalt"
            value={stats.total}
            description="Alle oppgaver"
            icon={ListTodo}
            variant="info"
          />
        </BlurFade>
        <BlurFade delay={0.15} duration={0.5} inView>
          <StatCard
            title="Fullført"
            value={stats.completed}
            description={`${stats.completionRate}% fullføringsgrad`}
            icon={CheckCircle2}
            variant="success"
          />
        </BlurFade>
        <BlurFade delay={0.2} duration={0.5} inView>
          <StatCard
            title="Gjenstående"
            value={stats.pending}
            description="Oppgaver å gjøre"
            icon={Circle}
            variant="default"
          />
        </BlurFade>
        <BlurFade delay={0.25} duration={0.5} inView>
          <StatCard
            title="Forfalte"
            value={stats.overdue}
            description={stats.overdue > 0 ? "Krever oppmerksomhet" : "Ingen forfalte"}
            icon={AlertTriangle}
            variant={stats.overdue > 0 ? "danger" : "default"}
          />
        </BlurFade>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Completion Progress Card */}
        <BlurFade delay={0.3} duration={0.5} inView>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Fremgang
              </CardTitle>
              <CardDescription>Din fullføringsgrad</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Fullføringsgrad</span>
                  <span className="font-medium">{stats.completionRate}%</span>
                </div>
                <Progress value={stats.completionRate} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.completed}
                  </p>
                  <p className="text-xs text-muted-foreground">Fullført</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Gjenstående</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </BlurFade>

        {/* Priority Breakdown Card */}
        <BlurFade delay={0.35} duration={0.5} inView>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5" />
                Prioritet
              </CardTitle>
              <CardDescription>Fordeling etter prioritet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm">Høy</span>
                </div>
                <span className="font-medium">{stats.highPriority}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-sm">Middels</span>
                </div>
                <span className="font-medium">{stats.mediumPriority}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">Lav</span>
                </div>
                <span className="font-medium">{stats.lowPriority}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span className="text-sm">Ingen prioritet</span>
                </div>
                <span className="font-medium">{stats.noPriority}</span>
              </div>
            </CardContent>
          </Card>
        </BlurFade>
      </div>

      {/* Time-based Stats Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <BlurFade delay={0.4} duration={0.5} inView>
          <StatCard
            title="Forfaller i dag"
            value={stats.dueToday}
            description={
              stats.dueToday > 0
                ? "Oppgaver som må gjøres i dag"
                : "Ingen oppgaver forfaller i dag"
            }
            icon={CalendarClock}
            variant={stats.dueToday > 0 ? "warning" : "default"}
          />
        </BlurFade>
        <BlurFade delay={0.45} duration={0.5} inView>
          <StatCard
            title="Høy prioritet"
            value={stats.highPriority}
            description={
              stats.highPriority > 0
                ? "Viktige oppgaver å fokusere på"
                : "Ingen høyprioritetsoppgaver"
            }
            icon={Clock}
            variant={stats.highPriority > 0 ? "danger" : "default"}
          />
        </BlurFade>
      </div>
    </div>
  );
}
