"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllUsersTodoStats } from "@/hooks/admin/use-todo-stats";
import {
  CheckCircle2,
  Circle,
  Clock,
  ListTodo,
  TrendingUp,
  Users,
} from "lucide-react";
import { companyConfig } from "@/lib/brand";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

export default function OverviewTab() {
  const { data, isLoading } = useAllUsersTodoStats();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Oversikt</h2>
        <p className="text-muted-foreground">
          Todo-statistikk på tvers av {companyConfig.name}
        </p>
      </div>

      {/* Platform-wide KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Totale todos"
              value={data?.platformStats.total_todos || 0}
              icon={ListTodo}
              description="På tvers av alle brukere"
            />
            <StatCard
              title="Fullførte"
              value={data?.platformStats.completed_todos || 0}
              icon={CheckCircle2}
              description={`${data?.platformStats.completion_rate || 0}% fullføringsrate`}
            />
            <StatCard
              title="Ventende"
              value={data?.platformStats.pending_todos || 0}
              icon={Circle}
              description="Ikke fullført ennå"
            />
            <StatCard
              title="Forfalt"
              value={data?.platformStats.overdue_todos || 0}
              icon={Clock}
              description="Passert forfallsdato"
            />
          </>
        )}
      </div>

      <Separator />

      {/* Priority Breakdown */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Prioritering</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                title="Høy prioritet"
                value={data?.platformStats.high_priority_todos || 0}
                icon={TrendingUp}
              />
              <StatCard
                title="Medium prioritet"
                value={data?.platformStats.medium_priority_todos || 0}
                icon={TrendingUp}
              />
              <StatCard
                title="Lav prioritet"
                value={data?.platformStats.low_priority_todos || 0}
                icon={TrendingUp}
              />
              <StatCard
                title="Ingen prioritet"
                value={data?.platformStats.no_priority_todos || 0}
                icon={TrendingUp}
              />
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* User Statistics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Active Users Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Brukerstatistikk
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Totale brukere
                  </span>
                  <span className="text-lg font-bold">
                    {data?.totalUsers || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Brukere med todos
                  </span>
                  <span className="text-lg font-bold">
                    {data?.usersWithTodos || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Gjennomsnittlig fullføringsrate
                  </span>
                  <span className="text-lg font-bold">
                    {data?.platformStats.completion_rate || 0}%
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Users Card */}
        <Card>
          <CardHeader>
            <CardTitle>Topp brukere</CardTitle>
            <p className="text-sm text-muted-foreground">
              Mest aktive brukere etter todo-antall
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center border-b pb-3"
                  >
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-12" />
                  </div>
                ))}
              </div>
            ) : data?.topUsers && data.topUsers.length > 0 ? (
              <div className="space-y-4">
                {data.topUsers.map((user, index) => (
                  <div
                    key={user.id}
                    className="flex justify-between items-center border-b pb-3 last:border-b-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          #{index + 1}
                        </span>
                        <p className="text-sm font-medium truncate">
                          {user.full_name || user.email}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {user.completed_todos}/{user.total_todos} fullført (
                        {user.completion_rate}%)
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-lg font-bold">
                        {user.total_todos}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        todos
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Ingen brukere med todos
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
