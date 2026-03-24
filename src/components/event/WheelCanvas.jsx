import { useRef, useEffect, useCallback, useState } from 'react';
import { getSegments, getTargetAngle, getColor, getFontSize } from '../../lib/wheelMath';

export default function WheelCanvas({ names, targetIndex, spinning, onSpinEnd }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const currentRotation = useRef(0);

  const draw = useCallback((ctx, size, rot) => {
    const center = size / 2;
    const radius = center - 14;
    const segments = getSegments(names);
    const n = names.length;
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
      // Normalize angle to 0..2PI to determine if text is upside down
      const absAngle = ((seg.midAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const isBottom = absAngle > Math.PI / 2 && absAngle < (3 * Math.PI) / 2;

      if (isBottom) {
        // Flip 180° so text reads right-side-up
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
    <div className="flex justify-center items-center w-full h-full">
      <canvas ref={canvasRef} className="max-w-full max-h-full" />
    </div>
  );
}
