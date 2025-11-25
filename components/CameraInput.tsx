import React, { useRef, useState } from 'react';
import { Camera, ImagePlus } from 'lucide-react';

interface CameraInputProps {
  onCapture: (dataUrl: string) => void;
  label?: string;
  className?: string;
}

const CameraInput: React.FC<CameraInputProps> = ({ onCapture, label = "Foto aufnehmen", className = "" }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const requestCameraPermission = async () => {
    try {
      // Versuche explizit Kamera-Berechtigung anzufordern (für iOS Safari)
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        // Stoppe Stream sofort wieder (wir nutzen nur das File Input)
        stream.getTracks().forEach(track => track.stop());
        setPermissionDenied(false);
      }
    } catch (err) {
      console.warn('Kamera-Berechtigung:', err);
      // Auch bei Fehler fortfahren - File Input könnte trotzdem funktionieren
      setPermissionDenied(true);
    }
  };

  const handleClick = async () => {
    // Bei erstem Klick Berechtigung anfragen
    await requestCameraPermission();
    // Dann File Input öffnen
    inputRef.current?.click();
  };

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
        onClick={handleClick}
        className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-brand-500 bg-brand-50 dark:bg-brand-900/20 rounded-xl text-brand-700 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors gap-2"
      >
        <Camera className="w-8 h-8" />
        <span className="font-semibold">{label}</span>
        {permissionDenied && (
          <span className="text-xs text-red-600 dark:text-red-400 mt-1">
            Bitte erlauben Sie Kamera-Zugriff in den Einstellungen
          </span>
        )}
      </button>
    </div>
  );
};

export default CameraInput;