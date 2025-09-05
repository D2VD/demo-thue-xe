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
        
        // Cập nhật session state
        setSession(currentSession);

        // Nếu không có session (đăng xuất, token hết hạn không refresh được)
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

        // Nếu có session, tiến hành fetch profile
        try {
          console.log(`[AuthContext] Session found. Fetching profile for user: ${currentSession.user.id}`);
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentSession.user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            // Nếu có lỗi thực sự (không phải là không tìm thấy profile)
            throw error;
          }
          
          if (profile) {
            console.log('[AuthContext] Profile fetched successfully:', profile);
            setUser({ ...currentSession.user, profile: profile });
            setIsAdmin(profile.role === 'admin');
          } else {
            // Không tìm thấy profile, vẫn set user nhưng không có profile
            console.warn(`[AuthContext] Profile not found for user ${currentSession.user.id}.`);
            setUser({ ...currentSession.user, profile: null });
            setIsAdmin(false);
          }
        } catch (e) {
          console.error('[AuthContext] CRITICAL: Failed to fetch profile. This might be an RLS issue or network error.', e);
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

    // Cleanup
    return () => {
      console.log('[AuthContext] useEffect cleanup. Unsubscribing from auth listener.');
      authListener?.subscription?.unsubscribe();
    };
  }, []); // Dependency rỗng để chỉ chạy 1 lần

  // ... (các hàm refreshUserProfile, signUp, signIn, signOut giữ nguyên)

  const value = {
    session, user, isAdmin, loading,
    // ...
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};