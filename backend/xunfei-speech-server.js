// 讯飞语音识别专用服务器
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const fs = require('fs')
const path = require('path')

// 确保加载环境变量
require('dotenv').config({ path: path.join(__dirname, 'config', '.env') })

// 导入讯飞语音识别服务
const speechService = require('./src/services/speechService')

const app = express()
const PORT = 54321 // 使用一个随机端口避免冲突

// 中间件
app.use(cors())
app.use(express.json())

// 配置文件上传 - 使用内存存储
const storage = multer.memoryStorage()
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 限制文件大小为10MB
})

// 确保临时目录存在
const tempDir = path.join(__dirname, 'temp')
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true })
  console.log(`创建临时目录: ${tempDir}`)
}

// 语音转文字API端点
app.post('/api/xunfei-speech-to-text', upload.single('audio'), async (req, res) => {
  const requestStartTime = Date.now()
  console.log('\n====================================')
  console.log(`[${new Date().toISOString()}] 收到语音识别请求`)
  
  try {
    console.log('📋 请求头信息:')
    console.log(`  - Content-Type: ${req.headers['content-type'] || '未知'}`)
    console.log(`  - User-Agent: ${req.headers['user-agent'] || '未知'}`)
    
    if (!req.file) {
      console.error('❌ 错误: 未提供音频文件')
      return res.status(400).json({ 
        success: false,
        error: '未提供音频文件',
        timestamp: new Date().toISOString()
      })
    }
    
    const audioData = req.file.buffer
    console.log(`📁 收到音频文件:`)
    console.log(`  - 文件名: ${req.file.originalname || '未知'}`)
    console.log(`  - 文件大小: ${audioData.length} 字节`)
    console.log(`  - MIME类型: ${req.file.mimetype || '未知'}`)
    
    // 保存音频文件以便调试
    const tempDir = path.join(__dirname, 'temp')
    const timestamp = Date.now()
    const debugFilename = `debug_audio_${timestamp}.wav`
    const debugFilePath = path.join(tempDir, debugFilename)
    fs.writeFileSync(debugFilePath, audioData)
    console.log(`💾 音频文件已保存到: ${debugFilePath}`)
    
    console.log('🔄 开始调用讯飞语音识别服务...')
    
    // 调用讯飞语音识别服务
    const result = await speechService.speechToText(audioData)
    
    const processingTime = (Date.now() - requestStartTime) / 1000
    console.log(`✅ 语音识别完成!`)
    console.log(`  - 处理时间: ${processingTime.toFixed(2)}秒`)
    console.log(`  - 识别结果类型: ${typeof result}`)
    
    const responseData = { 
      success: true, 
      text: result,
      message: '语音识别成功',
      processingTime: processingTime.toFixed(2),
      timestamp: new Date().toISOString()
    }
    
    console.log('📤 准备返回结果...')
    res.json(responseData)
    
  } catch (error) {
    const errorTime = (Date.now() - requestStartTime) / 1000
    console.error(`❌ 语音识别处理失败! (${errorTime.toFixed(2)}秒)`)
    console.error('错误详情:', error.message)
    console.error('错误堆栈:', error.stack)
    
    const errorResponse = { 
      success: false, 
      error: error.message || '语音识别处理失败',
      timestamp: new Date().toISOString(),
      processingTime: errorTime.toFixed(2)
    }
    
    res.status(500).json(errorResponse)
  } finally {
    console.log(`[${new Date().toISOString()}] 请求处理完成`)
    console.log('====================================\n')
  }
})

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: '讯飞语音识别服务',
    timestamp: new Date().toISOString()
  })
})

// 根路径信息
app.get('/', (req, res) => {
  res.json({ 
    message: '讯飞语音识别专用服务器',
    endpoints: {
      speechToText: '/api/xunfei-speech-to-text',
      health: '/health'
    },
    status: '就绪',
    instructions: '使用 POST 方法上传音频文件到 /api/xunfei-speech-to-text 端点',
    audioFormat: '支持采样率16k或8K、位长16bit、单声道的pcm或mp3格式'
  })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`\n=============================================`)
  console.log(`讯飞语音识别专用服务器已启动`)
  console.log(`运行端口: ${PORT}`)
  console.log(`API端点: http://localhost:${PORT}/api/xunfei-speech-to-text`)
  console.log(`健康检查: http://localhost:${PORT}/health`)
  console.log(`=============================================\n`)
  
  // 显示API配置状态
  console.log('讯飞API配置状态:')
  console.log(`- APPID: ${process.env.XUNFEI_APPID ? '已配置' : '未配置'}`)
  console.log(`- API_KEY: ${process.env.XUNFEI_API_KEY ? '已配置' : '未配置'}`)
  console.log(`- API_SECRET: ${process.env.XUNFEI_API_SECRET ? '已配置' : '未配置'}`)
  console.log('\n服务已准备就绪，等待音频识别请求...')
})