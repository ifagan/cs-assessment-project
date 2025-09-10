import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';

interface AccountProps {
  session: Session;
}

type Role = 'User' | 'Project manager' | 'Administrator';

export default function Account({ session }: AccountProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<Role>('User');

  useEffect(() => {
    let ignore = false;

    async function getProfile() {
      setLoading(true);
      const { user } = session;

      const { data, error } = await supabase
        .from('profiles')
        .select(`username, role`)
        .eq('id', user.id)
        .single();

      if (!ignore) {
        if (error) {
          console.warn(error);
        } else if (data) {
          setUsername(data.username);
          setRole(data.role as Role);
        }
      }

      setLoading(false);
    }

    getProfile();
    return () => {
      ignore = true;
    };
  }, [session]);

  async function updateProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    const { user } = session;

    const updates = {
      id: user.id,
      username,
      role,
      updated_at: new Date(),
    };

    const { error } = await supabase.from('profiles').upsert(updates);

    if (error) {
      alert(error.message);
    }

    setLoading(false);
  }

  return (
    <div className="w-full flex justify-center bg-gray-50 px-4 pt-4 pb-6">
      <form onSubmit={updateProfile} className="space-y-6 card max-w-md w-full">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="text"
            value={session.user.email}
            disabled
            className="form-input form-input-disabled"
          />
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            id="username"
            type="text"
            required
            value={username || ''}
            onChange={(e) => setUsername(e.target.value)}
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="form-input"
          >
            <option value="User">User</option>
            <option value="Project manager">Project manager</option>
            <option value="Administrator">Administrator</option>
          </select>
        </div>

        <div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Loading…' : 'Update'}
          </button>
        </div>

        <div>
          <button type="button" onClick={() => supabase.auth.signOut()} className="btn-secondary">
            Sign Out
          </button>
        </div>
      </form>
    </div>
  );
}
