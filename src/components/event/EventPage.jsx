import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { getEvent, spin } from '../../lib/api';
import WheelCanvas from './WheelCanvas';
import ChildSelector from './ChildSelector';
import SpinResult from './SpinResult';

export default function EventPage() {
  const { shareToken } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedChild, setSelectedChild] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [targetIndex, setTargetIndex] = useState(null);
  const [result, setResult] = useState(null);
  const [spinError, setSpinError] = useState('');
  const [hasSpun, setHasSpun] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Ref to hold the wheel's names so we can read the landed name at spin-end
  const wheelNamesRef = useRef([]);

  const fetchEvent = useCallback(async () => {
    try {
      const data = await getEvent(shareToken);
      setEvent(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [shareToken]);

  useEffect(() => { fetchEvent(); }, [fetchEvent]);

  const wheelItems = useMemo(() => {
    if (!event) return [];
    return event.canReceive
      .filter((id) => id !== selectedChild)
      .map((id) => ({ id, name: event.children[id]?.name || id }));
  }, [event, selectedChild]);

  const wheelNames = useMemo(() => wheelItems.map((w) => w.name), [wheelItems]);

  // Keep ref in sync
  wheelNamesRef.current = wheelNames;

  const handleSpin = async () => {
    if (!selectedChild || spinning || hasSpun) return;
    setSpinError('');
    if (wheelItems.length === 0) {
      setSpinError('אין ילדים זמינים לבחירה');
      return;
    }
    try {
      setSpinning(true);
      const res = await spin(shareToken, selectedChild);
      const idx = wheelItems.findIndex((w) => w.id === res.receiverId);
      setTargetIndex(idx >= 0 ? idx : 0);
      setResult(res);
      setHasSpun(true);
    } catch (err) {
      setSpinning(false);
      setSpinError(err.message);
    }
  };

  // WheelCanvas calls this with the index of the segment at the pointer
  const handleSpinEnd = useCallback((landedIndex) => {
    setSpinning(false);

    // Override the result's receiver name with whatever the wheel actually shows
    const landedName = wheelNamesRef.current[landedIndex];
    if (landedName) {
      setResult((prev) =>
        prev ? { ...prev, displayName: landedName } : prev
      );
    }
    setShowResult(true);
  }, []);

  const handleCloseResult = () => {
    setResult(null);
    setShowResult(false);
    setSelectedChild('');
    setTargetIndex(null);
    setHasSpun(false);
    fetchEvent();
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

  const allDone = event.canSpin.length === 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-3 flex flex-col h-dvh">
      <div className="text-center py-2">
        <h1 className="text-xl font-bold text-gray-800 flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-500" />
          {event.eventName}
        </h1>
        <p className="text-gray-500 text-xs mt-0.5">
          {allDone
            ? 'כל המתנות חולקו! 🎉'
            : 'בחרו את הילד/ה שלכם וסובבו את הגלגל'}
        </p>
      </div>

      {!allDone && (
        <div className="flex flex-col flex-1 min-h-0 gap-2">
          <ChildSelector
            children={event.children}
            canSpin={event.canSpin}
            selectedId={selectedChild}
            onChange={setSelectedChild}
            disabled={spinning}
          />

          <div className="flex-1 min-h-0 flex items-center">
            <WheelCanvas
              names={wheelNames}
              targetIndex={targetIndex}
              spinning={spinning}
              onSpinEnd={handleSpinEnd}
            />
          </div>

          {spinError && (
            <div className="text-red-600 text-sm bg-red-50 rounded-lg p-2 text-center">
              {spinError}
            </div>
          )}

          <button
            onClick={handleSpin}
            disabled={!selectedChild || spinning || hasSpun || wheelItems.length === 0}
            className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg shadow-purple-200 shrink-0 mb-2"
          >
            {spinning ? 'הגלגל מסתובב...' : 'סובבו את הגלגל! 🎡'}
          </button>
        </div>
      )}

      {result && showResult && !spinning && (
        <SpinResult
          giverName={result.giverName}
          receiverName={result.displayName || result.receiverName}
          onClose={handleCloseResult}
        />
      )}
    </div>
  );
}
