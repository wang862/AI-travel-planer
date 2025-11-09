// 独立的语音识别测试服务器
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const app = express()
const PORT = process.env.PORT || 5000

// 中间件
app.use(cors())
app.use(express.json())

// 配置文件上传
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

// 确保临时目录存在
const tempDir = path.join(__dirname, 'temp')
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true })
}

// 模拟的语音识别服务
function mockSpeechToText(audioBuffer) {
  // 保存音频文件（可选）
  const filename = `${uuidv4()}.wav`
  const filePath = path.join(tempDir, filename)
  fs.writeFileSync(filePath, audioBuffer)
  console.log(`音频文件已保存: ${filePath}`)
  
  // 模拟识别结果 - 随机返回不同的旅行信息
  const results = [
    '我想去北京旅行，预算5000元，计划玩5天',
    '上海三日游，预算3000',
    '三亚度假，玩一个星期，带孩子',
    '成都美食之旅，两个人，预算8000',
    '西安古都探索，6天时间，预算6000'
  ]
  
  // 80%的概率返回第一个结果，20%的概率随机返回其他结果
  if (Math.random() < 0.8) {
    return results[0]
  } else {
    const randomIndex = Math.floor(Math.random() * (results.length - 1)) + 1
    return results[randomIndex]
  }
}

// 语音转文字端点
app.post('/api/speech-to-text', upload.single('audio'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未提供音频文件' })
    }
    
    const audioData = req.file.buffer
    console.log(`收到音频文件，大小: ${audioData.length} 字节`)
    
    // 模拟语音识别
    const text = mockSpeechToText(audioData)
    
    console.log(`识别结果: ${text}`)
    res.json({ text })
  } catch (error) {
    console.error('语音识别失败:', error)
    res.status(500).json({ error: '语音识别处理失败' })
  }
})

// 根路径
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI 旅行规划助手 - 语音识别测试服务器',
    speechEndpoint: '/api/speech-to-text',
    status: '就绪',
    instructions: '使用 POST 方法上传音频文件到 /api/speech-to-text 端点'
  })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`语音识别测试服务器运行在端口 ${PORT}`)
  console.log(`语音识别端点: http://localhost:${PORT}/api/speech-to-text`)
  console.log(`前端测试页面建议地址: http://localhost:3000/speech-test`)})