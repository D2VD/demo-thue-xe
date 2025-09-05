// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthContext] useEffect mounting. Initializing...');
    setLoading(true);

    // Lắng nghe sự kiện thay đổi trạng thái xác thực
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log(`[AuthContext] onAuthStateChange triggered. Event: ${event}. Session available: ${!!currentSession}`);
        
        setSession(currentSession);

        if (!currentSession?.user) {
          console.log('[AuthContext] No user in session. Resetting state.');
          setUser(null);
setIsAdmin(false);
          if (loading) {
            console.log('[AuthContext] Initial check (no user) finished. Setting loading to false.');
            setLoading(false);
          }
          return;
        }

        try {
          console.log(`[AuthContext] Session found. Fetching profile for user: ${currentSession.user.id}`);
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentSession.user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            throw error;
          }
          
          if (profile) {
            console.log('[AuthContext] Profile fetched successfully:', profile);
            setUser({ ...currentSession.user, profile: profile });
            setIsAdmin(profile.role === 'admin');
          } else {
            console.warn(`[AuthContext] Profile not found for user ${currentSession.user.id}.`);
            setUser({ ...currentSession.user, profile: null });
            setIsAdmin(false);
          }
        } catch (e) {
          console.error('[AuthContext] CRITICAL: Failed to fetch profile.', e);
          setUser(null);
          setIsAdmin(false);
        } finally {
          if (loading) {
            console.log('[AuthContext] Initial auth flow finished. Setting loading to false.');
            setLoading(false);
          }
        }
      }
    );

    return () => {
      console.log('[AuthContext] useEffect cleanup. Unsubscribing from auth listener.');
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const refreshUserProfile = async () => {
    if (!session?.user) return;
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      setUser(prevUser => ({ ...prevUser, profile: profile }));
      setIsAdmin(profile?.role === 'admin');
      console.log('[AuthContext] User profile manually refreshed.');
    } catch (err) {
      console.error('[AuthContext] Error refreshing profile manually:', err);
    }
  };

  // *** ĐÂY LÀ PHẦN QUAN TRỌNG CẦN KIỂM TRA ***
  const value = {
    session,
    user,
    isAdmin,
    loading,
    // Đảm bảo các hàm này được định nghĩa và export đúng
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Error signing out:', error);
    },
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};