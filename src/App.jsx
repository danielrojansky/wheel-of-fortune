import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CreateEvent from './components/admin/CreateEvent';
import AdminDashboard from './components/admin/AdminDashboard';
import EventPage from './components/event/EventPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-dvh bg-gradient-to-b from-purple-50 to-indigo-50">
        <Routes>
          <Route path="/" element={<CreateEvent />} />
          <Route path="/admin/:adminToken" element={<AdminDashboard />} />
          <Route path="/event/:shareToken" element={<EventPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
