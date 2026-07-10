import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ArrowLeft } from 'lucide-react';
import { auth } from '../services/api';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth.forgotPassword(email);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth.resetPassword(email, otp, newPassword);
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-surface">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Sprout className="w-10 h-10 text-primary mx-auto mb-3" />
          <h2 className="font-heading text-2xl font-bold">Reset Password</h2>
        </div>

        {step === 1 && (
          <form onSubmit={sendOtp} className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
            {error && <div className="bg-red-50 text-danger text-sm p-3 rounded-lg">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
            <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-primary">
              <ArrowLeft className="w-3 h-3" /> Back to Login
            </Link>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={resetPassword} className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
            {error && <div className="bg-red-50 text-danger text-sm p-3 rounded-lg">{error}</div>}
            <div className="bg-primary-50 p-3 rounded-lg text-sm text-primary-800">
              OTP sent to <strong>{email}</strong>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">OTP</label>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required maxLength={6}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-center text-xl tracking-widest" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="bg-white p-6 rounded-xl border border-gray-200 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Sprout className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-heading font-semibold text-lg">Password Reset Successful</h3>
            <p className="text-gray-500 text-sm">You can now login with your new password.</p>
            <Link to="/login" className="inline-block bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700">
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
