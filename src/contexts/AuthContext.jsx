// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({
  session: null,
  user: null,
  isAdmin: false,
  loading: true,
  signUp: () => Promise.resolve(),
  signIn: () => Promise.resolve(),
  signOut: () => Promise.resolve(),
  refreshUserProfile: () => Promise.resolve(),
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null); // user object sẽ chứa cả thông tin auth và profile
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AuthContext] useEffect mounting. Setting up listener.');
    setLoading(true);

    // Lắng nghe sự kiện thay đổi trạng thái xác thực từ Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log(`[AuthContext] onAuthStateChange triggered. Event: ${event}. Session available: ${!!currentSession}`);
        
        // Luôn cập nhật session state
        setSession(currentSession);

        // Nếu không có user (đăng xuất, token hết hạn không refresh được)
        if (!currentSession?.user) {
          console.log('[AuthContext] No user in session. Resetting state.');
          setUser(null);
          setIsAdmin(false);
          // Quan trọng: Đảm bảo setLoading(false) nếu đây là lần load đầu tiên
          if (loading) {
            console.log('[AuthContext] Initial check (no user) finished. Setting loading to false.');
            setLoading(false);
          }
          return; // Dừng lại
        }

        // Nếu có user, tiến hành fetch profile bằng RPC function
        try {
          console.log(`[AuthContext] Session found. Calling RPC get_user_profile for user: ${currentSession.user.id}`);
          
          // Gọi RPC function 'get_user_profile' đã tạo trên Supabase
          const { data: profileData, error } = await supabase.rpc('get_user_profile');

          if (error) throw error;
          
          // RPC trả về một mảng, kể cả khi chỉ có 1 kết quả.
          // Nếu không tìm thấy, mảng sẽ rỗng.
          const userProfile = profileData && profileData.length > 0 ? profileData[0] : null;

          if (userProfile) {
            console.log('[AuthContext] Profile fetched via RPC successfully:', userProfile);
            setUser({ ...currentSession.user, profile: userProfile });
            setIsAdmin(userProfile.role === 'admin');
          } else {
            console.warn(`[AuthContext] Profile not found for user ${currentSession.user.id} via RPC.`);
            // Vẫn set user từ auth, nhưng không có profile
            setUser({ ...currentSession.user, profile: null });
            setIsAdmin(false);
          }
        } catch (e) {
          console.error('[AuthContext] CRITICAL: Failed to fetch profile via RPC. This might be an RLS issue or network error.', e);
          // Nếu có lỗi nghiêm trọng, reset về trạng thái chưa đăng nhập để tránh treo
          setUser(null);
          setIsAdmin(false);
          // Có thể set một state lỗi riêng để hiển thị thông báo cho người dùng
        } finally {
          // Luôn luôn set loading về false sau khi luồng xử lý đầu tiên hoàn tất
          if (loading) {
            console.log('[AuthContext] Initial auth flow finished. Setting loading to false.');
            setLoading(false);
          }
        }
      }
    );

    // Thêm một cơ chế "timeout" để giải cứu ứng dụng nếu onAuthStateChange không được gọi
    // hoặc bị treo trong một khoảng thời gian hợp lý khi khởi động.
    const initialLoadTimeout = setTimeout(() => {
        if (loading) {
            console.warn("[AuthContext] Timeout: onAuthStateChange took too long to fire or process. Forcing loading to false to prevent app hang.");
            setLoading(false); // Ép loading về false để tránh treo ứng dụng
        }
    }, 5000); // 5 giây

    // Cleanup function
    return () => {
      console.log('[AuthContext] useEffect cleanup. Unsubscribing from auth listener.');
      clearTimeout(initialLoadTimeout); // Xóa timeout
      authListener?.subscription?.unsubscribe();
    };
  }, []); // Dependency array rỗng để chỉ chạy 1 lần

  // Hàm để làm mới thông tin profile của user hiện tại (ví dụ sau khi user cập nhật profile)
  const refreshUserProfile = async () => {
    if (!session?.user) return;
    try {
      const { data: profileData, error } = await supabase.rpc('get_user_profile');
      if (error) throw error;
      const userProfile = profileData && profileData.length > 0 ? profileData[0] : null;
      setUser(prevUser => ({ ...prevUser, profile: userProfile }));
      setIsAdmin(userProfile?.role === 'admin');
      console.log('[AuthContext] User profile manually refreshed via RPC.');
    } catch (err) {
      console.error('[AuthContext] Error refreshing profile manually via RPC:', err);
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