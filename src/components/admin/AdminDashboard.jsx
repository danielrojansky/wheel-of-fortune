import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Copy, Check, Share2, MessageCircle, QrCode, Plus, Trash2, Gift, Users } from 'lucide-react';
import { getAdminEvent, addChild, removeChild } from '../../lib/api';

export default function AdminDashboard() {
  const { adminToken } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [addingChild, setAddingChild] = useState(false);

  const fetchEvent = async () => {
    try {
      const data = await getAdminEvent(adminToken);
      setEvent(data);
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

  const shareSMS = () => {
    const text = `🎁 חילופי מתנות "${event.eventName}" - לחצו כאן: ${shareUrl}`;
    window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank');
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
            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm truncate"
            dir="ltr"
          />
          <button
            onClick={copyLink}
            className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={shareWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition font-medium"
          >
            <MessageCircle className="w-5 h-5" />
            שתפו בוואטסאפ
          </button>
          <button
            onClick={shareSMS}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition font-medium"
          >
            <Share2 className="w-5 h-5" />
            שתפו ב-SMS
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
          <div className="space-y-2">
            {event.assignments.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-sm bg-purple-50 rounded-lg p-2.5">
                <Gift className="w-4 h-4 text-purple-400" />
                <span className="font-medium">{a.giverName}</span>
                <span className="text-gray-400">←</span>
                <span className="font-medium">{a.receiverName}</span>
              </div>
            ))}
          </div>
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
      </div>
    </div>
  );
}
