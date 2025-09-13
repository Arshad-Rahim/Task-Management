"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Task } from "@/types";
import { Calendar, User, MoreHorizontal, AlertCircle } from "lucide-react";
import { format, isAfter } from "date-fns";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityVariant = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default"; // Changed from "warning" to "default"
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  const isOverdue =
    isAfter(new Date(), new Date(task.deadline)) && task.status !== "done";

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-pointer hover:shadow-md transition-shadow duration-200 ${
        isDragging ? "opacity-50" : ""
      }`}
      onClick={() => onClick(task)}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-sm line-clamp-2 flex-1 pr-2">
            {task.title}
          </h4>
          <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <Badge
            variant={getPriorityVariant(task.priority)}
            className="text-xs"
          >
            {task.priority}
          </Badge>
          {isOverdue && (
            <div className="flex items-center space-x-1 text-red-500">
              <AlertCircle className="h-3 w-3" />
              <span className="text-xs">Overdue</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <User className="h-3 w-3" />
            <span className="truncate max-w-20">
              {"name" in task.assignee ? task.assignee.name : "Unknown"}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(task.deadline), "MMM dd")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
