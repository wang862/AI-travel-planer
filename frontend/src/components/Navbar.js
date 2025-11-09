import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/AuthContext'

function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">AI旅行规划助手</Link>
        <ul className="navbar-links">
          <li><Link to="/">首页</Link></li>
          <li><Link to="/plan">制定计划</Link></li>
          {user ? (
            <>
              <li><Link to="/my-trips">我的旅行</Link></li>
              <li><Link to="/profile">个人中心</Link></li>
              <li><button onClick={logout}>退出</button></li>
            </>
          ) : (
            <>
              <li><Link to="/login">登录</Link></li>
              <li><Link to="/register">注册</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  )
}

export default Navbar