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
import { TodosList } from "./todos-list";
import { TodoDialog } from "./todo-dialog";
import { ListTodo, Plus } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";

interface TodosPageContentProps {
  userId: string;
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
      </BlurFade>

      {/* Create Todo Dialog */}
      <TodoDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
