const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')

// 用户注册
router.post('/register', authController.register)

// 用户登录
router.post('/login', authController.login)

// 获取当前用户信息
router.get('/me', authController.getCurrentUser)

module.exports = router