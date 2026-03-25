import { Link } from 'react-router-dom';
import { Sparkles, Gift, Settings } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-dvh px-4">
      <div className="text-center space-y-8 max-w-md">
        <div>
          <Sparkles className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-800 mb-3">גלגל מתנות</h1>
          <p className="text-gray-500 text-lg">
            אפליקציה לחילופי מתנות בין ילדים
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Link
            to="/admin"
            className="flex items-center justify-center gap-2 py-3.5 px-6 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition text-lg shadow-lg shadow-purple-200"
          >
            <Settings className="w-5 h-5" />
            כניסה לניהול
          </Link>
        </div>

        <div className="pt-4">
          <Gift className="w-8 h-8 text-purple-300 mx-auto" />
        </div>
      </div>
    </div>
  );
}
