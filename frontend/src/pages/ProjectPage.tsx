"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProjectCard } from "@/components/ProjectCard";
import { useProjectStore } from "@/store/projectStore";
import { useAuthStore } from "@/store/authStore";
import type { Project } from "@/types";
import { Plus, Search, Filter } from "lucide-react";
import { ProjectModal } from "@/components/ProjectModal";

export function ProjectsPage() {
  const { projects } = useProjectStore();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Project["status"]>(
    "all"
  );
  const [modalOpen, setModalOpen] = useState(false);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewProject = (project: Project) => {
    console.log("Viewing project:", project);
  };

  const handleAddProject = () => {
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all your projects in one place.
          </p>
        </div>
        {user?.role === "admin" && (
          <Button onClick={handleAddProject}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onView={handleViewProject}
          />
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  No projects found
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Get started by creating your first project."}
                </p>
              </div>
              {user?.role === "admin" &&
                !searchTerm &&
                statusFilter === "all" && (
                  <Button onClick={handleAddProject}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Project
                  </Button>
                )}
            </div>
          </CardContent>
        </Card>
      )}

      <ProjectModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
