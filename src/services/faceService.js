// src/services/faceService.js
// Face recognition using face-api.js (loaded from CDN as window.faceapi)
// Models are served locally from /public/models/

const MODEL_URL = '/models';

let modelsLoaded = false;
let loadingPromise = null;

// Wait for face-api.js CDN script to be ready on window
const waitForFaceAPI = () => new Promise((resolve, reject) => {
  let attempts = 0;
  const check = () => {
    if (window.faceapi) return resolve(window.faceapi);
    if (++attempts > 60) return reject(new Error('face-api.js CDN script did not load'));
    setTimeout(check, 100);
  };
  check();
});

export const loadModels = async () => {
  if (modelsLoaded) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const faceapi = await waitForFaceAPI();
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
    console.log('[FaceService] Models loaded from /models/');
  })();

  return loadingPromise;
};

/**
 * Extract a 128-float descriptor directly from an HTMLVideoElement or HTMLCanvasElement.
 * This is the MOST RELIABLE method — no base64 conversion needed.
 * Use this for live camera recognition.
 */
export const extractDescriptorFromElement = async (element) => {
  await loadModels();
  const faceapi = window.faceapi;
  const detection = await faceapi
    .detectSingleFace(element, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  return detection ? Array.from(detection.descriptor) : null;
};

/**
 * Extract a 128-float descriptor from a base64 image string.
 * Used for photo capture registration.
 */
export const extractFaceDescriptor = async (base64Image) => {
  await loadModels();
  const faceapi = window.faceapi;

  return new Promise((resolve) => {
    const img = new Image();
    // Do NOT set crossOrigin for data URLs — it breaks them
    img.onload = async () => {
      try {
        const detection = await faceapi
          .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.1 }))
          .withFaceLandmarks()
          .withFaceDescriptor();
        resolve(detection ? Array.from(detection.descriptor) : null);
      } catch (err) {
        console.error('[FaceService] extractFaceDescriptor error:', err);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = base64Image;
  });
};

/**
 * Compare a live descriptor against a stored descriptor.
 * Returns { match, distance, confidence }
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
    console.error('[FaceService] compareFaces error:', err);
    return { match: false, distance: 1.0, confidence: 0 };
  }
};
