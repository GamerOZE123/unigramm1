import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Landing from '@/pages/Landing';

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    // Detect Supabase auth error/recovery hash fragments and redirect to /auth
    const hash = window.location.hash;
    if (hash && (hash.includes('error=') || hash.includes('type=recovery') || hash.includes('access_token='))) {
      navigate(`/auth${hash}`, { replace: true });
    }
  }, [navigate]);

  return <Landing />;
}
