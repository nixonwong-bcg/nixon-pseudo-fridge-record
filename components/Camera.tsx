import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ExclamationCircleIcon, CameraIcon } from './icons';

interface CameraProps {
  onCapture: (imageDataUrl: string) => void;
  onCameraError: (error: string) => void;
}

const Camera: React.FC<CameraProps> = ({ onCapture, onCameraError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanupCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    const enableCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' } // Prefer rear camera
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
        setHasCamera(true);
      } catch (err) {
        console.error("Error accessing camera:", err);
        setHasCamera(false);
        if (err instanceof Error) {
            if (err.name === "NotAllowedError") {
                onCameraError("Camera access was denied. Please allow camera access in your browser settings.");
            } else if (err.name === "NotFoundError") {
                onCameraError("No camera found. Please ensure a camera is connected and enabled.");
            } else {
                onCameraError(`An error occurred while accessing the camera: ${err.message}`);
            }
        } else {
            onCameraError("An unknown error occurred while accessing the camera.");
        }
      }
    };

    enableCamera();

    return () => {
      cleanupCamera();
    };
  }, [onCameraError, cleanupCamera]);

  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(dataUrl);
        // cleanupCamera(); // Removed to support multi-photo. Cleanup now happens on unmount.
      }
    }
  };

  if (!hasCamera) {
    return null; // The error is handled in the parent component
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center space-y-4">
      <div className="relative w-full aspect-video bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-700 shadow-lg">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 border-4 border-slate-900/30 rounded-lg pointer-events-none"></div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <button
        onClick={takePicture}
        className="w-20 h-20 bg-white rounded-full flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-sky-500 focus:ring-opacity-50 transition-transform duration-200 active:scale-90"
        aria-label="Take Photo"
      >
        <div className="w-18 h-18 bg-white rounded-full p-1 border-2 border-slate-800">
           <CameraIcon className="w-10 h-10 text-slate-800" />
        </div>
      </button>
    </div>
  );
};

export default Camera;
