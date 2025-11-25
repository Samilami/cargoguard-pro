import React, { useRef, useEffect, useState } from 'react';

interface SignaturePadProps {
  onEnd: (dataUrl: string) => void;
  onClear: () => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onEnd, onClear }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to match parent width
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = 200; // Fixed height for signature area
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = (event as React.MouseEvent).clientX;
      clientY = (event as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling on touch
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx?.lineTo(x, y);
    ctx?.stroke();
    if (!hasSignature) setHasSignature(true);
  };

  const endDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      onEnd(canvasRef.current.toDataURL());
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
      onClear();
    }
  };

  return (
    <div className="w-full">
      {/* Container keeps white background for contrast with black ink, but border adapts to dark mode */}
      <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg bg-white touch-none overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          className="w-full h-[200px] cursor-crosshair block"
        />
      </div>
      <div className="mt-2 flex justify-between text-sm text-gray-500 dark:text-slate-400">
        <span>Bitte im Kasten unterschreiben</span>
        <button
          onClick={handleClear}
          type="button"
          className="text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium transition-colors"
        >
          Löschen
        </button>
      </div>
    </div>
  );
};

export default SignaturePad;