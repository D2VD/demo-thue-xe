// AuthContext.jsx
// Fully-featured authentication context for a React + Vite + Supabase app.
// - Persists session across refreshes (requires persistSession: true in supabaseClient)
// - Exposes { session, user, profile, loading } and helpers
// - Optional <RequireAuth> guard waits for hydration to avoid redirecting too early
//
// NOTE: Adjust the import path for supabase client to match your project structure.

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient' // <-- change if your path is different
// If you prefer '@/lib/supabaseClient', ensure your Vite alias is configured.

/**
 * @typedef {Object} AuthContextShape
 * @property {import('@supabase/supabase-js').Session|null} session
 * @property {import('@supabase/supabase-js').User|null} user
 * @property {any|null} profile
 * @property {boolean} loading
 * @property {(email:string, password:string) => Promise<any>} signInWithPassword
 * @property {(email:string) => Promise<any>} signInWithOtp
 * @property {(provider: import('@supabase/supabase-js').Provider, options?: any) => Promise<any>} signInWithProvider
 * @property {() => Promise<void>} signOut
 * @property {() => Promise<any>} refreshSession
 * @property {() => Promise<void>|null} reloadProfile
 */

const AuthContext = createContext(
  /** @type {AuthContextShape} */ ({
    session: null,
    user: null,
    profile: null,
    loading: true,
    signInWithPassword: async () => {},
    signInWithOtp: async () => {},
    signInWithProvider: async () => {},
    signOut: async () => {},
    refreshSession: async () => {},
    reloadProfile: () => null,
  })
)

export const useAuth = () => useContext(AuthContext)

/**
 * Fetch user profile from 'profiles' table.
 * Your table should have a row where id === auth.uid().
 * Adjust the select columns as needed.
 * @param {string} uid
 */
async function fetchProfile(uid) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single()

    if (error) {
      // PGRST116 = No rows found for single()
      if (error.code !== 'PGRST116') console.warn('[AuthContext] fetchProfile error:', error)
      return null
    }
    return data ?? null
  } catch (e) {
    console.warn('[AuthContext] fetchProfile exception:', e)
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) console.warn('[AuthContext] getSession error:', error)
        if (!mounted) return

        const sess = data?.session ?? null
        setSession(sess)
        setUser(sess?.user ?? null)

        if (sess?.user) {
          const p = await fetchProfile(sess.user.id)
          if (mounted) setProfile(p)
        }
      } catch (e) {
        console.warn('[AuthContext] init exception:', e)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    // Subscribe to auth state changes (sign in/out, token refresh, user updated)
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, sess) => {
      // console.debug('[AuthContext] onAuthStateChange:', event, sess)
      setSession(sess)
      setUser(sess?.user ?? null)

      if (sess?.user) {
        const p = await fetchProfile(sess.user.id)
        setProfile(p)
      } else {
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      sub.subscription?.unsubscribe?.()
    }
  }, [])

  // -------- Auth helpers -------- //
  const signInWithPassword = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    // State will also sync via onAuthStateChange, but set immediately for snappier UX
    setSession(data.session ?? null)
    setUser(data.user ?? data.session?.user ?? null)
    if (data.user ?? data.session?.user) {
      const uid = (data.user ?? data.session?.user).id
      const p = await fetchProfile(uid)
      setProfile(p)
    }
    return data
  }

  const signInWithOtp = async (email) => {
    const { data, error } = await supabase.auth.signInWithOtp({ email })
    if (error) throw error
    return data
  }

  const signInWithProvider = async (provider, options = {}) => {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider, options })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    // Do NOT manually remove localStorage keys; supabase handles that.
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setSession(null)
    setUser(null)
    setProfile(null)
  }

  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) throw error
    setSession(data.session ?? null)
    setUser(data.user ?? data.session?.user ?? null)
    if (data.user ?? data.session?.user) {
      const uid = (data.user ?? data.session?.user).id
      const p = await fetchProfile(uid)
      setProfile(p)
    }
    return data
  }

  const reloadProfile = async () => {
    if (!user) return null
    const p = await fetchProfile(user.id)
    setProfile(p)
  }

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      signInWithPassword,
      signInWithOtp,
      signInWithProvider,
      signOut,
      refreshSession,
      reloadProfile,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, user, profile, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ---------- Optional: Protected Route helper ----------
// Only include this if you use react-router-dom in your app.
export function RequireAuth({ children, fallback = null }) {
  // fallback can be a loader element while waiting for hydration
  const { loading, session } = useAuth()
  if (loading) return fallback ?? <div className="p-4">Đang tải…</div>
  if (!session) {
    // Lazy import to avoid hard dependency if react-router-dom not installed
    const Navigate = require('react-router-dom').Navigate
    return <Navigate to="/login" replace />
  }
  return children
}

export default AuthProvider
