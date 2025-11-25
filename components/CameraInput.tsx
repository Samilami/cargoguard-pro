import React, { useRef } from 'react';
import { Camera, ImagePlus } from 'lucide-react';

interface CameraInputProps {
  onCapture: (dataUrl: string) => void;
  label?: string;
  className?: string;
}

const CameraInput: React.FC<CameraInputProps> = ({ onCapture, label = "Foto aufnehmen", className = "" }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onCapture(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={inputRef}
        onChange={handleFileChange}
        aria-label={label}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-brand-500 bg-brand-50 dark:bg-brand-900/20 rounded-xl text-brand-700 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors gap-2"
      >
        <Camera className="w-8 h-8" />
        <span className="font-semibold">{label}</span>
      </button>
    </div>
  );
};

export default CameraInput;