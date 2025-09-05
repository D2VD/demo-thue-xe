// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Tách logic fetch profile ra một hàm riêng để tái sử dụng và dễ quản lý
  const updateUserProfileAndRole = async (authUser) => {
    if (!authUser) {
      setUser(null);
      setIsAdmin(false);
      return;
    }
    console.log(`AuthContext: updateUserProfileAndRole - Fetching profile for user ID: ${authUser.id}`);
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*') // Lấy tất cả thông tin profile
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        // Nếu lỗi là do không tìm thấy profile (ví dụ: trigger tạo profile chưa chạy kịp)
        if (profileError.code === 'PGRST116') {
          console.warn(`AuthContext: Profile not found for user ${authUser.id}. User might need to complete registration or trigger is delayed.`);
          // Vẫn set user với thông tin cơ bản, nhưng không có profile
          setUser({ ...authUser, profile: null });
          setIsAdmin(false);
        } else {
          // Ném các lỗi khác
          throw profileError;
        }
      } else {
        console.log('AuthContext: Profile fetched successfully:', profile);
        // Kết hợp thông tin auth và thông tin profile
        setUser({ ...authUser, profile: profile });
        setIsAdmin(profile?.role === 'admin');
      }
    } catch (err) {
      console.error("AuthContext: CRITICAL ERROR in updateUserProfileAndRole:", err);
      // Nếu có lỗi nghiêm trọng, set user về trạng thái an toàn
      setUser(authUser); // Ít nhất vẫn có thông tin auth cơ bản
      setIsAdmin(false);
    }
  };


  useEffect(() => {
    console.log('AuthContext: useEffect mounting. Initializing auth state listener.');
    setLoading(true);

    // Lấy session ban đầu khi tải trang
    const getInitialSession = async () => {
      console.log('AuthContext: getInitialSession called.');
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        console.log('AuthContext: Initial session data:', currentSession);
        setSession(currentSession);
        // Fetch profile và cập nhật state user
        await updateUserProfileAndRole(currentSession?.user);
      } catch (err) {
        console.error("AuthContext: Error in getInitialSession:", err);
        // Đảm bảo state được reset nếu có lỗi
        setSession(null);
        setUser(null);
        setIsAdmin(false);
      } finally {
        console.log('AuthContext: getInitialSession finished, setting loading to false.');
        setLoading(false); // **QUAN TRỌNG**
      }
    };
    getInitialSession();


    // Lắng nghe các thay đổi trạng thái đăng nhập
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log(`AuthContext: onAuthStateChange triggered. Event: ${event}`, newSession);
        setLoading(true); // Bắt đầu loading khi có thay đổi
        try {
          setSession(newSession);
          // Fetch profile và cập nhật state user
          await updateUserProfileAndRole(newSession?.user);
        } catch (err) {
          console.error("AuthContext: Error in onAuthStateChange handler:", err);
          // Đảm bảo state được reset nếu có lỗi
          setUser(null);
          setIsAdmin(false);
        } finally {
          console.log(`AuthContext: onAuthStateChange for event ${event} finished, setting loading to false.`);
          setLoading(false); // **QUAN TRỌNG**
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
      console.log('AuthContext: Unsubscribed from auth listener.');
    };
  }, []);

  const refreshUserProfile = async () => {
    if (session?.user) {
      await updateUserProfileAndRole(session.user);
    }
  };

  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Error signing out:', error);
      // onAuthStateChange sẽ tự động xử lý việc reset state
    },
    user,
    session,
    isAdmin,
    loading,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};