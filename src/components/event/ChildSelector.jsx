import { User } from 'lucide-react';

export default function ChildSelector({ children, canSpin, selectedId, onChange, disabled }) {
  // Only show children who haven't spun yet
  const available = Object.entries(children).filter(([id]) => canSpin.includes(id));

  if (available.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4">
      <h2 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
        <User className="w-4 h-4 text-purple-500" />
        בחרו את הילד/ה שלכם
      </h2>
      <div className="grid grid-cols-3 gap-2">
        {available.map(([id, child]) => (
          <button
            key={id}
            onClick={() => onChange(selectedId === id ? '' : id)}
            disabled={disabled}
            className={`py-2.5 px-2 rounded-xl text-sm font-medium transition-all border-2 truncate ${
              selectedId === id
                ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200'
                : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
            } disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
          >
            {child.name}
          </button>
        ))}
      </div>
    </div>
  );
}
