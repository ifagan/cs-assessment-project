import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Auth() {
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) {
      alert(error.message);
    } else {
      alert('Check your email for the login link!');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md card">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          CommunityShare assessment task management app
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Sign in via magic link with your email below
        </p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Your email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              className="form-input placeholder-gray-400"
            />
          </div>
          <div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Loading…' : 'Send magic link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
