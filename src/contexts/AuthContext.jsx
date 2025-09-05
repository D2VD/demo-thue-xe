// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null); // user object sẽ chứa cả thông tin auth và profile
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true); // Luôn bắt đầu với loading = true

  useEffect(() => {
    console.log('[AuthContext] useEffect started. Initializing...');
    setLoading(true);

    // Lắng nghe sự kiện thay đổi trạng thái xác thực từ Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[AuthContext] onAuthStateChange triggered. Event: ${event}. Session available: ${!!session}`);
        
        setSession(session); // Cập nhật session ngay lập tức

        if (session?.user) {
          // Nếu có session (SIGNED_IN, TOKEN_REFRESHED), fetch profile
          let profile = null;
          let profileError = null;
          try {
            console.log(`[AuthContext] Fetching profile for user: ${session.user.id}`);
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (error && error.code !== 'PGRST116') { // Bỏ qua lỗi "không tìm thấy hàng"
              profileError = error;
            } else {
              profile = data;
            }
          } catch (e) {
            profileError = e;
          }

          if (profileError) {
            console.error('[AuthContext] Error fetching profile:', profileError);
            // Nếu lỗi, vẫn set user nhưng không có profile
            setUser({ ...session.user, profile: null });
            setIsAdmin(false);
          } else {
            console.log('[AuthContext] Profile fetched successfully:', profile);
            setUser({ ...session.user, profile: profile });
            setIsAdmin(profile?.role === 'admin');
          }
        } else {
          // Nếu không có session (SIGNED_OUT, USER_DELETED), reset user và role
          console.log('[AuthContext] No session found. Resetting user state.');
          setUser(null);
          setIsAdmin(false);
        }

        // Dù thành công hay thất bại, sau lần đầu tiên chạy, setLoading phải là false
        if (loading) {
            console.log('[AuthContext] Initial auth check finished. Setting loading to false.');
            setLoading(false);
        }
      }
    );

    // Cleanup function
    return () => {
      console.log('[AuthContext] useEffect cleanup. Unsubscribing from auth listener.');
      authListener?.subscription?.unsubscribe();
    };
  }, []); // Dependency array rỗng để chỉ chạy một lần


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

  const value = {
    session,
    user,
    isAdmin,
    loading,
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