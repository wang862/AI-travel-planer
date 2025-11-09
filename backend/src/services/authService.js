const { createClient } = require('@supabase/supabase-js')

// 初始化Supabase客户端
let supabase = null
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

// 只有在配置完整时才初始化Supabase客户端
if (supabaseUrl && supabaseKey && supabaseUrl !== 'YOUR_SUPABASE_URL' && !supabaseKey.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
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
  // 用户注册
  async register(email, password) {
    if (!supabase) {
      console.log('使用模拟数据响应注册请求')
      return {
        id: 'mock-user-123',
        email,
        created_at: new Date().toISOString(),
        app_metadata: { provider: 'email' },
        user_metadata: {}
      }
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) throw new Error(error.message)
    
    return data.user
  },

  // 用户登录
  async login(email, password) {
    if (!supabase) {
      console.log('使用模拟数据响应登录请求')
      return {
        user: {
          id: 'mock-user-123',
          email,
          created_at: new Date().toISOString(),
          app_metadata: { provider: 'email' },
          user_metadata: {}
        },
        token: 'mock-jwt-token-' + Date.now()
      }
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw new Error('邮箱或密码错误')
    
    return {
      user: data.user,
      token: data.session.access_token
    }
  },

  // 获取当前用户信息
  async getCurrentUser(token) {
    if (!supabase) {
      console.log('使用模拟数据响应获取用户信息请求')
      return {
        id: 'mock-user-123',
        email: 'mock@example.com',
        created_at: new Date().toISOString(),
        app_metadata: { provider: 'email' },
        user_metadata: {}
      }
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error) throw new Error('无效的认证令牌')
    
    return user
  },

  // 验证用户是否已登录
  async verifyUser(token) {
    try {
      const user = await this.getCurrentUser(token)
      return user
    } catch (error) {
      return null
    }
  }
}

module.exports = authService