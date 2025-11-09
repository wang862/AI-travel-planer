import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/AuthContext'
import { authAPI } from '../services/supabaseClient'

function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register: authRegister } = useAuth()
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // 表单验证
    if (!username || !email || !password) {
      setError('请填写所有必填字段')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('密码长度不能少于6位')
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
      // 调用API注册
      await authAPI.register(username, email, password)
      
      // 同时使用authContext登录以保持会话一致性
      await authRegister(username, email, password)
      
      navigate('/my-trips')
    } catch (err) {
      console.error('注册失败:', err)
      setError(err.message || '注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="auth-container">
        <div className="auth-form">
          <h2>创建新账号</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="username">用户名</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                required
              />
            </div>
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
                placeholder="请设置密码（至少6位）"
                required
                minLength={6}
              />
              <small className="password-hint">密码至少6位字符</small>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary"
            >
              {loading ? '注册中...' : '注册账号'}
            </button>
          </form>
          <p className="auth-link">
            已有账号？<a href="/login">立即登录</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage