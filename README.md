Task Management Application
A modern task management application built with Next.js, TypeScript, and Socket.IO, featuring a Kanban board for task organization, real-time updates, and role-based dashboards for admins and users. The app allows admins to manage tasks and projects, while users can view and update tasks assigned to them.
Features

Kanban Board: Drag-and-drop interface for managing tasks across "To Do," "In Progress," and "Done" columns.
Role-Based Access:
Admins: Create, view, and delete tasks, manage projects, and assign tasks to users.
Users: View and update tasks assigned to them on a personalized Kanban board.


Real-Time Updates: Uses Socket.IO for live task creation and status updates.
Task Management: Create tasks with titles, descriptions, priorities, deadlines, assignees, and project associations.
Project Filtering: Filter tasks by project for focused task management.
Notifications: Real-time notifications for task assignments and updates.
Responsive UI: Built with Shadcn/UI components and Tailwind CSS for a modern, responsive design.

Tech Stack

Frontend: Next.js, TypeScript, React
State Management: Zustand
Real-Time Communication: Socket.IO
UI Components: Shadcn/UI, Tailwind CSS
Drag-and-Drop: DndKit
Date Handling: date-fns
HTTP Client: Axios (via api utility)
Icons: Lucide React
Package Manager: npm (or Yarn, depending on your setup)

Prerequisites

Node.js: Version 18.x or higher
npm: Version 8.x or higher (or Yarn)
Backend API: A compatible backend server with Socket.IO support (not included in this repository)
Git: For cloning the repository

Installation

Clone the Repository:
git clone https://github.com/your-username/task-management-app.git
cd task-management-app


Install Dependencies:
npm install

Note: If using Yarn, replace with yarn install.

Set Up Environment Variables:

Create a .env.local file in the root directory.
Add the following variables (adjust values based on your backend setup):NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=ws://localhost:5000


Ensure your backend API and Socket.IO server are running at the specified URLs.


Run the Development Server:
npm run dev

Note: If using Yarn, replace with yarn dev.

Open http://localhost:3000 in your browser to view the app.


Build for Production:
npm run build
npm run start

Note: If using Yarn, replace with yarn build and yarn start.


Usage

Accessing the App:

Admins: Navigate to /admin to access the Admin Dashboard, where you can create tasks, assign them to users, and manage projects.
Users: Navigate to /kanban to view and manage tasks assigned to you on a Kanban board.


Kanban Board:

Drag tasks between "To Do," "In Progress," and "Done" columns to update their status.
Click a task to view details or edit (admin-only for editing).
Filter tasks by project using the dropdown or search by title/description.


Task Creation (Admins):

Click the "New Task" button to open the task creation modal.
Fill in task details (title, description, priority, deadline, assignee, project).
Save to create the task and notify the assignee in real-time.


Notifications:

View real-time notifications for task assignments and updates via the notification dropdown (admin dashboard).



Project Structure
task-management-app/
├── .gitignore                    # Git ignore file
├── README.md                     # Project documentation
├── node_modules/                 # Node.js dependencies
├── .next/                        # Next.js build output
├── public/                       # Static assets
│   ├── favicon.ico
│   ├── images/
│   └── uploads/
├── src/
│   ├── components/              # React components
│   │   ├── ui/                  # Shadcn/UI components
│   │   ├── TaskCard.tsx         # Task card component
│   │   ├── TaskModal.tsx        # Task modal component
│   │   ├── KanbanColumn.tsx     # Kanban column component
│   │   ├── ProjectCard.tsx      # Project card component
│   │   ├── NotificationDropdown.tsx
│   │   └── AdminDashboardPage.tsx
│   ├── pages/                   # Next.js pages
│   │   ├── _app.tsx
│   │   ├── _document.tsx
│   │   ├── index.tsx
│   │   └── kanban.tsx
│   ├── store/                   # Zustand stores
│   │   ├── taskStore.ts
│   │   ├── authStore.ts
│   │   └── notificationStore.ts
│   ├── types/                   # TypeScript types
│   │   └── index.ts
│   ├── api/                     # API utilities
│   │   └── index.ts
│   ├── lib/                     # Utility libraries
│   │   └── socket.ts
│   ├── styles/                  # CSS/Tailwind styles
│   │   └── globals.css
│   └── __tests__/               # Test files
├── .env.local                   # Environment variables (not committed)
├── package.json
├── tsconfig.json
├── next.config.js
└── coverage/                    # Test coverage reports

Contributing

Fork the Repository:

Click the "Fork" button on GitHub to create a copy of the repository.


Clone Your Fork:
git clone https://github.com/your-username/task-management-app.git


Create a Branch:
git checkout -b feature/your-feature-name


Make Changes:

Follow the coding style and TypeScript conventions used in the project.
Ensure all tests pass (if applicable).


Commit and Push:
git add .
git commit -m "Add your feature description"
git push origin feature/your-feature-name


Submit a Pull Request:

Open a pull request on GitHub with a clear description of your changes.



Troubleshooting

Socket.IO Connection Issues:

Ensure the NEXT_PUBLIC_SOCKET_URL in .env.local matches your backend Socket.IO server.
Verify the backend server is running and accessible.


API Errors:

Check that NEXT_PUBLIC_API_URL points to the correct backend API.
Inspect browser console logs for detailed error messages.


Drag-and-Drop Not Working:

Ensure the task’s assignee.id matches the logged-in user for user Kanban (user role).
Verify the backend accepts valid task statuses (todo, in-progress, done).



Contact
For questions or feedback, please open an issue on GitHub or contact rahimarshad667@gmail.com.