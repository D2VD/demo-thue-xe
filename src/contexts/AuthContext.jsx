// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true); // Luôn bắt đầu với loading = true

  useEffect(() => {
    console.log('[AuthContext] useEffect mounting. Initializing...');
    setLoading(true);

    // Lắng nghe sự kiện thay đổi trạng thái xác thực từ Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log(`[AuthContext] onAuthStateChange triggered. Event: ${event}. Session available: ${!!currentSession}`);
        
        setSession(currentSession);

        // Nếu không có session (đăng xuất, token hết hạn), reset mọi thứ
        if (!currentSession?.user) {
          console.log('[AuthContext] No session found or user signed out. Resetting state.');
          setUser(null);
          setIsAdmin(false);
          // Quan trọng: Phải set loading false ở đây cho trường hợp đăng xuất
          if (loading) {
            setLoading(false);
          }
          return; // Dừng lại
        }

        // Nếu có session, tiến hành fetch profile
        try {
          console.log(`[AuthContext] Session found. Fetching profile for user: ${currentSession.user.id}`);
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentSession.user.id)
            .single();
          
          if (error && error.code !== 'PGRST116') {
            // Nếu có lỗi thực sự (không phải lỗi "không tìm thấy")
            throw error;
          }
          
          console.log('[AuthContext] Profile fetched:', profile);
          setUser({ ...currentSession.user, profile: profile || null });
          setIsAdmin(profile?.role === 'admin');

        } catch (e) {
          console.error('[AuthContext] Error fetching profile, user state might be incomplete:', e);
          // Nếu lỗi, vẫn set user từ session để ứng dụng không bị đăng xuất, nhưng không có profile
          setUser({ ...currentSession.user, profile: null });
          setIsAdmin(false);
        } finally {
          // Dù thành công hay thất bại, sau lần đầu tiên chạy, setLoading phải là false
          if (loading) {
            console.log('[AuthContext] Initial auth check finished. Setting loading to false.');
            setLoading(false);
          }
        }
      }
    );

    // Cleanup function
    return () => {
      console.log('[AuthContext] useEffect cleanup. Unsubscribing from auth listener.');
      authListener?.subscription?.unsubscribe();
    };
  }, []); // Dependency array rỗng để chỉ chạy một lần

  const refreshUserProfile = async () => { /* ... (giữ nguyên) ... */ };

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
      // onAuthStateChange sẽ tự động xử lý việc reset state
    },
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};