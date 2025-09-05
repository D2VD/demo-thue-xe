// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Tạo AuthContext với các giá trị mặc định.
 * Điều này hữu ích cho việc gỡ lỗi và IntelliSense.
 */
const AuthContext = createContext({
  session: null,
  user: null, // user object sẽ chứa cả thông tin từ auth và bảng profiles
  isAdmin: false,
  loading: true, // Mặc định là đang tải
  signUp: async () => ({ data: null, error: new Error("AuthProvider not initialized") }),
  signIn: async () => ({ data: null, error: new Error("AuthProvider not initialized") }),
  signOut: async () => ({ error: new Error("AuthProvider not initialized") }),
  refreshUserProfile: async () => {},
});

/**
 * Custom hook để dễ dàng sử dụng AuthContext trong các component khác.
 */
export const useAuth = () => useContext(AuthContext);

/**
 * AuthProvider component, bao bọc toàn bộ ứng dụng để cung cấp context.
 */
export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true); // Bắt đầu ở trạng thái loading

  useEffect(() => {
    console.log('[AuthContext] useEffect started. Initializing...');
    setLoading(true);

    // Bước 1: Lấy session ban đầu một cách tường minh khi ứng dụng tải lần đầu.
    // Điều này giúp xác định trạng thái đăng nhập ngay lập tức.
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      console.log('[AuthContext] Initial getSession completed. Session available:', !!initialSession);
      setSession(initialSession);

      // Nếu có session, fetch profile tương ứng.
      if (initialSession?.user) {
        try {
          console.log(`[AuthContext] Initial fetch for profile: ${initialSession.user.id}`);
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', initialSession.user.id)
            .single();
          
          if (error && error.code !== 'PGRST116') throw error; // Bỏ qua lỗi "không tìm thấy hàng"
          
          // Gộp thông tin từ auth và profile vào một object user duy nhất
          setUser({ ...initialSession.user, profile: profile || null });
          setIsAdmin(profile?.role === 'admin');
          console.log('[AuthContext] Initial profile fetch successful.');
        } catch (e) {
          console.error('[AuthContext] Initial profile fetch failed:', e);
          // Nếu lỗi, vẫn set user nhưng không có profile
          setUser({ ...initialSession.user, profile: null });
          setIsAdmin(false);
        }
      } else {
        // Nếu không có session ban đầu, reset state
        setUser(null);
        setIsAdmin(false);
      }
      
      // Bước 2: Hoàn tất quá trình loading ban đầu.
      // Dù có session hay không, quá trình khởi tạo đã xong.
      console.log('[AuthContext] Initial auth setup finished. Setting loading to false.');
      setLoading(false);
    });

    // Bước 3: Lắng nghe các thay đổi trạng thái xác thực SAU KHI đã load xong.
    // Các sự kiện như SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED sẽ được xử lý ở đây.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log(`[AuthContext] onAuthStateChange triggered. Event: ${event}. Session available: ${!!currentSession}`);
        setSession(currentSession);

        // Xử lý đăng xuất hoặc xóa user
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          console.log('[AuthContext] User signed out or deleted. Resetting state.');
          setUser(null);
          setIsAdmin(false);
          return; // Dừng lại, không cần làm gì thêm
        }

        // Xử lý đăng nhập, refresh token, hoặc cập nhật user
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
              setUser({ ...currentSession.user, profile: null });
              setIsAdmin(false);
            }
          }
        }
      }
    );

    // Cleanup function để gỡ bỏ listener khi component unmount
    return () => {
      console.log('[AuthContext] useEffect cleanup. Unsubscribing from auth listener.');
      authListener?.subscription?.unsubscribe();
    };
  }, []); // Dependency array rỗng để đảm bảo useEffect chỉ chạy một lần.

  /**
   * Hàm để làm mới thông tin profile của người dùng hiện tại.
   * Hữu ích sau khi người dùng cập nhật thông tin cá nhân.
   */
  const refreshUserProfile = async () => {
    if (!session?.user) return;
    try {
      console.log("[AuthContext] Refreshing user profile manually...");
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

  /**
   * Gói tất cả các state và hàm vào một object `value` để cung cấp cho context.
   * Các hàm signIn, signUp, signOut được định nghĩa lại ở đây để có thể thêm logic
   * (ví dụ: logging) nếu cần, thay vì chỉ truyền thẳng hàm của supabase.
   */
  const value = {
    session,
    user,
    isAdmin,
    loading,
    signUp: (credentials) => supabase.auth.signUp(credentials),
    signIn: (credentials) => supabase.auth.signInWithPassword(credentials),
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