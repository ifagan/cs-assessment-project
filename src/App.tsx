import './App.css';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import Auth from './Auth';
import { useSession } from './SessionContext';

function App() {
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) {
      navigate('/tasks'); // ✅ redirect logged in users
    }
  }, [session, loading, navigate]);

  return (
    <div className="container" style={{ padding: '50px 0 100px 0' }}>
      {!session ? <Auth /> : null}
    </div>
  );
}

export default App;
