import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({
  session: null,
  user: null,
  isAdmin: false,
  loading: true,
  signUp: () => {},
  signIn: () => {},
  signOut: () => {},
  refreshUserProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null); // user object sẽ chứa cả thông tin auth và profile
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true); // Luôn bắt đầu với loading = true

  useEffect(() => {
    console.log('[AuthContext] useEffect mounting. Initializing...');
    setLoading(true);

    // 1. Lấy session ban đầu một cách tường minh để xử lý lần load đầu tiên
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
          
          if (error && error.code !== 'PGRST116') throw error; // Bỏ qua lỗi "không tìm thấy hàng"
          
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
      
      // Quan trọng: Hoàn tất quá trình load ban đầu
      console.log('[AuthContext] Initial auth setup finished. Setting loading to false.');
      setLoading(false);
    }).catch(err => {
        console.error('[AuthContext] Critical error in getSession promise chain:', err);
        setLoading(false); // Đảm bảo loading luôn được set false dù có lỗi nghiêm trọng
    });

    // 2. Listener cho các thay đổi SAU KHI đã load xong
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log(`[AuthContext] onAuthStateChange triggered. Event: ${event}. Session available: ${!!currentSession}`);
        setSession(currentSession);

        // Xử lý đăng xuất hoặc xóa người dùng
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          console.log('[AuthContext] User signed out or deleted. Resetting state.');
          setUser(null);
          setIsAdmin(false);
          return; // Dừng lại ở đây, không cần làm gì thêm
        }

        // Xử lý đăng nhập, refresh token, hoặc cập nhật thông tin người dùng
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (currentSession?.user) {
            try {
              console.log(`[AuthContext] Event-driven fetch for profile: ${currentSession.user.id}`);
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentSession.user.id)
                .single();
              
              if (error && error.code !== 'PGRST116') throw error;

              setUser({ ...currentSession.user, profile: profile || null });
              setIsAdmin(profile?.role === 'admin');
              console.log('[AuthContext] Event-driven profile fetch successful.');
            } catch (e) {
              console.error('[AuthContext] Event-driven profile fetch failed:', e);
              // Nếu lỗi, vẫn set user từ auth nhưng không có profile
              setUser({ ...currentSession.user, profile: null });
              setIsAdmin(false);
            }
          }
        }
      }
    );

    // Cleanup function khi component unmount
    return () => {
      console.log('[AuthContext] useEffect cleanup. Unsubscribing from auth listener.');
      authListener?.subscription?.unsubscribe();
    };
  }, []); // Dependency array rỗng để chỉ chạy một lần khi component mount

  // Hàm để làm mới thông tin profile thủ công (ví dụ: sau khi user cập nhật profile)
  const refreshUserProfile = async () => {
    if (!session?.user) return;
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      
      setUser(prevUser => ({ ...prevUser, profile: profile || null }));
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