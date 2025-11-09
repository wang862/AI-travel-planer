const authService = require('../services/authService')

const authMiddleware = async (req, res, next) => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供有效的认证令牌' })
    }
    
    const token = authHeader.split(' ')[1]
    
    // 验证token并获取用户信息
    const user = await authService.verifyUser(token)
    
    if (!user) {
      return res.status(401).json({ error: '无效的认证令牌' })
    }
    
    // 将用户信息添加到请求对象中
    req.user = user
    
    next()
  } catch (error) {
    res.status(401).json({ error: '认证失败' })
  }
}

module.exports = authMiddleware