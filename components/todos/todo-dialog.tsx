"use client";

import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { TodoForm } from "./todo-form";
import type { DatabaseTables } from "@/types";

type TodoWithMedia = DatabaseTables["todos"]["Row"] & {
  media?:
    | Array<{
        id: string;
        file_path: string;
        media_type: string;
      }>
    | null;
};

interface TodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingTodo?: TodoWithMedia | null;
}

export function TodoDialog({
  open,
  onOpenChange,
  existingTodo,
}: TodoDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const renderContent = ({ isInDrawer = false }) => (
    <div className={isInDrawer ? "flex flex-col h-full" : ""}>
      <div className={isInDrawer ? "flex-1 overflow-y-auto space-y-4 pr-4 pb-4" : ""}>
        <TodoForm
          existingTodo={existingTodo}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] overflow-y-scroll max-h-screen">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl break-words">
              {existingTodo ? "Rediger oppgave" : "Ny oppgave"}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base break-words">
              {existingTodo
                ? "Oppdater oppgaveinformasjon"
                : "Opprett en ny oppgave"}
            </DialogDescription>
          </DialogHeader>
          {renderContent({ isInDrawer: false })}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[95vh]">
        <DrawerHeader className="text-left space-y-3 px-4 pt-4 pb-2">
          <DrawerTitle className="text-lg">
            {existingTodo ? "Rediger oppgave" : "Ny oppgave"}
          </DrawerTitle>
          <DrawerDescription className="text-sm">
            {existingTodo
              ? "Oppdater oppgaveinformasjon"
              : "Opprett en ny oppgave"}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 min-h-0 px-4 pb-4">
          {renderContent({ isInDrawer: true })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
