
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    // Obscure the login URL — redirect /login to a 404 to discourage guessing.
    navigate('/not-found', { replace: true });
  }, [navigate]);

  return null;
}
