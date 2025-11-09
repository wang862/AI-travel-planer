const authService = require('../services/authService')

const authController = {
  // 用户注册
  async register(req, res) {
    try {
      const { email, password } = req.body
      const user = await authService.register(email, password)
      res.status(201).json(user)
    } catch (error) {
      res.status(400).json({ error: error.message })
    }
  },

  // 用户登录
  async login(req, res) {
    try {
      const { email, password } = req.body
      const { user, token } = await authService.login(email, password)
      res.json({ user, token })
    } catch (error) {
      res.status(401).json({ error: error.message })
    }
  },

  // 获取当前用户信息
  async getCurrentUser(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1]
      
      if (!token) {
        return res.status(401).json({ error: '未提供认证令牌' })
      }
      
      const user = await authService.getCurrentUser(token)
      res.json(user)
    } catch (error) {
      res.status(401).json({ error: error.message })
    }
  }
}

module.exports = authController