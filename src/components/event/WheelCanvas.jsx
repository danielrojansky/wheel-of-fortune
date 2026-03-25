import { useRef, useEffect } from 'react';

// ── Colors ──────────────────────────────────────────────
const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
];

// ── Pure drawing function (no React, no state) ─────────
function drawWheel(ctx, size, names, angle) {
  const n = names.length;
  if (n === 0) return;

  const center = size / 2;
  const radius = center - 14;
  const arc = (2 * Math.PI) / n;
  const fontSize = Math.max(11, Math.min(18, radius * 0.09));

  ctx.clearRect(0, 0, size, size);

  // Outer ring shadow
  ctx.save();
  ctx.beginPath();
  ctx.arc(center, center, radius + 6, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(124, 58, 237, 0.15)';
  ctx.fill();
  ctx.restore();

  // ── Rotated wheel ──
  ctx.save();
  ctx.translate(center, center);
  ctx.rotate(angle);

  for (let i = 0; i < n; i++) {
    const start = i * arc - Math.PI / 2;
    const end = (i + 1) * arc - Math.PI / 2;
    const mid = (i + 0.5) * arc - Math.PI / 2;

    // Segment fill
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Text
    ctx.save();
    ctx.rotate(mid);
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${fontSize}px "Segoe UI", Tahoma, Arial, sans-serif`;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textR = radius * 0.62;
    // Flip text that would appear upside-down
    const visualAngle = ((angle + mid) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const upsideDown = visualAngle > Math.PI / 2 && visualAngle < 1.5 * Math.PI;

    if (upsideDown) {
      ctx.translate(textR, 0);
      ctx.rotate(Math.PI);
      ctx.fillText(names[i], 0, 0);
    } else {
      ctx.fillText(names[i], textR, 0);
    }
    ctx.restore();
  }
  ctx.restore(); // end wheel rotation

  // ── Center hub ──
  const grad = ctx.createRadialGradient(center, center, 0, center, center, radius * 0.12);
  grad.addColorStop(0, '#fff');
  grad.addColorStop(1, '#f3f0ff');
  ctx.beginPath();
  ctx.arc(center, center, radius * 0.1, 0, 2 * Math.PI);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#d4d0e0';
  ctx.lineWidth = 2;
  ctx.stroke();

  // ── Pointer (triangle at 12-o'clock, OUTSIDE rotation) ──
  const ps = 16;
  ctx.beginPath();
  ctx.moveTo(center, 8);
  ctx.lineTo(center - ps, -6);
  ctx.lineTo(center + ps, -6);
  ctx.closePath();
  ctx.fillStyle = '#7c3aed';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ── Given a rotation angle, return which segment index is at the pointer ──
function segmentAtPointer(angle, count) {
  // Pointer is at 12 o'clock. Segment i spans [i*arc, (i+1)*arc] from 12 o'clock.
  // After rotating by `angle`, the segment at the pointer is:
  //   i = floor( (-angle mod 2PI) / arc )
  const arc = (2 * Math.PI) / count;
  const negAngle = ((-angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return Math.floor(negAngle / arc) % count;
}

// ── Component ───────────────────────────────────────────
export default function WheelCanvas({ names, targetIndex, spinning, onSpinEnd }) {
  const canvasRef = useRef(null);
  const animIdRef = useRef(null);
  const angleRef = useRef(0);
  const dprRef = useRef(1);
  const sizeRef = useRef(0);

  // Always keep latest callback in a ref (never a dependency)
  const onSpinEndRef = useRef(onSpinEnd);
  onSpinEndRef.current = onSpinEnd;

  // Keep latest names in a ref for the animation closure
  const namesRef = useRef(names);
  namesRef.current = names;

  // ── Sizing helper ──
  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const container = canvas.parentElement;
    const size = Math.min(container.clientWidth, container.clientHeight, 400);
    if (size <= 0) return false;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    dprRef.current = dpr;
    sizeRef.current = size;
    return true;
  };

  // ── Draw at current angle ──
  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.scale(dprRef.current, dprRef.current);
    drawWheel(ctx, sizeRef.current, namesRef.current, angleRef.current);
    ctx.restore();
  };

  // ── Initial draw + resize ──
  useEffect(() => {
    // Reset angle when names change
    angleRef.current = 0;

    const handleResize = () => {
      if (setupCanvas()) redraw();
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [names]);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Spin animation (completely self-contained, no React state) ──
  useEffect(() => {
    if (!spinning || targetIndex == null || names.length === 0) return;

    // Cancel any lingering animation
    if (animIdRef.current) cancelAnimationFrame(animIdRef.current);

    // Make sure canvas is set up
    setupCanvas();

    const n = names.length;
    const arc = (2 * Math.PI) / n;

    // ── Landing angle calculation ──
    // Segment i's center is at (i+0.5)*arc clockwise from 12-o'clock.
    // To bring segment i's center to the pointer (12-o'clock), rotate by:
    //   2*PI - (i+0.5)*arc
    // This value is always in (0, 2*PI) for valid indices.
    const landing = 2 * Math.PI - (targetIndex + 0.5) * arc;

    // Full spins (5–8) + landing offset
    const fullSpins = (5 + Math.random() * 3) * 2 * Math.PI;
    const totalAngle = fullSpins + landing;

    // Always start from angle 0
    angleRef.current = 0;

    const duration = 4500;
    const t0 = performance.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      const progress = Math.min((now - t0) / duration, 1);
      const eased = easeOut(progress);

      if (progress < 1) {
        // Mid-animation: interpolate
        angleRef.current = totalAngle * eased;
        redraw();
        animIdRef.current = requestAnimationFrame(tick);
      } else {
        // ── Final frame: force exact landing angle ──
        angleRef.current = landing;
        redraw();

        // Read which segment is actually at the pointer
        const landed = segmentAtPointer(landing, n);

        console.log(
          '[Wheel] target:', targetIndex, `"${namesRef.current[targetIndex]}"`,
          '| landed:', landed, `"${namesRef.current[landed]}"`,
          '| angle:', landing.toFixed(6)
        );

        if (onSpinEndRef.current) onSpinEndRef.current(landed);
      }
    };

    animIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, [spinning, targetIndex, names]); // eslint-disable-line react-hooks/exhaustive-deps

  if (names.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        אין ילדים זמינים
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center w-full h-full">
      <canvas ref={canvasRef} className="max-w-full max-h-full" />
    </div>
  );
}
