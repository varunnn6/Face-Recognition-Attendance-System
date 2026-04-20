// src/services/faceService.js
// Natively leverages FaceAPI.js loaded globally from CDN to extract biometric descriptors.

// Use the public models hosted securely on GitHub.
const MODEL_URL = 'https://cdn.jsdelivr.net/gh/vladmandic/face-api@master/model/';

let modelsLoaded = false;

export const loadModels = async () => {
  if (modelsLoaded) return;
  // Make sure faceapi is loaded from CDN
  let attempts = 0;
  while (!window.faceapi && attempts < 20) {
    await new Promise(r => setTimeout(r, 100)); // wait 100ms
    attempts++;
  }
  
  if (!window.faceapi) {
    throw new Error("CRITICAL: face-api.js script missing or blocked by network.");
  }

  try {
    await Promise.all([
      window.faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
    modelsLoaded = true;
  } catch (error) {
    console.error("Failed to load FaceAPI models:", error);
    throw new Error("Could not initialize biometric AI models.");
  }
};

/**
 * Extracts a 128-dimensional Float32 biometric descriptor from a Base64 image.
 */
export const extractFaceDescriptor = async (base64Image) => {
  await loadModels();
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Image;
    img.onload = async () => {
      try {
        const detection = await window.faceapi
          .detectSingleFace(img, new window.faceapi.SsdMobilenetv1Options({ minConfidence: 0.2 }))
          .withFaceLandmarks()
          .withFaceDescriptor();
          
        if (!detection) {
          return resolve(null);
        }
        resolve(Array.from(detection.descriptor)); // Convert Float32Array to standard array for Firestore
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Failed to load image for extraction"));
  });
};

/**
 * Compares a live descriptor against a known, stored descriptor array.
 * Threshold is strictness: 0.43 is very strict, 0.5 is standard.
 */
export const compareFaces = (liveDescriptor, storedDescriptor, threshold = 0.45) => {
  try {
    if (!liveDescriptor || !storedDescriptor) return { match: false, distance: 1.0, confidence: 0 };
    
    const live = new Float32Array(liveDescriptor);
    const stored = new Float32Array(storedDescriptor);
    
    const distance = window.faceapi.euclideanDistance(live, stored);
    return {
      match: distance < threshold,
      distance,
      confidence: Math.max(0, 1 - distance)
    };
  } catch (err) {
    console.error("Comparison Error:", err);
    return { match: false, distance: 1.0, confidence: 0 };
  }
};
