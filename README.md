Task Management App - MERN Stack Machine Task
Overview
This is a Task Management Application built with the MERN stack (MongoDB, Express.js, React, Node.js). It enables project and task management with authentication, role-based access, real-time updates, and background jobs.
Features

Authentication & Roles

JWT-based login and signup
Roles: Admin and User
Admin: Create and assign tasks
User: Update only assigned tasks


Projects & Tasks API

CRUD operations for projects and tasks
Task fields: title, description, assignee, status (Todo / In-Progress / Done), priority, deadline
Activity log tracking updates (who and when)


Real-Time Features (Optional)

Kanban board with drag & drop tasks syncing across clients
Notifications for task assignments and updates


Background Jobs

Daily email reminders for tasks due within 24 hours
Weekly project summary report with basic task stats


Frontend

Login and Signup pages
Project Dashboard listing projects
Kanban Board for tasks by status
Task Modal for editing tasks, viewing activity log, and adding attachments (optional)
Notifications dropdown for real-time updates



Project Structure
Task Management/
├── backend/
│   ├── dist/
│   ├── node_modules/
│   ├── src/
│   ├── .env
│   ├── package-lock.json
│   ├── package.json
│   └── README.md
├── frontend/
│   ├── dist/
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AdminDashboardPage.tsx
│   │   │   ├── KanbanPage.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── components/
│   │   │   ├── KanbanColumn.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   └── TaskModal.tsx
│   │   ├── env
│   │   ├── .gitignore
│   │   ├── components.json
│   │   ├── index.html
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── README.md
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.app.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
└── .gitignore

Prerequisites

Node.js and npm
MongoDB (local or cloud instance)
Git

Installation
Backend Setup

Navigate to the backend folder:cd backend


Install dependencies:npm install


Configure .env with MongoDB URI, JWT secret, etc.
Start the server:npm start



Frontend Setup

Navigate to the frontend folder:cd frontend


Install dependencies:npm install


Start the development server:npm run dev



Usage

Access the app at http://localhost:5000.
Log in as Admin or User to manage tasks and projects.
Use the Kanban board for task management .


