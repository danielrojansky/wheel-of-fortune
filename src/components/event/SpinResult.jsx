import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Gift, X } from 'lucide-react';

export default function SpinResult({ giverName, receiverName, onClose }) {
  useEffect(() => {
    // Fire confetti
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#7c3aed', '#ec4899', '#f59e0b'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#7c3aed', '#ec4899', '#f59e0b'],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center relative animate-bounce-in">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-6 h-6" />
        </button>

        <Gift className="w-16 h-16 text-purple-500 mx-auto mb-4" />

        <h2 className="text-2xl font-bold text-gray-800 mb-2">נקבע!</h2>

        <div className="bg-purple-50 rounded-2xl p-5 mb-4">
          <p className="text-lg text-gray-600 mb-1">{giverName}</p>
          <p className="text-sm text-gray-400">נותנ/ת מתנה ל</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{receiverName}</p>
        </div>

        <p className="text-gray-500 text-sm">🎁 מזל טוב!</p>
      </div>
    </div>
  );
}
