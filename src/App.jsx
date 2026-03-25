import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import EventManager from './components/admin/EventManager';
import CreateEvent from './components/admin/CreateEvent';
import AdminDashboard from './components/admin/AdminDashboard';
import EventPage from './components/event/EventPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-dvh bg-gradient-to-b from-purple-50 to-indigo-50 flex flex-col">
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/Admin" replace />} />
            <Route path="/admin" element={<Navigate to="/Admin" replace />} />
            <Route path="/Admin" element={<EventManager />} />
            <Route path="/Admin/new" element={<CreateEvent />} />
            <Route path="/Admin/:adminToken" element={<AdminDashboard />} />
            <Route path="/event/:shareToken" element={<EventPage />} />
          </Routes>
        </div>
        <footer className="text-center text-xs text-gray-300 py-3 pb-safe">
          v{__APP_VERSION__}
        </footer>
      </div>
    </BrowserRouter>
  );
}
