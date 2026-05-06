import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import emailjs from '@emailjs/nodejs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import dotenv from 'dotenv';

dotenv.config();

// ==========================================
// 1. FIREBASE SETUP
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDNqwhBsCwjU-w7KPubAYWs2CRAE-yu-2s",
  authDomain: "faceattend-a19ef.firebaseapp.com",
  projectId: "faceattend-a19ef",
  storageBucket: "faceattend-a19ef.firebasestorage.app",
  messagingSenderId: "1030476624116",
  appId: "1:1030476624116:web:4210929fc209ca4b396ea1",
  measurementId: "G-J5MTPM8TBL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Authenticate anonymously so we have permission to read the database
signInAnonymously(auth).then(() => {
  console.log('🔥 Connected to Firebase Database');
}).catch(err => {
  console.error('Firebase Auth Error:', err);
});

// ==========================================
// 2. EMAILJS SETUP
// ==========================================
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || 'service_442fh39'; // Default service ID
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || 'template_ccc0ujk';
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || 'K5ndcsUVve3QM6AIo';
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY || 'KXzEidGAtueKHHBiUuLoC'; // Add private key from EmailJS dashboard Account -> API Keys

// ==========================================
// 3. AUTOMATION LOGIC
// ==========================================

async function sendAutomatedEmails() {
  console.log('⏰ Running Automated Attendance Email Job...');
  try {
    // 1. Check automation settings
    const settingsRef = doc(db, 'settings', 'email_automation');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists() || settingsSnap.data().frequency === 'manual') {
      console.log('Automation is disabled or set to manual in Admin panel. Skipping.');
      return;
    }

    const frequency = settingsSnap.data().frequency; // 'daily', 'weekly', 'monthly'
    console.log(`Current automation schedule: ${frequency}`);

    // Wait, in a real production server, we would map the cron schedule directly to the frequency.
    // For this demonstration, we are simulating the trigger execution.

    // 2. Fetch all data
    console.log('Fetching students, sessions, and attendance data...');
    const studentsSnap = await getDocs(collection(db, 'students'));
    const sessionsSnap = await getDocs(collection(db, 'sessions'));
    const attendanceSnap = await getDocs(collection(db, 'attendance'));

    const students = studentsSnap.docs.map(d => d.data());
    const sessions = sessionsSnap.docs.map(d => d.data());
    const attendance = attendanceSnap.docs.map(d => d.data());

    // 3. Process and Send
    let successCount = 0;
    for (const student of students) {
      if (!student.email) continue;

      // Calculate simple stats
      const attendedCount = attendance.filter(a => a.studentId === student.studentId && a.status === 'Present').length;
      const totalCount = sessions.length > 0 ? sessions.length : 1;
      const percentage = Math.round((attendedCount / totalCount) * 100);

      console.log(`Sending email to ${student.name} (${student.email}) - ${percentage}%...`);

      try {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            to_email: student.email,
            to_name: student.name,
            total_classes: totalCount,
            attended_classes: attendedCount,
            attendance_percentage: percentage > 100 ? 100 : percentage,
            report_period: 'Automated ' + frequency + ' update'
          },
          {
            publicKey: EMAILJS_PUBLIC_KEY,
            privateKey: EMAILJS_PRIVATE_KEY, // Private key required for NodeJS EmailJS calls
          }
        );
        successCount++;
      } catch (emailErr) {
        console.error(`Failed to send to ${student.email}:`, emailErr.message || emailErr);
      }
    }

    console.log(`✅ Automated Job Complete. Sent ${successCount} emails.`);

  } catch (error) {
    console.error('Error during automated email job:', error);
  }
}

// ==========================================
// 4. CRON SCHEDULER & SERVER INIT
// ==========================================
const server = express();
server.use(cors());
server.use(express.json());

// Run at Midnight everyday
cron.schedule('0 0 * * *', () => {
  sendAutomatedEmails();
});

// A manual trigger endpoint for testing without waiting for midnight
server.post('/api/trigger-automation', async (req, res) => {
  await sendAutomatedEmails();
  res.json({ success: true, message: 'Automation triggered manually from server API.' });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 FaceAttend Backend Server running on http://localhost:${PORT}`);
  console.log('⏳ Cron Job scheduled for Midnight daily.');
});
