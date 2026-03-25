import { useRef, useEffect, useCallback, useState, memo } from 'react';
import { getSegments, getColor } from '../../lib/wheelMath';

function WheelCanvasInner({ names, targetIndex, spinning, onSpinEnd }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const currentRotation = useRef(0);
  const prevNamesKey = useRef('');
  // Use a ref for the callback so changing it doesn't restart the animation
  const onSpinEndRef = useRef(onSpinEnd);
  onSpinEndRef.current = onSpinEnd;

  // Reset rotation when the set of names changes
  const namesKey = names.join('|');
  if (namesKey !== prevNamesKey.current) {
    prevNamesKey.current = namesKey;
    currentRotation.current = 0;
  }

  const draw = useCallback((ctx, size, rot) => {
    const center = size / 2;
    const radius = center - 14;
    const segments = getSegments(names);
    const fontSize = Math.max(11, Math.min(18, radius * 0.09));

    ctx.clearRect(0, 0, size, size);

    // Draw outer ring shadow
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius + 6, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(124, 58, 237, 0.15)';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(rot);

    // Draw segments
    segments.forEach((seg, i) => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, seg.startAngle, seg.endAngle);
      ctx.closePath();
      ctx.fillStyle = getColor(i);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw text - flip if on the bottom half so it's always readable
      ctx.save();
      ctx.rotate(seg.midAngle);

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${fontSize}px "Segoe UI", Tahoma, Arial, sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      const textR = radius * 0.62;
      // Normalize the total angle (rotation + segment mid) to determine if text is upside down
      const totalAngle = rot + seg.midAngle;
      const absAngle = ((totalAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const isBottom = absAngle > Math.PI / 2 && absAngle < (3 * Math.PI) / 2;

      if (isBottom) {
        ctx.translate(textR, 0);
        ctx.rotate(Math.PI);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(seg.name, 0, 0);
      } else {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(seg.name, textR, 0);
      }
      ctx.restore();
    });

    ctx.restore();

    // Draw center circle with gradient
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

    // Draw pointer (triangle at top)
    const pSize = 16;
    ctx.beginPath();
    ctx.moveTo(center, 8);
    ctx.lineTo(center - pSize, -6);
    ctx.lineTo(center + pSize, -6);
    ctx.closePath();
    ctx.fillStyle = '#7c3aed';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [names]);

  // Resize and draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const render = () => {
      const container = canvas.parentElement;
      const size = Math.min(container.clientWidth, container.clientHeight, 400);
      if (size <= 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      draw(ctx, size, currentRotation.current);
    };

    render();
    window.addEventListener('resize', render);
    return () => window.removeEventListener('resize', render);
  }, [names, draw, rotation]);

  // Spin animation
  useEffect(() => {
    if (!spinning || targetIndex == null || names.length === 0) return;

    // Always start from 0 to avoid accumulated error
    currentRotation.current = 0;

    const n = names.length;
    const arcSize = (2 * Math.PI) / n;

    // The segment at index i has its center at clockwise angle (i+0.5)*arcSize from 12 o'clock.
    // To rotate the wheel so that segment lands at the top (pointer), we need:
    //   rotation = 2*PI - (i+0.5)*arcSize
    // This is always positive since (i+0.5)*arcSize < 2*PI for valid indices.
    const landingAngle = 2 * Math.PI - (targetIndex + 0.5) * arcSize;

    // Add full rotations for visual effect (5-8 full spins)
    const fullRotations = (5 + Math.random() * 3) * 2 * Math.PI;
    const totalAngle = fullRotations + landingAngle;

    const duration = 4500;
    const startTime = performance.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOut(progress);

      if (progress < 1) {
        const newRot = totalAngle * eased;
        currentRotation.current = newRot;
        setRotation(newRot);
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Force EXACT landing angle on final frame
        currentRotation.current = landingAngle;
        setRotation(landingAngle);

        // Reverse-compute which segment is actually at the pointer
        // With rotation R, segment i's center is at: (i+0.5)*arcSize - PI/2 + R
        // Pointer is at -PI/2, so we need (i+0.5)*arcSize + R ≡ 0 (mod 2PI)
        // i = ((2PI - R) / arcSize - 0.5) mod n
        const normRot = ((landingAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const rawIndex = Math.round((2 * Math.PI - normRot) / arcSize - 0.5);
        const actualIndex = ((rawIndex % n) + n) % n;

        console.log('[Wheel] target:', targetIndex, names[targetIndex],
          '| landed:', actualIndex, names[actualIndex],
          '| angle:', landingAngle.toFixed(4));

        // Pass the ACTUAL landed index back (use ref so this doesn't restart animation)
        if (onSpinEndRef.current) onSpinEndRef.current(actualIndex);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
    // NOTE: onSpinEnd is NOT in deps — we use onSpinEndRef to avoid restarting animation
  }, [spinning, targetIndex, names.length, names]);

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

// Memo prevents re-render when parent re-renders with same props
const WheelCanvas = memo(WheelCanvasInner);
export default WheelCanvas;
