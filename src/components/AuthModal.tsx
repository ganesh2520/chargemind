import React, { useState } from 'react';
import { X, Lock, Mail, User, Zap } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password should be at least 6 characters.');
        return;
      }

      onLogin({
        name,
        email,
        role: 'EV Driver',
      });
      onClose();
    } else {
      if (!email.trim() || !password.trim()) {
        setError('Please fill in both email and password.');
        return;
      }
      onLogin({
        name: email.split('@')[0] || 'EV Driver',
        email,
        role: 'EV Driver',
      });
      onClose();
    }
  };

  const handleQuickDemo = (role: 'EV Driver' | 'Station Operator') => {
    if (role === 'EV Driver') {
      onLogin({
        name: 'Ganeshamanimoorthy B',
        email: 'ganeshamanimoorthy419@gmail.com',
        role: 'EV Driver',
      });
    } else {
      onLogin({
        name: 'Grid Operations Center',
        email: 'operator@greencharge.ai',
        role: 'Station Operator',
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl text-white">
        <div className="p-6 pb-4 border-b border-zinc-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-black">
              <Zap className="w-5 h-5 fill-black" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">GreenCharge AI Access</h3>
              <p className="text-xs text-zinc-400">Local demo session profile</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close auth modal"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentUser ? (
          <div className="p-6 space-y-5 text-center">
            <div className="w-14 h-14 rounded-xl bg-emerald-500/15 border border-emerald-500 mx-auto flex items-center justify-center text-emerald-400 font-bold text-xl">
              {currentUser.name[0]}
            </div>
            <div>
              <h4 className="font-bold text-lg text-white">{currentUser.name}</h4>
              <p className="text-xs text-zinc-400">{currentUser.email}</p>
              <span className="inline-block mt-2 text-xs font-mono text-emerald-400">
                {currentUser.role}
              </span>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onLogout}
                className="flex-1 bg-black hover:bg-zinc-900 text-rose-400 font-semibold py-2.5 px-4 rounded-lg border border-zinc-800 text-xs transition cursor-pointer"
              >
                Sign Out
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-white hover:bg-zinc-200 text-black font-semibold py-2.5 px-4 rounded-lg text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 p-1 bg-black rounded-lg border border-zinc-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`py-2 rounded transition cursor-pointer ${
                  mode === 'login' ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className={`py-2 rounded transition cursor-pointer ${
                  mode === 'signup' ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {mode === 'signup' && (
                <div>
                  <label className="text-zinc-300 block mb-1 font-medium">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ganeshamanimoorthy B"
                      className="w-full bg-black border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-zinc-300 block mb-1 font-medium">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="driver@example.com"
                    className="w-full bg-black border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-medium">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="text-zinc-300 block mb-1 font-medium">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 rounded-lg transition cursor-pointer mt-2"
              >
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="pt-3 border-t border-zinc-800 space-y-2">
              <span className="text-[11px] text-zinc-400 block text-center">
                Quick demo profiles:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('EV Driver')}
                  className="bg-black hover:bg-zinc-900 border border-zinc-800 py-2 px-2.5 rounded-lg text-zinc-200 hover:text-white transition cursor-pointer text-[11px]"
                >
                  Demo Driver
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('Station Operator')}
                  className="bg-black hover:bg-zinc-900 border border-zinc-800 py-2 px-2.5 rounded-lg text-zinc-200 hover:text-white transition cursor-pointer text-[11px]"
                >
                  Grid Operator
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
