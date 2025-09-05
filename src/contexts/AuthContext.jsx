// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({
  user: null,
  session: null,
  isAdmin: false,
  loading: true,
  signUp: async () => ({ user: null, session: null, error: new Error("AuthProvider not yet initialized") }),
  signIn: async () => ({ user: null, session: null, error: new Error("AuthProvider not yet initialized") }),
  signOut: async () => ({ error: new Error("AuthProvider not yet initialized") }),
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true); // Khởi tạo loading là true

  useEffect(() => {
    console.log('AuthContext: useEffect mounting. Initializing auth state listener.');
    setLoading(true); // Đảm bảo loading là true khi bắt đầu

    // Hàm helper để lấy profile và cập nhật user state, isAdmin state
    const updateUserProfileAndRole = async (currentUser) => {
      if (currentUser) {
        try {
          console.log('AuthContext: updateUserProfileAndRole - Fetching profile for user ID:', currentUser.id);
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, phone_number, avatar_url, role') // Lấy các trường cần thiết
            .eq('id', currentUser.id)
            .single();

          if (profileError) {
            // Không coi lỗi PGRST116 (không tìm thấy hàng) là lỗi nghiêm trọng ở đây,
            // vì profile có thể chưa được tạo cho user mới.
            if (profileError.code !== 'PGRST116') {
              console.error('AuthContext: Error fetching profile:', profileError);
            } else {
              console.log('AuthContext: Profile not found for user ID (PGRST116):', currentUser.id, 'This might be a new user.');
            }
            // Gán profile rỗng nếu không tìm thấy hoặc lỗi
            setUser({ ...currentUser, profile: {} });
            setIsAdmin(false); // Mặc định không phải admin nếu không có profile hoặc role
          } else {
            console.log('AuthContext: Profile data fetched:', profileData);
            setUser({ ...currentUser, profile: profileData || {} });
            setIsAdmin(profileData?.role === 'admin');
          }
        } catch (e) {
          console.error('AuthContext: Exception in updateUserProfileAndRole:', e);
          setUser({ ...currentUser, profile: {} }); // Gán profile rỗng nếu có exception
          setIsAdmin(false);
        }
      } else {
        console.log('AuthContext: updateUserProfileAndRole - No current user, setting user and isAdmin to null/false.');
        setUser(null);
        setIsAdmin(false);
      }
    };

    // Lấy session ban đầu khi component mount
    const getInitialSession = async () => {
      console.log('AuthContext: getInitialSession called.');
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('AuthContext: Error getting initial session:', sessionError);
          // Không ném lỗi ở đây để onAuthStateChange có thể xử lý tiếp nếu cần
        }
        
        console.log('AuthContext: Initial session data from getSession():', initialSession);
        setSession(initialSession);
        await updateUserProfileAndRole(initialSession?.user);

      } catch (error) {
        console.error('AuthContext: Catch block in getInitialSession (should be rare):', error);
        // Đảm bảo state được reset an toàn
        setSession(null);
        setUser(null);
        setIsAdmin(false);
      } finally {
        // Chỉ set loading false ở đây nếu onAuthStateChange không được gọi ngay sau đó.
        // Tuy nhiên, onAuthStateChange thường được gọi khi mount, nên có thể để onAuthStateChange xử lý setLoading(false) cuối cùng.
        // Để an toàn, nếu không có session ban đầu, có thể set loading false.
        // Nếu có session, onAuthStateChange sẽ được gọi và xử lý loading.
        // setLoading(false); // Tạm thời comment dòng này, để onAuthStateChange xử lý
        console.log('AuthContext: getInitialSession finished.');
      }
    };

    getInitialSession();

    // Lắng nghe thay đổi trạng thái auth
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        console.log('AuthContext: onAuthStateChange triggered. Event:', _event, 'New Session:', newSession);
        // setLoading(true); // Không cần thiết nếu getInitialSession đã set loading và đây là callback
        
        try {
          setSession(newSession); // newSession sẽ là null sau khi signOut thành công
          await updateUserProfileAndRole(newSession?.user);
        } catch (error) {
          console.error('AuthContext: Catch block in onAuthStateChange processing:', error);
          // Reset an toàn nếu có lỗi trong quá trình xử lý profile
          setUser(null);
          setIsAdmin(false);
        } finally {
          // Đây là điểm quan trọng để set loading false sau khi tất cả quá trình xác thực và lấy profile hoàn tất
          setLoading(false);
          console.log('AuthContext: onAuthStateChange processing finished, loading set to false. Current User:', user, 'IsAdmin:', isAdmin);
        }
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
        console.log('AuthContext: Unsubscribed from auth state listener.');
      }
    };
  }, []); // Dependency array rỗng để chỉ chạy một lần khi component mount

  const signUp = async (credentials) => {
    console.log('AuthContext: signUp called with:', credentials.email);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp(credentials);
      if (error) {
        console.error('AuthContext: SignUp error:', error);
      } else {
        console.log('AuthContext: SignUp successful. User data:', data.user);
        // onAuthStateChange sẽ xử lý việc cập nhật user và session state
      }
      return { user: data?.user, session: data?.session, error };
    } catch (e) {
      console.error('AuthContext: Exception during signUp:', e);
      return { user: null, session: null, error: e };
    } finally {
      setLoading(false); // Có thể không cần nếu onAuthStateChange xử lý
    }
  };

  const signIn = async (credentials) => {
    console.log('AuthContext: signIn called with:', credentials.email);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword(credentials);
      if (error) {
        console.error('AuthContext: SignIn error:', error);
      } else {
        console.log('AuthContext: SignIn successful. User data:', data.user);
        // onAuthStateChange sẽ xử lý việc cập nhật user và session state
      }
      return { user: data?.user, session: data?.session, error };
    } catch (e) {
      console.error('AuthContext: Exception during signIn:', e);
      return { user: null, session: null, error: e };
    } finally {
      setLoading(false); // Có thể không cần nếu onAuthStateChange xử lý
    }
  };

  const signOut = async () => {
    console.log('AuthContext: signOut called.');
    // setLoading(true); // Không cần thiết, onAuthStateChange sẽ xử lý loading
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthContext: Error signing out from Supabase:', error);
        // Không ném lỗi ở đây để không làm crash ứng dụng nếu component gọi không bắt lỗi
        return { error };
      } else {
        console.log('AuthContext: Supabase signOut successful. onAuthStateChange should trigger to nullify session.');
        // onAuthStateChange sẽ được kích hoạt và set user/session thành null, isAdmin thành false, loading thành false.
        return { error: null };
      }
    } catch (e) {
      console.error('AuthContext: Exception during signOut call:', e);
      return { error: e };
    }
    // finally { setLoading(false); } // Không cần thiết, onAuthStateChange sẽ xử lý
  };
  
  const refreshUserProfile = async () => {
    if (session?.user) {
      console.log("AuthContext: Refreshing user profile...");
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*') // Lấy tất cả thông tin profile
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('AuthContext: Error refreshing profile:', profileError);
          // Không set user thành null ở đây, chỉ log lỗi
        } else {
          // Cập nhật user object với profile mới
          setUser(prevUser => ({
            ...prevUser,
            profile: profile // Gán toàn bộ object profile
          }));
          setIsAdmin(profile?.role === 'admin');
          console.log('AuthContext: User profile refreshed:', profile);
        }
      } catch (err) {
        console.error('AuthContext: Exception during profile refresh:', err);
      }
    }
  };

  const value = {
    user,
    session,
    isAdmin,
    loading,
    signUp,
    signIn,
    signOut,
    refreshUserProfile,
  };

  // Log giá trị context mỗi khi nó thay đổi (chỉ trong development)
  // useEffect(() => {
  //   console.log('AuthContext value updated:', value);
  // }, [value]);

  return (
    <AuthContext.Provider value={value}>
      {/* Nếu loading=true và children được render ngay, các ProtectedRoute sẽ hiển thị fallback của chúng */}
      {children}
    </AuthContext.Provider>
  );
};