import { Mail, MapPin, Phone, Send } from 'lucide-react';
import { useState } from 'react';

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="page fade-in" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div className="page-header" style={{ textAlign: 'center' }}>
        <p className="label-tag">CONTACT</p>
        <h1>Get in Touch</h1>
        <p>Have questions? We'd love to hear from you.</p>
      </div>

      <div className="grid-3" style={{ marginBottom: 'var(--space-xl)' }}>
        {[
          { icon: Mail, label: 'Email', value: 'support@faceattend.edu' },
          { icon: Phone, label: 'Phone', value: '+91 98765 43210' },
          { icon: MapPin, label: 'Address', value: 'Campus, India' },
        ].map((c, i) => (
          <div key={i} className="card-static" style={{ padding: 20, textAlign: 'center' }}>
            <c.icon size={22} style={{ color: 'var(--accent-primary)', marginBottom: 8 }} />
            <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>{c.label}</p>
            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="card-static" style={{ padding: 'var(--space-xl)' }}>
        {sent ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
            <Send size={36} style={{ color: 'var(--accent-primary)', marginBottom: 12 }} />
            <h3 style={{ fontWeight: 700 }}>Message Sent!</h3>
            <p style={{ color: 'var(--text-muted)' }}>We'll get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); setSent(true); }}>
            <div className="form-group">
              <label className="label">Name</label>
              <input className="input" placeholder="Your name" required />
            </div>
            <div className="form-group">
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="your@email.com" required />
            </div>
            <div className="form-group">
              <label className="label">Message</label>
              <textarea className="input" rows={4} placeholder="How can we help?" required style={{ resize: 'vertical' }} />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              <Send size={16} /> Send Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
