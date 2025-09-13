"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProjectStore } from "@/store/projectStore";
import { useAuthStore } from "@/store/authStore";
import api from "@/api";
import type { Project, User } from "@/types";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectModal({ isOpen, onClose }: ProjectModalProps) {
  const { addProject } = useProjectStore();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "active" as Project["status"],
    members: [] as string[],
  });
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await api.get("/users");
        console.log("Fetched users structure:", response.data); 
        setUsers(response.data);
      } catch (err) {
        setError("Failed to load users. Please try again.");
        console.error(err);
      } finally {
        setLoadingUsers(false);
      }
    };
    if (user?.role === "admin") {
      fetchUsers();
    } else {
      setLoadingUsers(false);
    }
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleMemberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    console.log("Selected members (values):", selectedOptions); 
    setFormData((prev) => ({
      ...prev,
      members: selectedOptions,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      members:
        formData.members.length > 0
          ? formData.members
          : [user?._id || user?.id], 
    };
    console.log("Payload being sent:", payload); 
    try {
      const response = await api.post("/projects", payload);
      addProject(response.data);
      onClose();
    } catch (err: any) {
      console.error("Error response:", err.response?.data);
      setError(
        err.response?.data?.message ||
          "Failed to create project. Please try again."
      );
      console.error(err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              className="mt-1"
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>
          <div>
            <Label htmlFor="members">Members</Label>
            <select
              id="members"
              name="members"
              multiple
              value={formData.members}
              onChange={handleMemberChange}
              disabled={loadingUsers || user?.role !== "admin"} 
              className="flex h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
            >
              {loadingUsers ? (
                <option disabled>Loading users...</option>
              ) : (
                users.map((u) => (
                  <option key={u._id || u.id} value={u._id || u.id}>
                    {u.name} ({u.email})
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loadingUsers}>
              Create Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
