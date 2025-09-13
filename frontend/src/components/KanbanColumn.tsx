"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/TaskCard";
import type { Task } from "@/types";
import { Plus } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface KanbanColumnProps {
  title: string;
  status: Task["status"];
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask?: () => void;
  color: string;
}

export function KanbanColumn({
  title,
  status,
  tasks,
  onTaskClick,
  onAddTask,
  color,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <span>{title}</span>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
              {tasks.length}
            </span>
          </CardTitle>
          {onAddTask && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onAddTask}
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-3 pt-0">
        <div ref={setNodeRef} className="space-y-3 min-h-[200px]">
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={onTaskClick} />
            ))}
          </SortableContext>

          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <p className="text-xs text-muted-foreground">No tasks</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
