"""
FaceAttend Python Backend
Uses dlib-based face_recognition (99.38% accuracy on LFW benchmark)
for real face verification and attendance marking.

Run with:
    cd backend
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
"""

import os
import json
import base64
import pickle
import logging
from io import BytesIO
from pathlib import Path

import numpy as np
import face_recognition
from PIL import Image
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# ─────────────────────────────────────────────────────────
# Setup
# ─────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("faceattend")

app = FastAPI(title="FaceAttend API", version="2.0.0")

# Allow requests from the React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Storage directories
DATA_DIR = Path("data")
ENCODINGS_DIR = DATA_DIR / "encodings"
ENCODINGS_DIR.mkdir(parents=True, exist_ok=True)

# In-memory cache of all known face encodings (reloads from disk on startup)
known_encodings: dict[str, np.ndarray] = {}


# ─────────────────────────────────────────────────────────
# Startup: Load all existing face encodings from disk
# ─────────────────────────────────────────────────────────
@app.on_event("startup")
def load_encodings():
    global known_encodings
    for enc_file in ENCODINGS_DIR.glob("*.pkl"):
        student_id = enc_file.stem
        with open(enc_file, "rb") as f:
            known_encodings[student_id] = pickle.load(f)
    logger.info(f"Loaded encodings for {len(known_encodings)} students")


# ─────────────────────────────────────────────────────────
# Utility: decode base64 image → numpy array
# ─────────────────────────────────────────────────────────
def decode_image(b64_string: str) -> np.ndarray:
    """Accepts data:image/jpeg;base64,... OR raw base64 string."""
    if "," in b64_string:
        b64_string = b64_string.split(",", 1)[1]
    raw = base64.b64decode(b64_string)
    image = Image.open(BytesIO(raw)).convert("RGB")
    return np.array(image)


# ─────────────────────────────────────────────────────────
# Models
# ─────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    studentId: str
    studentName: str
    # List of base64-encoded photos (up to 100 frames)
    photos: List[str]


class RecognizeRequest(BaseModel):
    # The logged-in student's ID — we only check against THIS student's encoding
    studentId: str
    studentName: str
    # A single base64-encoded live webcam frame
    frame: str


class RecognizeResponse(BaseModel):
    verified: bool
    confidence: float  # 0.0 – 1.0
    message: str


# ─────────────────────────────────────────────────────────
# POST /api/register_face
# Called when admin captures 100 training photos for a student
# ─────────────────────────────────────────────────────────
@app.post("/api/register_face")
async def register_face(req: RegisterRequest):
    logger.info(f"Registering face for {req.studentName} ({req.studentId}) — {len(req.photos)} photos")

    all_encodings = []
    failed = 0

    for i, photo_b64 in enumerate(req.photos):
        try:
            img_array = decode_image(photo_b64)
            # face_recognition auto-detects face locations, then encodes
            # model="large" uses a deeper CNN for better accuracy
            locs = face_recognition.face_locations(img_array, model="hog")
            if not locs:
                failed += 1
                continue
            encodings = face_recognition.face_encodings(img_array, locs, num_jitters=1, model="large")
            if encodings:
                all_encodings.append(encodings[0])
        except Exception as e:
            logger.warning(f"Photo {i} failed: {e}")
            failed += 1

    if not all_encodings:
        raise HTTPException(status_code=400, detail="No faces detected in any of the provided photos. Please ensure the student's face is clearly visible.")

    # Average all encodings into one robust "mean encoding"
    mean_encoding = np.mean(all_encodings, axis=0)

    # Persist to disk
    enc_path = ENCODINGS_DIR / f"{req.studentId}.pkl"
    with open(enc_path, "wb") as f:
        pickle.dump(mean_encoding, f)

    # Update in-memory cache
    known_encodings[req.studentId] = mean_encoding

    return {
        "success": True,
        "studentId": req.studentId,
        "photosProcessed": len(all_encodings),
        "photosFailed": failed,
        "message": f"Face registered successfully using {len(all_encodings)} photos."
    }


