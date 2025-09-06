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
    console.log('[AuthContext] useEffect mounting. Setting up listener.');
    setLoading(true);

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log(`[AuthContext] onAuthStateChange triggered. Event: ${event}.`);
        
        setSession(currentSession);

        if (!currentSession?.user) {
          setUser(null);
          setIsAdmin(false);
          if (loading) setLoading(false);
          return;
        }

        try {
          console.log(`[AuthContext] Session found. SELECTING profile for user: ${currentSession.user.id}`);
          
          // *** QUAY LẠI DÙNG SELECT TRỰC TIẾP ***
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentSession.user.id)
            .single(); // single() sẽ ném lỗi nếu không tìm thấy, giúp debug dễ hơn

          if (error) throw error;
          
          if (profile) {
            console.log('[AuthContext] Profile fetched via SELECT successfully:', profile);
            setUser({ ...currentSession.user, profile: profile });
            setIsAdmin(profile.role === 'admin');
          } else {
            // Trường hợp này ít xảy ra vì single() sẽ ném lỗi nếu không tìm thấy
            console.warn(`[AuthContext] Profile not found for user ${currentSession.user.id}.`);
            setUser({ ...currentSession.user, profile: null });
            setIsAdmin(false);
          }
        } catch (e) {
          console.error('[AuthContext] CRITICAL: Failed to fetch profile via SELECT.', e);
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

    // Timeout vẫn giữ lại như một lớp bảo vệ cuối cùng
    const initialLoadTimeout = setTimeout(() => {
        if (loading) {
            console.warn("[AuthContext] Timeout: onAuthStateChange took too long. Forcing loading to false.");
            setLoading(false);
        }
    }, 5000);

    return () => {
      clearTimeout(initialLoadTimeout);
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // ... (các hàm refreshUserProfile, signUp, signIn, signOut giữ nguyên)
  // Cập nhật refreshUserProfile để cũng dùng SELECT
  const refreshUserProfile = async () => {
    if (!session?.user) return;
    try {
      const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (error) throw error;
      setUser(prevUser => ({ ...prevUser, profile: profile }));
      setIsAdmin(profile?.role === 'admin');
      console.log('[AuthContext] User profile manually refreshed via SELECT.');
    } catch (err) {
      console.error('[AuthContext] Error refreshing profile manually via SELECT:', err);
    }
  };


  const value = {
    session, user, isAdmin, loading,
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: async () => { /* ... */ },
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};