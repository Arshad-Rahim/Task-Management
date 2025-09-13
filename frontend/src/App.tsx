import { Routes, Route, Navigate } from "react-router-dom";
import { SignupPage } from "./pages/SignupPage";
import { LoginPage } from "./pages/LoginPage";
import { ProjectsPage } from "./pages/ProjectPage";
import { KanbanPage } from "./pages/KanbanPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { useThemeStore } from "./store/themeStore";
import { useEffect } from "react";
import { Layout } from "./components/Layout";
import { useAuthStore } from "./store/authStore";
import { useProjectStore } from "./store/projectStore";

function App() {
  const { isAuthenticated, user } = useAuthStore();
  const { theme } = useThemeStore();
  const { fetchProjects, fetchTasks } = useProjectStore();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
      fetchTasks();
    }
  }, [isAuthenticated]);

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={!isAuthenticated ? <LoginPage /> : <Navigate to="/kanban" />}
      />
      <Route
        path="/signup"
        element={!isAuthenticated ? <SignupPage /> : <Navigate to="/kanban" />}
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}
      >
        <Route index element={<Navigate to="/kanban" />} />
        <Route
          path="dashboard"
          element={
            user?.role === "admin" ? (
              <AdminDashboardPage />
            ) : (
              <Navigate to="/kanban" />
            )
          }
        />
        <Route path="projects" element={<ProjectsPage />} />
        <Route
          path="kanban"
          element={
            user?.role === "admin" ? <AdminDashboardPage /> : <KanbanPage />
          }
        />
      </Route>

      {/* Catch-all */}
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/kanban" : "/login"} />}
      />
    </Routes>
  );
}

export default App;
