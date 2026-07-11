import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { Settings as SettingsIcon, Lock, Mail, Shield, Loader2 } from 'lucide-react';
import { RootState } from '../store';
import { profile } from '../services/api';

export default function Settings() {
  const { user } = useSelector((s: RootState) => s.auth);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const changeMutation = useMutation({
    mutationFn: () => profile.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to change password');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    changeMutation.mutate();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account settings</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" /> Change Password
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-danger text-sm p-3 rounded-lg">{error}</div>}
            {changeMutation.isSuccess && (
              <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg">Password changed successfully</div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
            </div>

            <button type="submit" disabled={changeMutation.isPending}
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {changeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {changeMutation.isPending ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-primary" /> Account Information
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Role</p>
                <p className="font-medium capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
