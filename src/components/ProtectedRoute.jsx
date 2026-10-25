import { useEffect, useState } from 'react';
import { isAdminUser, observeAuthState, supabase } from '../services/supabase.ts';

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(supabase !== null);

  useEffect(() => {
    return observeAuthState((currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!isLoading && !isAdminUser(user)) window.location.replace('/admin/login');
  }, [isLoading, user]);

  if (isLoading || !isAdminUser(user)) return null;
  return children;
}
