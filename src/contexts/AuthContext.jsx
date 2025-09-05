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
    console.log('[AuthContext] useEffect started. Initializing...');
    setLoading(true);

    // Lấy session ban đầu một cách tường minh
    // Điều này giúp xác định trạng thái ban đầu trước khi listener chạy
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log('[AuthContext] Initial getSession completed. Session available:', !!initialSession);
      setSession(initialSession);
      if (initialSession?.user) {
        // Nếu có session, fetch profile
        supabase.from('profiles').select('*').eq('id', initialSession.user.id).single()
          .then(({ data: profile, error }) => {
            if (error && error.code !== 'PGRST116') {
              console.error('[AuthContext] Initial profile fetch error:', error);
              setUser({ ...initialSession.user, profile: null });
              setIsAdmin(false);
            } else {
              console.log('[AuthContext] Initial profile fetched:', profile);
              setUser({ ...initialSession.user, profile: profile });
              setIsAdmin(profile?.role === 'admin');
            }
          })
          .catch(err => {
            console.error('[AuthContext] Initial profile fetch exception:', err);
            setUser({ ...initialSession.user, profile: null });
            setIsAdmin(false);
          })
          .finally(() => {
            console.log('[AuthContext] Initial auth check finished. Setting loading to false.');
            setLoading(false);
          });
      } else {
        // Nếu không có session ban đầu
        setUser(null);
        setIsAdmin(false);
        console.log('[AuthContext] No initial session. Setting loading to false.');
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[AuthContext] onAuthStateChange triggered. Event: ${event}. Session available: ${!!session}`);
        
        // Xử lý dứt điểm sự kiện SIGNED_OUT
        if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] SIGNED_OUT event received. Clearing all user state.');
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          // Không cần setLoading ở đây vì nó đã được xử lý ở lần load đầu
          return; // Dừng xử lý thêm
        }

        // Xử lý các sự kiện khác (SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED)
        if (session?.user) {
          setSession(session);
          // So sánh user ID để tránh fetch lại profile không cần thiết khi chỉ refresh token
          if (user?.id !== session.user.id) {
            console.log(`[AuthContext] New user detected or user changed. Fetching profile for: ${session.user.id}`);
            try {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (error && error.code !== 'PGRST116') throw error;
              
              setUser({ ...session.user, profile: profile });
              setIsAdmin(profile?.role === 'admin');
            } catch (err) {
              console.error('[AuthContext] Error fetching profile on auth change:', err);
              setUser({ ...session.user, profile: null });
              setIsAdmin(false);
            }
          } else {
             // Chỉ cập nhật session, không cần fetch lại profile
             console.log('[AuthContext] Token refreshed. Session updated, user profile retained.');
          }
        }
      }
    );

    return () => {
      console.log('[AuthContext] useEffect cleanup. Unsubscribing from auth listener.');
      authListener?.subscription?.unsubscribe();
    };
  }, []); // Dependency array rỗng

  const refreshUserProfile = async () => { /* ... (giữ nguyên) ... */ };

  const value = {
    session,
    user,
    isAdmin,
    loading,
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: async () => {
      console.log('[AuthContext] signOut called.');
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Error signing out:', error);
      // onAuthStateChange sẽ xử lý việc reset state
    },
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};