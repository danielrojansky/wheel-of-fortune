import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2, Sparkles, ArrowRight } from 'lucide-react';
import { createEvent } from '../../lib/api';
import { saveEvent } from '../../lib/eventsStorage';

const DEFAULT_NAMES = [
  'עומר ר', 'גאיה ע', 'מאיה', 'עידו', 'נועה', 'ליבי', 'יובל',
  'מעיין ו', 'מיקי', 'גלי', 'אופיר', 'יעל', 'לביא', 'אסף',
  'ליה', 'מעיין ל', 'אלונה', 'אורי', 'אגם',
];

export default function CreateEvent() {
  const navigate = useNavigate();
  const [eventName, setEventName] = useState('חילופי מתנות');
  const [names, setNames] = useState(DEFAULT_NAMES);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addName = () => {
    const trimmed = newName.trim();
    if (trimmed && !names.includes(trimmed)) {
      setNames([...names, trimmed]);
      setNewName('');
    }
  };

  const removeName = (index) => {
    setNames(names.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (names.length < 2) {
      setError('נדרשים לפחות 2 ילדים');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { adminToken } = await createEvent(eventName, names);
      saveEvent(adminToken, eventName);
      navigate(`/admin/${adminToken}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 transition mb-4"
      >
        <ArrowRight className="w-4 h-4" />
        חזרה לאירועים
      </Link>
      <div className="text-center mb-8">
        <Sparkles className="w-12 h-12 text-purple-500 mx-auto mb-3" />
        <h1 className="text-3xl font-bold text-gray-800">גלגל מתנות</h1>
        <p className="text-gray-500 mt-2">צרו אירוע חילופי מתנות לילדים</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שם האירוע</label>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ילדים ({names.length})
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addName())}
              placeholder="הוסיפו שם..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
            />
            <button
              type="button"
              onClick={addName}
              className="px-4 py-2.5 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {names.map((name, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-800 rounded-full text-sm"
              >
                {name}
                <button
                  type="button"
                  onClick={() => removeName(i)}
                  className="text-purple-400 hover:text-red-500 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 rounded-lg p-3">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading || names.length < 2}
          className="w-full py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        >
          {loading ? 'יוצר אירוע...' : 'צור אירוע 🎉'}
        </button>
      </form>
    </div>
  );
}
