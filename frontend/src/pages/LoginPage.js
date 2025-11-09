import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/AuthContext'
import { authAPI } from '../services/supabaseClient'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login: authLogin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // 表单验证
    if (!email || !password) {
      setError('请填写所有必填字段')
      setLoading(false)
      return
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('请输入有效的邮箱地址')
      setLoading(false)
      return
    }

    try {
      // 调用API登录
      const userData = await authAPI.login(email, password)
      
      // 同时使用authContext登录以保持会话一致性
      await authLogin(email, password)
      
      navigate('/my-trips')
    } catch (err) {
      console.error('登录失败:', err)
      setError(err.message || '登录失败，请检查邮箱和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="auth-container">
        <div className="auth-form">
          <h2>欢迎回来</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">邮箱</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱地址"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">密码</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
          <p className="auth-link">
            还没有账号？<a href="/register">立即注册</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage