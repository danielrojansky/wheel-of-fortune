// Wheel segment geometry calculations

export function getSegments(names) {
  const count = names.length;
  if (count === 0) return [];
  const arcSize = (2 * Math.PI) / count;
  return names.map((name, i) => ({
    name,
    startAngle: i * arcSize - Math.PI / 2,
    endAngle: (i + 1) * arcSize - Math.PI / 2,
    midAngle: (i + 0.5) * arcSize - Math.PI / 2,
    index: i,
  }));
}

export function getTargetAngle(targetIndex, totalSegments) {
  const arcSize = (2 * Math.PI) / totalSegments;
  // Angle to center of target segment, pointer is at top (- PI/2)
  const targetMid = targetIndex * arcSize + arcSize / 2;
  // We need the wheel to rotate so this segment is at the top
  // Add random full rotations (5-8) for visual effect
  const fullRotations = (5 + Math.random() * 3) * 2 * Math.PI;
  return fullRotations + (2 * Math.PI - targetMid);
}

// Bright, distinct colors for wheel segments
const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
];

export function getColor(index) {
  return COLORS[index % COLORS.length];
}

export function getFontSize(count, radius) {
  const maxLen = radius * 0.55;
  const base = Math.min(16, maxLen / 5);
  return Math.max(10, Math.min(base, 200 / count));
}
