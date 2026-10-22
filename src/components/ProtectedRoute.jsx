import { useEffect } from 'react';
import { isLoggedIn } from '../utils/auth.js';

export default function ProtectedRoute({ children }) {
  const authenticated = isLoggedIn();

  useEffect(() => {
    if (!authenticated) window.location.replace('/admin/login');
  }, [authenticated]);

  return authenticated ? children : null;
}
