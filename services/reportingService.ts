// IMPORTANT: Follow the instructions to create a Google Apps Script and paste the deployed Web App URL here.
const WEB_APP_URL = 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

const cleanBase64 = (dataUrl: string) => dataUrl.split(',')[1];

export const submitReport = async (data: {
  outletCode: string;
  pseudoImages: string[];
  fridgeImage: string | null;
}): Promise<{ success: boolean }> => {
  if (!WEB_APP_URL || WEB_APP_URL.includes('PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE')) {
    console.error('Google Apps Script URL is not configured in services/reportingService.ts');
    throw new Error('Backend is not configured. Please set the WEB_APP_URL.');
  }
  
  console.log('Submitting report to Google Apps Script for:', data.outletCode);

  const payload = {
    outletCode: data.outletCode,
    pseudoImages: data.pseudoImages.map(cleanBase64),
    fridgeImage: data.fridgeImage ? cleanBase64(data.fridgeImage) : null
  };

  try {
    const response = await fetch(WEB_APP_URL, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Required for Apps Script simple POST
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    const result = await response.json();
    
    if (!response.ok || !result.success) {
      console.error('Submission failed:', result.message || 'Unknown error from backend');
      return { success: false };
    }
    
    console.log('Submission successful:', result.message);
    return { success: true };

  } catch (error) {
    console.error('Network or fetch error:', error);
    throw new Error('Failed to send data to the server. Check your network connection and the App Script URL.');
  }
};