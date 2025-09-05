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
    console.log('[AuthContext] useEffect mounting. Initializing auth state listener.');
    setLoading(true);

    // Lấy session ban đầu một cách tường minh để xử lý lần load đầu tiên
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      console.log('[AuthContext] Initial getSession completed. Session available:', !!initialSession);
      setSession(initialSession);

      if (initialSession?.user) {
        try {
          console.log(`[AuthContext] Initial fetch for profile: ${initialSession.user.id}`);
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', initialSession.user.id)
            .single();
          
          if (error && error.code !== 'PGRST116') throw error;
          
          setUser({ ...initialSession.user, profile: profile || null });
          setIsAdmin(profile?.role === 'admin');
          console.log('[AuthContext] Initial profile fetch successful.');
        } catch (e) {
          console.error('[AuthContext] Initial profile fetch failed:', e);
          setUser({ ...initialSession.user, profile: null });
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      
      console.log('[AuthContext] Initial auth setup finished. Setting loading to false.');
      setLoading(false); // Hoàn tất quá trình load ban đầu
    });

    // Listener cho các thay đổi SAU KHI đã load xong
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[AuthContext] onAuthStateChange triggered. Event: ${event}. Session available: ${!!session}`);
        setSession(session);

        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          console.log('[AuthContext] User signed out or deleted. Resetting state.');
          setUser(null);
          setIsAdmin(false);
          return; // Dừng lại ở đây, không cần làm gì thêm
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (session?.user) {
            try {
              console.log(`[AuthContext] Event-driven fetch for profile: ${session.user.id}`);
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (error && error.code !== 'PGRST116') throw error;

              setUser({ ...session.user, profile: profile || null });
              setIsAdmin(profile?.role === 'admin');
              console.log('[AuthContext] Event-driven profile fetch successful.');
            } catch (e) {
              console.error('[AuthContext] Event-driven profile fetch failed:', e);
              setUser({ ...session.user, profile: null });
              setIsAdmin(false);
            }
          }
        }
      }
    );

    return () => {
      console.log('[AuthContext] useEffect cleanup. Unsubscribing from auth listener.');
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // ... (refreshUserProfile, value, Provider giữ nguyên)
  const refreshUserProfile = async () => { /* ... */ };
  const value = {
    session, user, isAdmin, loading,
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