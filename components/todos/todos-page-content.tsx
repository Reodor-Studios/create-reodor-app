"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TodosList } from "./todos-list";
import { TodoDialog } from "./todo-dialog";
import { TodoDashboard } from "./todo-dashboard";
import {
  ListTodo,
  Plus,
  LayoutDashboard,
  HelpCircle,
  Zap,
  Database,
  RefreshCw,
} from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";

interface TodosPageContentProps {
  userId: string;
}

function TanStackDBInfoButton() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <HelpCircle className="h-4 w-4" />
          <span className="sr-only">Hva er dette?</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm">TanStack DB Demo</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Dette dashboardet bruker{" "}
              <strong>TanStack DB live queries</strong> til å beregne statistikk
              reaktivt. Prøv å legge til, fullføre eller slette oppgaver -
              tallene oppdateres umiddelbart.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 mt-0.5 flex-shrink-0 text-purple-500" />
              <div>
                <p className="font-medium text-xs">Sub-millisecond updates</p>
                <p className="text-xs text-muted-foreground">
                  Statistikk rekalkuleres inkrementelt
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Database className="h-4 w-4 mt-0.5 flex-shrink-0 text-purple-500" />
              <div>
                <p className="font-medium text-xs">Normalisert data</p>
                <p className="text-xs text-muted-foreground">
                  Synkronisert på tvers av komponenter
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <RefreshCw className="h-4 w-4 mt-0.5 flex-shrink-0 text-purple-500" />
              <div>
                <p className="font-medium text-xs">TanStack Query bridge</p>
                <p className="text-xs text-muted-foreground">
                  Integrerer med eksisterende Query-oppsett
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-3">
            <p className="font-medium text-xs mb-1">Bruksområder</p>
            <p className="text-xs text-muted-foreground">
              Dashboards, kanban-boards, collaborative apps, shopping carts,
              instant search/filter
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function TodosPageContent({ userId }: TodosPageContentProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <BlurFade delay={0.1} duration={0.5} inView>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold break-words">
              Mine oppgaver
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground break-words">
              Administrer alle dine oppgaver på ett sted
            </p>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Ny oppgave
          </Button>
        </div>
      </BlurFade>

      <BlurFade delay={0.15} duration={0.5} inView>
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <ListTodo className="w-4 h-4" />
              <span className="hidden sm:inline">Liste</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListTodo className="w-5 h-5" />
                  Alle oppgaver
                </CardTitle>
                <CardDescription>
                  Se, filtrer og administrer alle dine oppgaver
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TodosList userId={userId} showFilters={true} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <LayoutDashboard className="w-5 h-5" />
                      Oppgave-dashboard
                    </CardTitle>
                    <CardDescription>
                      Oversikt og statistikk over dine oppgaver
                    </CardDescription>
                  </div>
                  <TanStackDBInfoButton />
                </div>
              </CardHeader>
              <CardContent>
                <TodoDashboard userId={userId} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </BlurFade>

      {/* Create Todo Dialog */}
      <TodoDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
