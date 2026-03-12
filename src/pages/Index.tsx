import Landing from '@/pages/Landing';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  // In early access mode — always show landing, no login redirect
  return <Landing />;
}
