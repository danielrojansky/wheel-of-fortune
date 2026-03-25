import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Settings, Trash2, ExternalLink, Users, Gift, Pencil, Check, X, Sparkles } from 'lucide-react';
import { listEvents, deleteEvent as apiDeleteEvent, updateEvent as apiUpdateEvent } from '../../lib/api';

export default function EventManager() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await listEvents();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to load events:', err);
      setEvents([]);
    }
    setLoading(false);
  };

  const handleDelete = async (adminToken, eventId) => {
    if (!confirm('בטוח למחוק את האירוע? פעולה זו לא ניתנת לביטול.')) return;
    try {
      await apiDeleteEvent(adminToken);
      setEvents((prev) => prev.filter((e) => e.eventId !== eventId));
    } catch (err) {
      alert(err.message);
    }
  };

  const startEdit = (ev) => {
    setEditingId(ev.eventId);
    setEditName(ev.eventName);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const saveEdit = async (ev) => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    try {
      await apiUpdateEvent(ev.adminToken, trimmed);
      setEvents((prev) =>
        prev.map((e) => (e.eventId === ev.eventId ? { ...e, eventName: trimmed } : e))
      );
      setEditingId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="text-center">
        <Sparkles className="w-12 h-12 text-purple-500 mx-auto mb-3" />
        <h1 className="text-3xl font-bold text-gray-800">גלגל מתנות</h1>
        <p className="text-gray-500 mt-2">ניהול אירועים</p>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">אין אירועים עדיין</p>
          <button
            onClick={() => navigate('/admin/new')}
            className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition"
          >
            צרו אירוע חדש
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <div key={ev.eventId} className="bg-white rounded-2xl shadow-lg p-4">
              <div className="flex items-center justify-between mb-2">
                {editingId === ev.eventId ? (
                  <div className="flex items-center gap-2 flex-1 ml-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(ev);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm"
                      autoFocus
                    />
                    <button
                      onClick={() => saveEdit(ev)}
                      className="text-green-600 hover:text-green-700 transition p-1"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-gray-400 hover:text-gray-600 transition p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{ev.eventName}</h3>
                    <button
                      onClick={() => startEdit(ev)}
                      className="text-gray-400 hover:text-purple-500 transition p-1"
                      title="ערוך שם"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {ev.childrenCount} ילדים
                </span>
                <span className="flex items-center gap-1">
                  <Gift className="w-4 h-4" />
                  {ev.completedCount} מתוך {ev.childrenCount} הגרלות
                </span>
              </div>

              {ev.childrenCount > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(ev.completedCount / ev.childrenCount) * 100}%` }}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/admin/${ev.adminToken}`)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 active:bg-purple-300 transition text-sm font-medium"
                >
                  <Settings className="w-4 h-4" />
                  לוח בקרה
                </button>
                <button
                  onClick={() => window.open(`/event/${ev.shareToken}`, '_blank')}
                  className="flex items-center justify-center gap-2 py-2.5 px-3.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition text-sm"
                  title="פתח דף אירוע"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(ev.adminToken, ev.eventId)}
                  className="flex items-center justify-center gap-2 py-2.5 px-3.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 active:bg-red-200 transition text-sm"
                  title="מחק אירוע"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => navigate('/admin/new')}
        className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition text-lg shadow-lg shadow-purple-200"
      >
        <Plus className="w-5 h-5" />
        צרו אירוע חדש
      </button>
    </div>
  );
}
