import { Gift } from 'lucide-react';

export default function AssignmentsList({ assignments }) {
  if (!assignments || assignments.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5">
      <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
        <Gift className="w-5 h-5 text-purple-500" />
        מתנות שנקבעו ({assignments.length})
      </h2>
      <div className="space-y-2">
        {assignments.map((a, i) => (
          <div key={i} className="flex items-center gap-2 text-sm bg-purple-50 rounded-lg p-2.5">
            <span className="font-medium">{a.giverName}</span>
            <span className="text-gray-400">→</span>
            <span className="font-medium text-purple-600">{a.receiverName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
