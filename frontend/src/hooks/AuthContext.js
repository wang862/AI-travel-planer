import React, { createContext, useState, useEffect, useContext } from 'react'
import { supabase, authAPI } from '../services/supabaseClient'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 检查用户是否已登录
    const checkUser = async () => {
      try {
        // 首先检查本地会话
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
        } else {
          // 然后尝试通过API获取用户信息
          try {
            const userData = await authAPI.getCurrentUser()
            setUser(userData)
          } catch (error) {
            console.log('用户未登录或会话已过期')
            setUser(null)
          }
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // 监听认证状态变化
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => authListener?.unsubscribe()
  }, [])

  const login = async (email, password) => {
    try {
      // 使用API登录
      const response = await authAPI.login(email, password)
      
      // 同时也在本地设置Supabase会话（为了保持兼容性）
      if (response.token) {
        await supabase.auth.setSession({ access_token: response.token })
      }
      
      setUser(response.user || response)
      return response
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  const register = async (email, password) => {
    try {
      // 使用API注册
      const response = await authAPI.register(email, password)
      
      setUser(response.user || response)
      return response
    } catch (error) {
      console.error('注册失败:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('退出登录失败:', error)
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}