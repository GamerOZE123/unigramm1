
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to the new auth page
    navigate('/auth', { replace: true });
  }, [navigate]);

  return null;
}
