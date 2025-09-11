import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router';
import ProjectsPage from "./ProjectsPage";
import TasksPage from "./TasksPage";
import Account from "./Account";
import App from './App';
import { SessionProvider } from './SessionContext';
import './index.css';

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
        <SessionProvider>
        <BrowserRouter>
          <nav style={{ padding: "1rem" }}>
            <Link to="/projects">Projects</Link> | <Link to="/tasks">Tasks</Link> | <Link to="/profile">Edit Profile</Link>
          </nav>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/profile" element={<Account session={null as any} />} />
          </Routes>
        </BrowserRouter>
      </SessionProvider>
    </StrictMode>
);
}
