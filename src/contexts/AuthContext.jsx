// src/contexts/AuthContext.jsx - Phiên bản sửa lỗi
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
    console.log('[AuthContext] Initializing...');
    
    // Lấy session hiện tại trước
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthContext] Error getting initial session:', error);
          // Không set null ngay, có thể chỉ là network issue
        }
        
        if (initialSession) {
          console.log('[AuthContext] Found existing session');
          await handleSessionChange('INITIAL', initialSession);
        } else {
          console.log('[AuthContext] No existing session found');
          setLoading(false);
        }
      } catch (error) {
        console.error('[AuthContext] Error in initializeAuth:', error);
        setLoading(false);
      }
    };

    // Handler riêng cho session changes
    const handleSessionChange = async (event, currentSession) => {
      console.log(`[AuthContext] Session change: ${event}`);
      
      setSession(currentSession);

      if (!currentSession?.user) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Retry logic cho việc fetch profile
        let retries = 3;
        let profile = null;
        let lastError = null;

        while (retries > 0 && !profile) {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentSession.user.id)
              .single();

            if (!error && data) {
              profile = data;
              break;
            }
            lastError = error;
          } catch (e) {
            lastError = e;
          }
          
          retries--;
          if (retries > 0 && !profile) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (profile) {
          console.log('[AuthContext] Profile fetched successfully:', profile);
          setUser({ ...currentSession.user, profile });
          setIsAdmin(profile.role === 'admin');
        } else {
          // QUAN TRỌNG: Vẫn giữ user với session data, không set null
          console.warn('[AuthContext] Could not fetch profile, but keeping session:', lastError);
          setUser({ ...currentSession.user, profile: null });
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('[AuthContext] Error handling session:', error);
        // Vẫn giữ session user, không set null
        setUser({ ...currentSession.user, profile: null });
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    // Initialize first
    initializeAuth();

    // Then setup listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Skip initial event vì đã handle ở trên
        if (event !== 'INITIAL_SESSION') {
          handleSessionChange(event, session);
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Refresh profile function với retry
  const refreshUserProfile = async () => {
    if (!session?.user) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (!error && profile) {
        setUser(prevUser => ({ ...prevUser, profile }));
        setIsAdmin(profile?.role === 'admin');
        console.log('[AuthContext] Profile refreshed successfully');
      }
    } catch (err) {
      console.error('[AuthContext] Error refreshing profile:', err);
      // Không set null ở đây
    }
  };

  const signOut = async () => {
    try {
      // Clear local state first
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear any remaining storage
      localStorage.removeItem('supabase.auth.token');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    session,
    user,
    isAdmin,
    loading,
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};