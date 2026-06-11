import React, { useEffect, useState } from 'react';
import { X, User, Phone, Mail, Calendar, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { useDb } from '../context/DbContext';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: { id: string; title: string; type: 'tour' | 'offer' } | null;
}

const EMPTY = { fullName: '', phone: '', email: '', preferredDate: '', preferredTime: '' };

export default function RegistrationModal({ isOpen, onClose, trip }: RegistrationModalProps) {
  const { addRegistration } = useDb();
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY);
      setDone(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !trip) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim() || !form.email.trim()) {
      setError('Please fill in your name, mobile number and email.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await addRegistration({
        tripId: trip.id,
        tripTitle: trip.title,
        tripType: trip.type,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        preferredDate: form.preferredDate,
        preferredTime: form.preferredTime,
      });
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const field = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#123da5] text-white px-6 py-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-black text-lg leading-tight">Register Now</h3>
            <p className="text-white/70 text-xs font-semibold mt-1 line-clamp-2">{trip.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/15 transition cursor-pointer shrink-0" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
            <h4 className="font-black text-lg text-slate-900">Registration received!</h4>
            <p className="text-sm text-gray-500 font-medium">
              Thank you, {form.fullName || 'traveler'}. Our team will contact you shortly to confirm your trip.
            </p>
            <button
              onClick={onClose}
              className="mt-2 bg-[#123da5] hover:bg-blue-800 text-white font-bold px-8 py-2.5 rounded-full text-sm transition cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={form.fullName} onChange={field('fullName')} required placeholder="Your full name"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123da5] text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Mobile Number *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={form.phone} onChange={field('phone')} required type="tel" placeholder="+20 1XX XXX XXXX"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123da5] text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={form.email} onChange={field('email')} required type="email" placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123da5] text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Preferred Date</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input value={form.preferredDate} onChange={field('preferredDate')} type="date"
                    className="w-full pl-9 pr-2 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123da5] text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Preferred Time</label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input value={form.preferredTime} onChange={field('preferredTime')} type="time"
                    className="w-full pl-9 pr-2 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123da5] text-sm" />
                </div>
              </div>
            </div>

            {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-slate-900 font-extrabold py-3 rounded-full text-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit Registration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
