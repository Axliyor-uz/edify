'use client'; // This must be a Client Component because it uses React Hooks

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

// 1. Create the context with default empty values
const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

// 2. Create the Provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This listener fires whenever the user logs in or out
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children} 
    </AuthContext.Provider>
  );
};

// 3. Create a custom hook for easy access
export const useAuth = () => useContext(AuthContext);