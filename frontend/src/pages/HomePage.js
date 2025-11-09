import React from 'react'
import { useNavigate } from 'react-router-dom'

function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="container">
      <h1>欢迎使用AI旅行规划助手</h1>
      <p>让AI帮助您规划完美的旅行体验</p>
      <button onClick={() => navigate('/plan')}>开始规划旅程</button>
      
      <section className="features">
        <h2>核心功能</h2>
        <ul>
          <li>基于AI的智能旅行规划</li>
          <li>语音输入支持</li>
          <li>高德地图集成</li>
          <li>个性化预算管理</li>
          <li>云端行程保存</li>
        </ul>
      </section>
    </div>
  )
}

export default HomePage