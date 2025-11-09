const express = require('express')
const router = express.Router()
const authService = require('../services/authService')

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body
    
    // 验证请求参数
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名、邮箱和密码都是必填项' 
      })
    }

    // 调用authService进行注册
    const user = await authService.register(username, email, password)
    
    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt || user.created_at
      },
      token: user.token
    })
  } catch (error) {
    console.error('注册路由错误:', error)
    res.status(400).json({ 
      success: false, 
      message: error.message || '注册失败，请稍后重试' 
    })
  }
})

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    // 验证请求参数
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '邮箱和密码都是必填项' 
      })
    }

    // 调用authService进行登录
    const loginResult = await authService.login(email, password)
    
    // 确保返回的数据结构一致
    const responseData = loginResult.user ? 
      {
        user: {
          id: loginResult.user.id,
          username: loginResult.user.username,
          email: loginResult.user.email
        },
        token: loginResult.token
      } : 
      {
        user: {
          id: loginResult.id,
          username: loginResult.username,
          email: loginResult.email
        },
        token: loginResult.token
      }
    
    res.json({
      success: true,
      ...responseData
    })
  } catch (error) {
    console.error('登录路由错误:', error)
    res.status(401).json({ 
      success: false, 
      message: error.message || '登录失败，请检查邮箱和密码' 
    })
  }
})

// 获取当前用户信息
router.get('/me', async (req, res) => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: '未提供有效的认证令牌' 
      })
    }
    
    const token = authHeader.split(' ')[1]
    
    // 验证token并获取用户信息
    const userInfo = await authService.verifyUser(token)
    if (!userInfo) {
      return res.status(401).json({ 
        success: false, 
        message: '无效的认证令牌' 
      })
    }
    
    // 获取完整的用户信息
    const user = await authService.getCurrentUser(userInfo.userId || userInfo)
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at
      }
    })
  } catch (error) {
    console.error('获取用户信息路由错误:', error)
    res.status(401).json({ 
      success: false, 
      message: error.message || '获取用户信息失败' 
    })
  }
})

module.exports = router