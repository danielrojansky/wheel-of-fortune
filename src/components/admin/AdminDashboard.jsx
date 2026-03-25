import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Copy, Check, Share2, MessageCircle, Plus, Trash2, Gift, Users, RotateCcw, ArrowRight, Download, ClipboardList, ExternalLink, UserX } from 'lucide-react';
import { getAdminEvent, addChild, removeChild, removeAllChildren, resetEvent } from '../../lib/api';
import { saveEvent } from '../../lib/eventsStorage';

export default function AdminDashboard() {
  const { adminToken } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [addingChild, setAddingChild] = useState(false);
  const [copiedResults, setCopiedResults] = useState(false);

  const fetchEvent = async () => {
    try {
      const data = await getAdminEvent(adminToken);
      setEvent(data);
      saveEvent(adminToken, data.eventName);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
    const interval = setInterval(fetchEvent, 5000);
    return () => clearInterval(interval);
  }, [adminToken]);

  const shareUrl = event ? `${window.location.origin}/event/${event.shareToken}` : '';

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = `🎁 הצטרפו לחילופי מתנות "${event.eventName}"!\nלחצו על הקישור, בחרו את שם הילד/ה שלכם וסובבו את הגלגל:\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const openEventPage = () => {
    window.open(shareUrl, '_blank');
  };

  const handleAddChild = async () => {
    const trimmed = newChildName.trim();
    if (!trimmed) return;
    setAddingChild(true);
    try {
      await addChild(adminToken, trimmed);
      setNewChildName('');
      await fetchEvent();
    } catch (err) {
      alert(err.message);
    } finally {
      setAddingChild(false);
    }
  };

  const handleRemoveChild = async (childId) => {
    if (!confirm('בטוח להסיר?')) return;
    try {
      await removeChild(adminToken, childId);
      await fetchEvent();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReset = async () => {
    if (!confirm('בטוח לאפס את האירוע? כל ההגרלות יימחקו וכל הילדים יחזרו לרשימה.')) return;
    try {
      await resetEvent(adminToken);
      await fetchEvent();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveAll = async () => {
    if (!confirm('בטוח להסיר את כל המשתתפים? פעולה זו תמחק את כל הילדים וההגרלות.')) return;
    try {
      await removeAllChildren(adminToken);
      await fetchEvent();
    } catch (err) {
      alert(err.message);
    }
  };

  const getResultsText = () => {
    if (!event?.assignments?.length) return '';
    return event.assignments.map((a) => `${a.giverName} → ${a.receiverName}`).join('\n');
  };

  const copyResults = async () => {
    const text = `${event.eventName} - תוצאות הגרלה\n\n${getResultsText()}`;
    await navigator.clipboard.writeText(text);
    setCopiedResults(true);
    setTimeout(() => setCopiedResults(false), 2000);
  };

  const exportCSV = () => {
    if (!event?.assignments?.length) return;
    const bom = '\uFEFF';
    const header = 'נותנ/ת מתנה,מקבל/ת מתנה';
    const rows = event.assignments.map((a) => `${a.giverName},${a.receiverName}`);
    const csv = bom + [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.eventName} - תוצאות.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center">
        <div className="bg-red-50 text-red-600 rounded-xl p-4">{error}</div>
      </div>
    );
  }

  const childrenList = Object.entries(event.children || {});
  const completedCount = event.assignments?.length || 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <Link
        to="/Admin"
        className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 transition"
      >
        <ArrowRight className="w-4 h-4" />
        חזרה לאירועים
      </Link>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">{event.eventName}</h1>
        <p className="text-gray-500 mt-1">לוח בקרה</p>
      </div>

      {/* Share Section */}
      <div className="bg-white rounded-2xl shadow-lg p-5 space-y-3">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-purple-500" />
          שתפו עם ההורים
        </h2>
        <div className="flex gap-2">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 min-w-0 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm truncate"
            dir="ltr"
          />
          <button
            onClick={copyLink}
            className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={shareWhatsApp}
            className="flex items-center justify-center gap-2 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition font-medium text-sm"
          >
            <MessageCircle className="w-5 h-5 shrink-0" />
            <span className="truncate">שתפו בוואטסאפ</span>
          </button>
          <button
            onClick={openEventPage}
            className="flex items-center justify-center gap-2 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition font-medium text-sm"
          >
            <ExternalLink className="w-5 h-5 shrink-0" />
            <span className="truncate">פתח דף אירוע</span>
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl shadow-lg p-5">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
          <Gift className="w-5 h-5 text-purple-500" />
          התקדמות ({completedCount} מתוך {childrenList.length})
        </h2>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div
            className="bg-purple-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${childrenList.length > 0 ? (completedCount / childrenList.length) * 100 : 0}%` }}
          />
        </div>
        {event.assignments?.length > 0 && (
          <>
            <div className="space-y-2">
              {event.assignments.map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-sm bg-purple-50 rounded-lg p-2.5">
                  <Gift className="w-4 h-4 text-purple-400" />
                  <span className="font-medium">{a.giverName}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium text-purple-600">{a.receiverName}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                onClick={copyResults}
                className="flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition text-sm font-medium"
              >
                {copiedResults ? <Check className="w-4 h-4 text-green-600" /> : <ClipboardList className="w-4 h-4" />}
                {copiedResults ? 'הועתק!' : 'העתק תוצאות'}
              </button>
              <button
                onClick={exportCSV}
                className="flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                ייצוא CSV
              </button>
            </div>
          </>
        )}
      </div>

      {/* Children Management */}
      <div className="bg-white rounded-2xl shadow-lg p-5">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-purple-500" />
          ילדים ({childrenList.length})
        </h2>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newChildName}
            onChange={(e) => setNewChildName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddChild()}
            placeholder="הוסיפו ילד/ה..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm"
          />
          <button
            onClick={handleAddChild}
            disabled={addingChild}
            className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-1.5">
          {childrenList.map(([id, child]) => (
            <div key={id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                <span>{child.name}</span>
                {child.hasSpun && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">סובב/ה</span>
                )}
                {child.isReceiver && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">נבחר/ה</span>
                )}
              </div>
              {!child.hasSpun && !child.isReceiver && (
                <button
                  onClick={() => handleRemoveChild(id)}
                  className="text-gray-400 hover:text-red-500 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        {childrenList.length > 0 && (
          <button
            onClick={handleRemoveAll}
            className="w-full flex items-center justify-center gap-2 mt-3 py-2 text-sm text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition border border-red-200"
          >
            <UserX className="w-4 h-4" />
            הסר את כל המשתתפים
          </button>
        )}
      </div>

      {/* Reset Event */}
      <div className="bg-white rounded-2xl shadow-lg p-5">
        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition font-medium border border-red-200"
        >
          <RotateCcw className="w-5 h-5" />
          איפוס אירוע
        </button>
        <p className="text-xs text-gray-400 text-center mt-2">מוחק את כל ההגרלות ומאפשר להתחיל מחדש</p>
      </div>
    </div>
  );
}
