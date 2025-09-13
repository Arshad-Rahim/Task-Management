"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Project } from "@/types";
import { Calendar, Users, MoreHorizontal, Eye } from "lucide-react";
import { format } from "date-fns";

interface ProjectCardProps {
  project: Project;
  onView: (project: Project) => void;
}

export function ProjectCard({ project, onView }: ProjectCardProps) {
  const getStatusVariant = (status: Project["status"]) => {
    switch (status) {
      case "active":
        return "default"; // Changed from "success" to "default"
      case "completed":
        return "default";
      case "on-hold":
        return "secondary"; // Changed from "warning" to "secondary"
      default:
        return "secondary";
    }
  };

  const progressPercentage =
    project.tasksCount > 0
      ? (project.completedTasks / project.tasksCount) * 100
      : 0;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg line-clamp-1">
              {project.title}
            </CardTitle>
            <Badge
              variant={getStatusVariant(project.status)}
              className="capitalize"
            >
              {project.status.replace("-", " ")}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.description}
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {project.completedTasks}/{project.tasksCount} tasks
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{project.members.length} members</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(project.updatedAt), "MMM dd")}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-transparent"
            onClick={() => onView(project)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
