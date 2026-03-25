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

export function getTargetAngle(targetIndex, totalSegments, currentRotation) {
  const arcSize = (2 * Math.PI) / totalSegments;
  const targetMid = (targetIndex + 0.5) * arcSize;
  // Desired final rotation (mod 2PI) so target segment center is at the pointer (top)
  const desiredFinal = ((2 * Math.PI - targetMid) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const currentMod = ((currentRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  // Delta from current position to desired position
  let delta = desiredFinal - currentMod;
  if (delta < 0) delta += 2 * Math.PI;
  // Add full rotations (5-8) for visual effect
  const fullRotations = (5 + Math.random() * 3) * 2 * Math.PI;
  return fullRotations + delta;
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
