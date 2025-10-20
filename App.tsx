import React, { useState, useCallback } from 'react';
import { AppState } from './types';
import { OUTLET_CODES } from './constants';
import { submitReport } from './services/reportingService';
import Camera from './components/Camera';
import { CameraIcon, CheckCircleIcon, ArrowPathIcon, PaperAirplaneIcon, ExclamationCircleIcon, XCircleIcon } from './components/icons';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SELECT_OUTLET);
  const [selectedOutlet, setSelectedOutlet] = useState<string>('');
  const [pseudoImages, setPseudoImages] = useState<string[]>([]);
  const [fridgeImage, setFridgeImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageForPreview, setImageForPreview] = useState<string | null>(null);

  const handleCapture = useCallback((imageDataUrl: string) => {
    setImageForPreview(imageDataUrl);
  }, []);

  const handleConfirmPreview = () => {
    if (!imageForPreview) return;

    if (appState === AppState.PSEUDO_CAPTURE) {
      setPseudoImages(prev => [...prev, imageForPreview]);
    } else if (appState === AppState.FRIDGE_CAPTURE) {
      setFridgeImage(imageForPreview);
      setAppState(AppState.CONFIRMATION);
    }
    setImageForPreview(null);
  };

  const handleRetake = () => {
    setImageForPreview(null);
  };
  
  const handleRemovePseudoImage = (indexToRemove: number) => {
    setPseudoImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleCameraError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setAppState(AppState.ERROR);
  }, []);

  const handleSubmit = async () => {
    if (selectedOutlet && pseudoImages.length > 0 && fridgeImage) {
      setAppState(AppState.SUBMITTING);
      try {
        const result = await submitReport({
          outletCode: selectedOutlet,
          pseudoImages,
          fridgeImage
        });
        if (result.success) {
          setAppState(AppState.SUCCESS);
        } else {
          setError('Failed to submit the report. The server responded with an error.');
          setAppState(AppState.ERROR);
        }
      } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unexpected error occurred during submission.');
        }
        setAppState(AppState.ERROR);
      }
    }
  };

  const handleReset = () => {
    setAppState(AppState.SELECT_OUTLET);
    setSelectedOutlet('');
    setPseudoImages([]);
    setFridgeImage(null);
    setError(null);
    setImageForPreview(null);
  };

  const renderContent = () => {
    switch (appState) {
      case AppState.SELECT_OUTLET:
        return (
          <div className="w-full max-w-md p-8 bg-slate-800 rounded-xl shadow-2xl space-y-6 animate-fade-in">
            <h1 className="text-3xl font-bold text-center text-sky-400">Daily Photo Upload</h1>
            <p className="text-center text-slate-400">Step 1: Select your outlet code to begin.</p>
            <div className="space-y-4">
              <select
                value={selectedOutlet}
                onChange={(e) => setSelectedOutlet(e.target.value)}
                className="w-full p-3 bg-slate-900 border-2 border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="" disabled>-- Select Outlet Code --</option>
                {OUTLET_CODES.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
              <button
                onClick={() => setAppState(AppState.PSEUDO_CAPTURE)}
                disabled={!selectedOutlet}
                className="w-full flex justify-center items-center gap-2 p-3 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              >
                Continue
              </button>
            </div>
          </div>
        );

      case AppState.PSEUDO_CAPTURE:
        return imageForPreview ? (
            <div className="w-full max-w-lg p-4 sm:p-6 bg-slate-800 rounded-xl shadow-2xl space-y-4 animate-fade-in">
                <h2 className="text-2xl font-bold text-center text-sky-400">Photo Preview</h2>
                <img src={imageForPreview} alt="Preview" className="rounded-lg w-full aspect-video object-cover border-2 border-slate-700" />
                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-700">
                    <button onClick={handleRetake} className="w-full flex justify-center items-center gap-2 p-3 bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-500 transition-colors duration-200">
                        <ArrowPathIcon className="w-5 h-5" />
                        Retake
                    </button>
                    <button onClick={handleConfirmPreview} className="w-full flex justify-center items-center gap-2 p-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition-colors duration-200">
                        <CheckCircleIcon className="w-5 h-5" />
                        Keep Photo
                    </button>
                </div>
            </div>
        ) : (
            <div className="w-full max-w-lg mx-auto flex flex-col items-center space-y-4 animate-fade-in">
                <div className="text-center mb-2">
                    <h2 className="text-2xl font-bold text-sky-400">Step 2: Pseudo Records</h2>
                    <p className="text-slate-400">(Required) Take at least one photo.</p>
                </div>
                <Camera onCapture={handleCapture} onCameraError={handleCameraError} />
                <div className="w-full bg-slate-800 p-2 sm:p-4 rounded-xl shadow-lg">
                    <div className="flex justify-between items-center mb-2 px-2">
                      <h3 className="text-lg font-semibold">Captured Photos</h3>
                      <span className="text-sm font-medium bg-sky-600 text-sky-50 rounded-full px-3 py-1 shadow-md">
                          {pseudoImages.length} {pseudoImages.length === 1 ? 'photo' : 'photos'}
                      </span>
                    </div>
                    {pseudoImages.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {pseudoImages.map((image, index) => (
                        <div key={index} className="relative group">
                            <img src={image} alt={`Capture ${index + 1}`} className="w-full aspect-square object-cover rounded-md" />
                            <button
                            onClick={() => handleRemovePseudoImage(index)}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                            aria-label={`Remove photo ${index + 1}`}
                            >
                            <XCircleIcon className="w-6 h-6" />
                            </button>
                        </div>
                        ))}
                    </div>
                    ) : (
                    <p className="text-slate-400 text-center py-4">No photos taken yet.</p>
                    )}
                    <div className="flex gap-4 mt-4">
                        <button
                            onClick={() => setAppState(AppState.FRIDGE_CAPTURE)}
                            disabled={pseudoImages.length === 0}
                            className="w-full p-3 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200"
                        >
                        Next Step
                        </button>
                    </div>
                </div>
            </div>
        );

      case AppState.FRIDGE_CAPTURE:
         return imageForPreview ? (
            <div className="w-full max-w-lg p-4 sm:p-6 bg-slate-800 rounded-xl shadow-2xl space-y-4 animate-fade-in">
                <h2 className="text-2xl font-bold text-center text-sky-400">Fridge Photo Preview</h2>
                <img src={imageForPreview} alt="Fridge Preview" className="rounded-lg w-full aspect-video object-cover border-2 border-slate-700" />
                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-700">
                    <button onClick={handleRetake} className="w-full flex justify-center items-center gap-2 p-3 bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-500 transition-colors duration-200">
                        <ArrowPathIcon className="w-5 h-5" />
                        Retake
                    </button>
                    <button onClick={handleConfirmPreview} className="w-full flex justify-center items-center gap-2 p-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition-colors duration-200">
                        <CheckCircleIcon className="w-5 h-5" />
                        Confirm & Continue
                    </button>
                </div>
            </div>
         ) : (
            <div className="w-full max-w-lg mx-auto flex flex-col items-center space-y-4 animate-fade-in">
                <div className="text-center mb-2">
                    <h2 className="text-2xl font-bold text-sky-400">Step 3: Fridge Record</h2>
                    <p className="text-slate-400">(Required) Take a single photo of the fridge.</p>
                </div>
                <Camera onCapture={handleCapture} onCameraError={handleCameraError} />
            </div>
         );

      case AppState.CONFIRMATION:
        return (
          <div className="w-full max-w-lg p-4 sm:p-6 bg-slate-800 rounded-xl shadow-2xl space-y-4 animate-fade-in">
             <h2 className="text-2xl font-bold text-center text-sky-400">Step 4: Confirm & Submit</h2>
             <p className="text-center text-slate-400">Review your photos for outlet {selectedOutlet}.</p>
             
             <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-300 border-b border-slate-700 pb-1 mb-2">Pseudo Records</h3>
                    {pseudoImages.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 bg-slate-900/50 rounded-lg">
                            {pseudoImages.map((image, index) => (
                                <img key={index} src={image} alt={`Pseudo Preview ${index + 1}`} className="rounded-lg w-full aspect-square object-cover" />
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-400 text-center p-4 bg-slate-900/50 rounded-lg">Skipped</p>
                    )}
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-300 border-b border-slate-700 pb-1 mb-2">Fridge Record</h3>
                    {fridgeImage && <img src={fridgeImage} alt="Fridge Preview" className="rounded-lg w-full aspect-video object-cover" />}
                </div>
             </div>
             
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-700">
              <button
                onClick={handleReset}
                className="w-full flex justify-center items-center gap-2 p-3 bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-500 transition-colors duration-200"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Start Over
              </button>
              <button
                onClick={handleSubmit}
                className="w-full flex justify-center items-center gap-2 p-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition-colors duration-200"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
                Submit Report
              </button>
            </div>
          </div>
        );

      case AppState.SUBMITTING:
        return (
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="w-16 h-16 border-4 border-t-sky-500 border-slate-600 rounded-full animate-spin"></div>
            <h2 className="text-2xl font-semibold">Submitting Report...</h2>
            <p className="text-slate-400">Please wait a moment.</p>
          </div>
        );

      case AppState.SUCCESS:
        return (
          <div className="w-full max-w-md p-8 bg-slate-800 rounded-xl shadow-2xl space-y-4 text-center animate-fade-in">
            <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto" />
            <h2 className="text-3xl font-bold">Upload Successful!</h2>
            <p className="text-slate-400">Your daily photos for outlet {selectedOutlet} have been recorded.</p>
            <button
              onClick={handleReset}
              className="w-full p-3 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-500 transition-colors duration-200"
            >
              Upload Another
            </button>
          </div>
        );
      
      case AppState.ERROR:
        const isConfigError = error?.includes('Backend is not configured');
        return (
            <div className="w-full max-w-md p-8 bg-slate-800 rounded-xl shadow-2xl space-y-4 text-center animate-fade-in">
                <ExclamationCircleIcon className="w-20 h-20 text-red-500 mx-auto" />
                <h2 className="text-3xl font-bold">An Error Occurred</h2>
                <p className="text-red-300 bg-red-900/50 p-3 rounded-lg">{error}</p>
                {isConfigError && (
                    <div className="text-sm text-left text-slate-300 bg-slate-700/50 p-3 rounded-lg">
                        <p className="font-bold mb-2">How to fix this:</p>
                        <p>It looks like the app's backend is not set up. Please follow the instructions provided previously to:</p>
                        <ol className="list-decimal list-inside mt-2 space-y-1">
                            <li>Create a Google Apps Script.</li>
                            <li>Deploy it as a Web App.</li>
                            <li>Copy the deployed URL.</li>
                            <li>Paste the URL into the <code className="bg-slate-900 px-1 py-0.5 rounded text-sky-400 text-xs">WEB_APP_URL</code> constant in the <code className="bg-slate-900 px-1 py-0.5 rounded text-sky-400 text-xs">services/reportingService.ts</code> file.</li>
                        </ol>
                    </div>
                )}
                <button
                onClick={handleReset}
                className="w-full p-3 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-500 transition-colors duration-200"
                >
                Start Over
                </button>
            </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full">
        {renderContent()}
      </div>
    </main>
  );
};

export default App;
