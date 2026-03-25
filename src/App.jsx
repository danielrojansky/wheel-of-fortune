import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
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
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={<EventManager />} />
            <Route path="/admin/new" element={<CreateEvent />} />
            <Route path="/admin/:adminToken" element={<AdminDashboard />} />
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
