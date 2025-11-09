const { createClient } = require('@supabase/supabase-js')

// 初始化Supabase客户端
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const authService = {
  // 用户注册
  async register(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) throw new Error(error.message)
    
    return data.user
  },

  // 用户登录
  async login(email, password) {
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