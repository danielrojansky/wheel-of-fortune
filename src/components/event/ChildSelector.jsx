import { memo, useMemo } from 'react';
import { User } from 'lucide-react';

function ChildSelectorInner({ children, canSpin, selectedId, onChange, disabled }) {
  // Memoize the filtered list so it only changes when data actually changes
  const available = useMemo(
    () => Object.entries(children).filter(([id]) => canSpin.includes(id)),
    [children, canSpin]
  );

  if (available.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-3 shrink-0">
      <h2 className="font-semibold text-gray-700 text-xs mb-2 flex items-center gap-1.5">
        <User className="w-3.5 h-3.5 text-purple-500" />
        בחרו את הילד/ה שלכם
      </h2>
      <div className="grid grid-cols-4 gap-1.5">
        {available.map(([id, child]) => (
          <button
            key={id}
            onClick={() => onChange(selectedId === id ? '' : id)}
            disabled={disabled}
            className={`py-1.5 px-1.5 rounded-lg text-xs font-medium transition-all border-2 truncate ${
              selectedId === id
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-200'
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

const ChildSelector = memo(ChildSelectorInner);
export default ChildSelector;
