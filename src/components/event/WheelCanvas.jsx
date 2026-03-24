import { useRef, useEffect, useCallback, useState } from 'react';
import { getSegments, getTargetAngle, getColor, getFontSize } from '../../lib/wheelMath';

export default function WheelCanvas({ names, targetIndex, spinning, onSpinEnd }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const currentRotation = useRef(0);

  const draw = useCallback((ctx, size, rot) => {
    const center = size / 2;
    const radius = center - 10;
    const segments = getSegments(names);
    const fontSize = getFontSize(names.length, radius);

    ctx.clearRect(0, 0, size, size);
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
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.rotate(seg.midAngle);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${fontSize}px "Segoe UI", Tahoma, Arial, sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 2;

      const textX = radius * 0.85;
      ctx.fillText(seg.name, textX, 0);
      ctx.restore();
    });

    ctx.restore();

    // Draw center circle
    ctx.beginPath();
    ctx.arc(center, center, radius * 0.08, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw pointer (triangle at top)
    const pSize = 18;
    ctx.beginPath();
    ctx.moveTo(center, 6);
    ctx.lineTo(center - pSize, -4);
    ctx.lineTo(center + pSize, -4);
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
    const container = canvas.parentElement;
    const size = Math.min(container.clientWidth, 400);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    draw(ctx, size, currentRotation.current);
  }, [names, draw, rotation]);

  // Spin animation
  useEffect(() => {
    if (!spinning || targetIndex == null || names.length === 0) return;

    const totalAngle = getTargetAngle(targetIndex, names.length);
    const duration = 4500;
    const startTime = performance.now();
    const startRot = currentRotation.current;

    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOut(progress);
      const newRot = startRot + totalAngle * eased;

      currentRotation.current = newRot;
      setRotation(newRot);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        currentRotation.current = newRot % (2 * Math.PI);
        if (onSpinEnd) onSpinEnd();
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [spinning, targetIndex, names.length, onSpinEnd]);

  if (names.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        אין ילדים זמינים
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full">
      <canvas ref={canvasRef} className="max-w-full" />
    </div>
  );
}