# ─────────────────────────────────────────────────────────
# POST /api/recognize_face
# Called live during student "Mark Attendance"
# ONLY checks the logged-in student's registered face — no cross-matching
# ─────────────────────────────────────────────────────────
@app.post("/api/recognize_face", response_model=RecognizeResponse)
async def recognize_face(req: RecognizeRequest):
    logger.info(f"Recognition attempt for {req.studentName} ({req.studentId})")

    # 1. Check if this student has a registered face encoding
    if req.studentId not in known_encodings:
        raise HTTPException(
            status_code=404,
            detail=f"No registered face found for student '{req.studentName}' (ID: {req.studentId}). Please capture training photos first."
        )

    known_enc = known_encodings[req.studentId]

    # 2. Decode the incoming live webcam frame
    try:
        frame = decode_image(req.frame)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image frame: {e}")

    # 3. Detect face in the live frame
    face_locs = face_recognition.face_locations(frame, model="hog")
    if not face_locs:
        return RecognizeResponse(
            verified=False,
            confidence=0.0,
            message="No face detected in frame. Please look directly at the camera."
        )

    if len(face_locs) > 1:
        return RecognizeResponse(
            verified=False,
            confidence=0.0,
            message="Security Error: Multiple faces detected. Please ensure only you are in the frame."
        )

    # Check face size to ensure the user is close enough to the camera
    top, right, bottom, left = face_locs[0]
    face_area = (bottom - top) * (right - left)
    image_area = frame.shape[0] * frame.shape[1]
    if face_area < (image_area * 0.05): # Face takes up less than 5% of the frame
        return RecognizeResponse(
            verified=False,
            confidence=0.0,
            message="Face is too far from the camera. Please move closer."
        )

    # 4. Extract encoding from the live frame
    # Using 'large' model and num_jitters=2 for robust encoding extraction
    live_encodings = face_recognition.face_encodings(frame, face_locs, num_jitters=2, model="large")
    if not live_encodings:
        return RecognizeResponse(
            verified=False,
            confidence=0.0,
            message="Could not extract face features. Please improve lighting."
        )

    live_enc = live_encodings[0]

    # 5. Compare ONLY against the logged-in student's stored encoding
    distance = face_recognition.face_distance([known_enc], live_enc)[0]
    confidence = round(float(1.0 - distance), 4)

    # Stricter threshold for production level (was 0.50, now 0.45 threshold means stricter match)
    THRESHOLD = 0.43  

    if distance <= THRESHOLD:
        logger.info(f"✅ Verified: {req.studentName} — distance={distance:.4f}, confidence={confidence:.4f}")
        return RecognizeResponse(
            verified=True,
            confidence=confidence,
            message=f"Identity verified! ({int((1 - distance/0.6) * 100)}% Match)"
        )
    else:
        logger.warning(f"❌ Rejected: {req.studentName} — distance={distance:.4f}, confidence={confidence:.4f}")
        return RecognizeResponse(
            verified=False,
            confidence=confidence,
            message="Face does not match your registered profile according to strict security protocols. If this is you, please ensure good lighting."
        )


# ─────────────────────────────────────────────────────────
# GET /api/status
# Health check
# ─────────────────────────────────────────────────────────
@app.get("/api/status")
def status():
    return {
        "status": "running",
        "registered_students": len(known_encodings),
        "student_ids": list(known_encodings.keys())
    }


# ─────────────────────────────────────────────────────────
# DELETE /api/face/{student_id}
# Delete a student's registered face (e.g., when student is deleted from admin)
# ─────────────────────────────────────────────────────────
@app.delete("/api/face/{student_id}")
def delete_face(student_id: str):
    enc_path = ENCODINGS_DIR / f"{student_id}.pkl"
    if enc_path.exists():
        enc_path.unlink()
        known_encodings.pop(student_id, None)
        return {"success": True, "message": f"Face encoding for {student_id} deleted."}
    raise HTTPException(status_code=404, detail="No encoding found for this student ID.")
