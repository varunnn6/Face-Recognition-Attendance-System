// Email Service — sends OTP emails via EmailJS (free, no backend needed)
// Setup: https://www.emailjs.com (free tier: 200 emails/month)
import emailjs from '@emailjs/browser';

// ⚠️ REPLACE THESE with your EmailJS credentials after setup
// See README in this file for instructions
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_442fh39';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_gd5tfks';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'K5ndcsUVve3QM6AIo';

let initialized = false;

function init() {
  if (!initialized && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    initialized = true;
  }
}

/**
 * Send OTP email to user
 * @param {string} toEmail - recipient email
 * @param {string} toName  - recipient name
 * @param {string} otp     - 6-digit OTP code
 * @returns {{ success: boolean, error?: string }}
 */
export async function sendOtpEmail(toEmail, toName, otp) {
  // If EmailJS not configured, silently skip (admin can still see OTP in Firebase)
  if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY' || EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID') {
    console.warn('EmailJS not configured. OTP available in Firebase → password_resets collection.');
    return { success: false, notConfigured: true };
  }

  try {
    init();
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: toEmail,
      to_name: toName,
      otp_code: otp,
      expires_in: '15 minutes',
      app_name: 'FaceAttend',
    });
    return { success: true };
  } catch (err) {
    console.error('EmailJS error:', err);
    return { success: false, error: err.text || err.message || 'Email send failed' };
  }
}

/**
 * Send Attendance Report email to student
 * @param {string} toEmail - recipient email
 * @param {string} toName  - recipient name
 * @param {Object} stats   - { total, attended, percentage, period }
 * @returns {{ success: boolean, error?: string }}
 */
export async function sendAttendanceEmail(toEmail, toName, stats) {
  if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY' || EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID') {
    return { success: false, notConfigured: true };
  }

  try {
    init();
    // Assuming a template for attendance exists, or we overload variables
    // In a real EmailJS setup, create a template with these variable names
    const ATTENDANCE_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_ATTENDANCE_TEMPLATE_ID || 'template_ccc0ujk'; 
    
    await emailjs.send(EMAILJS_SERVICE_ID, ATTENDANCE_TEMPLATE_ID, {
      to_email: toEmail,
      to_name: toName,
      total_classes: stats.total,
      attended_classes: stats.attended,
      attendance_percentage: stats.percentage,
      report_period: stats.period || 'All Time',
      app_name: 'FaceAttend',
    });
    return { success: true };
  } catch (err) {
    console.error('EmailJS attendance error:', err);
    return { success: false, error: err.text || err.message || 'Email send failed' };
  }
}
