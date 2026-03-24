import { ChevronDown } from 'lucide-react';

export default function ChildSelector({ children, canSpin, selectedId, onChange, disabled }) {
  // Only show children who haven't spun yet
  const available = Object.entries(children).filter(([id]) => canSpin.includes(id));

  return (
    <div className="relative">
      <select
        value={selectedId}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full appearance-none px-4 py-3 bg-white border-2 border-purple-200 rounded-xl text-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none disabled:opacity-50 disabled:cursor-not-allowed pr-10"
      >
        <option value="">בחרו את הילד/ה שלכם...</option>
        {available.map(([id, child]) => (
          <option key={id} value={id}>
            {child.name}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
    </div>
  );
}
