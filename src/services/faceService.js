// src/services/faceService.js
// Uses face-api.js loaded via CDN script tag (window.faceapi)
// Models are bundled locally in /public/models/ for reliability

// Local models served from our own Vercel deployment (no CDN dependency)
const MODEL_URL = '/models';

let modelsLoaded = false;
let loadingPromise = null;

const waitForFaceAPI = () => new Promise((resolve, reject) => {
  let attempts = 0;
  const check = () => {
    if (window.faceapi) return resolve(window.faceapi);
    if (++attempts > 50) return reject(new Error('face-api.js not loaded from CDN script'));
    setTimeout(check, 100);
  };
  check();
});

export const loadModels = async () => {
  if (modelsLoaded) return;
  // Prevent parallel loads
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const faceapi = await waitForFaceAPI();
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
  })();

  return loadingPromise;
};

/**
 * Extract a 128-float biometric descriptor from a base64 image.
 * Returns null if no face is detected.
 */
export const extractFaceDescriptor = async (base64Image) => {
  await loadModels();
  const faceapi = window.faceapi;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      try {
        const detection = await faceapi
          .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.15 }))
          .withFaceLandmarks()
          .withFaceDescriptor();
        resolve(detection ? Array.from(detection.descriptor) : null);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = base64Image;
  });
};

/**
 * Compare a live descriptor against a stored descriptor.
 * threshold: lower = stricter. 0.5 is standard, 0.45 is strict.
 */
export const compareFaces = (liveDescriptor, storedDescriptor, threshold = 0.5) => {
  try {
    if (!liveDescriptor || !storedDescriptor) return { match: false, distance: 1.0, confidence: 0 };
    const live = new Float32Array(liveDescriptor);
    const stored = new Float32Array(storedDescriptor);
    const distance = window.faceapi.euclideanDistance(live, stored);
    return {
      match: distance < threshold,
      distance,
      confidence: Math.max(0, Math.round((1 - distance) * 100)),
    };
  } catch (err) {
    console.error('compareFaces error:', err);
    return { match: false, distance: 1.0, confidence: 0 };
  }
};
