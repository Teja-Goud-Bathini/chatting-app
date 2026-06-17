import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

export function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setToken, fetchMe } = useAuthStore();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      setToken(token);
      fetchMe().then(() => navigate('/'));
    } else {
      navigate('/login');
    }
  }, []);

  return <div className='flex items-center justify-center h-screen'>Signing you in...</div>;
}