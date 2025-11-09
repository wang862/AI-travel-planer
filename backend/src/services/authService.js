const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')

dotenv.config({ path: '../config/.env' })

// 初始化Supabase客户端
let supabase = null
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // 使用服务角色密钥以获得更多权限

// 只有在配置完整时才初始化Supabase客户端
if (supabaseUrl && supabaseKey && supabaseUrl !== 'YOUR_SUPABASE_URL') {
  try {
    supabase = createClient(supabaseUrl, supabaseKey)
    console.log('Supabase客户端初始化成功')
  } catch (error) {
    console.warn('Supabase客户端初始化失败:', error.message)
    supabase = null
  }
} else {
  console.warn('Supabase配置不完整或使用了默认值，暂时跳过初始化')
}

const authService = {
  // JWT 配置
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key',
  jwtExpiration: '24h',
  
  // 生成 JWT token
  generateToken(userId) {
    return jwt.sign(
      { userId },
      this.jwtSecret,
      { expiresIn: this.jwtExpiration }
    )
  },
  
  // 用户注册
  async register(username, email, password) {
    if (!supabase) {
      console.log('使用模拟数据响应注册请求')
      return {
        id: 'mock-user-123',
        username,
        email,
        token: 'mock-jwt-token-' + Date.now(),
        created_at: new Date().toISOString()
      }
    }
    
    try {
      // 检查邮箱是否已被注册
      const { data: existingUser, error: emailCheckError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (existingUser) {
        throw new Error('邮箱已被注册')
      }

      // 检查用户名是否已被使用
      const { data: usernameUser, error: usernameCheckError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single()

      if (usernameUser) {
        throw new Error('用户名已被使用')
      }

      // 密码加密
      const hashedPassword = await bcrypt.hash(password, 10)

      // 创建用户
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            username,
            email,
            password: hashedPassword,
            created_at: new Date()
          }
        ])
        .select()
        .single()

      if (error) {
        throw new Error('创建用户失败: ' + error.message)
      }

      // 生成 token
      const token = this.generateToken(data.id)

      return {
        id: data.id,
        username: data.username,
        email: data.email,
        token,
        created_at: data.created_at
      }
    } catch (error) {
      console.error('注册失败:', error)
      throw error
    }
  },

  // 用户登录
  async login(email, password) {
    if (!supabase) {
      console.log('使用模拟数据响应登录请求')
      return {
        user: {
          id: 'mock-user-123',
          username: 'user1',
          email,
          created_at: new Date().toISOString()
        },
        token: 'mock-jwt-token-' + Date.now()
      }
    }
    
    try {
      // 根据邮箱查找用户
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error || !user) {
        throw new Error('邮箱或密码错误')
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        throw new Error('邮箱或密码错误')
      }

      // 生成 token
      const token = this.generateToken(user.id)

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          created_at: user.created_at
        },
        token
      }
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  },

  // 获取当前用户信息
  async getCurrentUser(token) {
    if (!supabase) {
      console.log('使用模拟数据响应获取用户信息请求')
      return {
        id: 'mock-user-123',
        username: 'user1',
        email: 'mock@example.com',
        created_at: new Date().toISOString()
      }
    }
    
    try {
      // 首先验证token并提取userId
      const decoded = jwt.verify(token, this.jwtSecret)
      const userId = decoded.userId
      
      // 根据userId查询用户信息
      const { data: user, error } = await supabase
        .from('users')
        .select('id, username, email, created_at')
        .eq('id', userId)
        .single()
      
      if (error || !user) {
        throw new Error('用户不存在')
      }
      
      return user
    } catch (error) {
      console.error('获取用户信息失败:', error)
      throw new Error('无效的认证令牌')
    }
  },

  // 验证用户是否已登录
  async verifyUser(token) {
    try {
      // 验证token
      const decoded = jwt.verify(token, this.jwtSecret)
      
      // 检查用户是否存在
      const { data: user, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', decoded.userId)
        .single()
      
      if (error || !user) {
        return null
      }
      
      return { userId: decoded.userId }
    } catch (error) {
      console.error('Token验证失败:', error)
      return null
    }
  }
}

module.exports = authService