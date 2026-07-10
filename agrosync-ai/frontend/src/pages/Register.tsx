import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Sprout } from 'lucide-react';
import { auth } from '../services/api';
import { setUser } from '../store/slices/authSlice';

export default function Register() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'farmer' | 'buyer'>('farmer');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth.sendOTP(email);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await auth.register({ name, email, phone, password, otp, role });
      dispatch(setUser({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken }));
      navigate(`/${data.user.role}/dashboard`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-primary items-center justify-center">
        <div className="text-center text-white px-12">
          <Sprout className="w-16 h-16 mx-auto mb-6" />
          <h1 className="font-heading text-4xl font-bold mb-4">Join AgroSync AI</h1>
          <p className="text-lg text-green-100">Empowering farmers with AI technology</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Sprout className="w-10 h-10 text-primary mx-auto mb-3 lg:hidden" />
            <h2 className="font-heading text-2xl font-bold">Create Account</h2>
            <p className="text-gray-500 mt-1">Step {step} of 2</p>
          </div>

          <form onSubmit={step === 1 ? sendOtp : handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-danger text-sm p-3 rounded-lg">{error}</div>}

            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">I am a</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setRole('farmer')}
                      className={`p-3 border rounded-lg text-center ${role === 'farmer' ? 'border-primary bg-primary-50 text-primary' : 'border-gray-300'} font-medium`}>
                      <Sprout className="w-5 h-5 mx-auto mb-1" /> Farmer
                    </button>
                    <button type="button" onClick={() => setRole('buyer')}
                      className={`p-3 border rounded-lg text-center ${role === 'buyer' ? 'border-primary bg-primary-50 text-primary' : 'border-gray-300'} font-medium`}>
                      <Sprout className="w-5 h-5 mx-auto mb-1" /> Buyer
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="bg-primary-50 p-4 rounded-lg text-sm text-primary-800 mb-4">
                  OTP sent to <strong>{email}</strong>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required maxLength={6}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-center text-2xl tracking-widest" placeholder="000000" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">
                  {loading ? 'Verifying...' : 'Create Account'}
                </button>
                <button type="button" onClick={() => setStep(1)}
                  className="w-full text-gray-500 py-2 text-sm hover:text-gray-700">Back</button>
              </>
            )}
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
