const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
// const tripRoutes = require('./routes/tripRoutes')
const authRoutes = require('./routes/authRoutes')
const speechRoutes = require('./routes/speechRoutes')

// 加载环境变量
dotenv.config({ path: '../.env' })

const app = express()
const PORT = 12345 // 使用12345端口避免端口冲突

// 中间件
app.use(cors())
app.use(express.json())

// 路由
// app.use('/api/trips', tripRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/speech-to-text', speechRoutes)

// 测试路由
app.get('/', (req, res) => {
  res.json({ message: 'AI旅行规划助手后端服务正在运行 - 无Supabase模式' })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
})