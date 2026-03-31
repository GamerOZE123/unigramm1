import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Landing from '@/pages/Landing';

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;

    // Detect PKCE code param (password recovery flow)
    if (search && search.includes('code=')) {
      navigate(`/auth${search}${hash}`, { replace: true });
      return;
    }

    // Detect Supabase auth error/recovery hash fragments and redirect to /auth
    if (hash && (hash.includes('error=') || hash.includes('type=recovery') || hash.includes('access_token='))) {
      navigate(`/auth${hash}`, { replace: true });
    }
  }, [navigate]);

  return <Landing />;
}
