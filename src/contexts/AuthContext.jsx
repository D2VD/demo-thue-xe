// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true); // Khởi tạo là true

  // Hàm này sẽ được gọi ở cả getInitialSession và onAuthStateChange
  const updateUserProfileAndRole = async (currentUser) => {
    if (!currentUser) {
      setUser(null);
      setIsAdmin(false);
      return;
    }
    try {
      console.log(`AuthContext: updateUserProfileAndRole - Fetching profile for user ID: ${currentUser.id}`);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profileError) {
        // Nếu lỗi là do không tìm thấy profile (ví dụ user bị xóa khỏi profiles nhưng còn trong auth.users)
        // thì vẫn coi như không có profile và tiếp tục
        if (profileError.code === 'PGRST116') {
            console.warn("AuthContext: Profile not found for user, but session exists. User object will not have profile details.", currentUser.id);
            setUser({ ...currentUser, profile: null }); // Gán user nhưng profile là null
            setIsAdmin(false);
        } else {
            // Các lỗi khác thì ném ra để catch xử lý
            throw profileError;
        }
      } else {
        console.log('AuthContext: Profile fetched successfully:', profile);
        // Gộp thông tin user từ auth và profile vào một object user duy nhất
        setUser({ ...currentUser, profile: profile });
        setIsAdmin(profile?.role === 'admin');
      }
    } catch (err) {
      console.error("AuthContext: Error in updateUserProfileAndRole:", err);
      // Nếu có lỗi khi fetch profile, vẫn set user từ auth nhưng profile là null
      // Điều này ngăn ứng dụng bị treo, dù thông tin profile có thể không đầy đủ
      setUser({ ...currentUser, profile: null });
      setIsAdmin(false);
    }
  };


  useEffect(() => {
    console.log('AuthContext: useEffect mounting. Initializing auth state listener.');
    setLoading(true);

    const getInitialSession = async () => {
      console.log('AuthContext: getInitialSession called.');
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        console.log('AuthContext: Initial session data:', currentSession);
        setSession(currentSession);
        // Gọi hàm chung để xử lý user và profile
        await updateUserProfileAndRole(currentSession?.user);

      } catch (error) {
        console.error('AuthContext: Error in getInitialSession:', error);
        setUser(null);
        setSession(null);
        setIsAdmin(false);
      } finally {
        setLoading(false); // **QUAN TRỌNG NHẤT**
        console.log('AuthContext: getInitialSession finished, loading set to false.');
      }
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log(`AuthContext: onAuthStateChange triggered. Event: ${event}`, newSession);
        // Không cần setLoading(true) ở đây nữa, vì updateUserProfileAndRole đã xử lý
        // Việc này giúp UI không bị giật (chuyển sang loading) mỗi khi token refresh
        setSession(newSession);
        // Gọi hàm chung để xử lý user và profile
        await updateUserProfileAndRole(newSession?.user);
        
        // Chỉ set loading true khi đăng nhập hoặc đăng xuất, không phải khi token refresh
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            // Có thể thêm một state loading nhỏ hơn nếu muốn
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
      console.log('AuthContext: Unsubscribed from auth listener.');
    };
  }, []);

  const refreshUserProfile = async () => { /* ... (giữ nguyên) ... */ };

  const value = {
    user,
    session,
    isAdmin,
    loading,
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Error signing out:', error);
      // onAuthStateChange sẽ tự động xử lý việc set user/session về null
    },
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};