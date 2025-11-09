// 简单的语音识别服务测试脚本
const fs = require('fs')
const path = require('path')
const axios = require('axios')

// 确保 .env 文件被加载
require('dotenv').config({ path: path.join(__dirname, 'config', '.env') })

console.log('开始测试语音识别服务...')

// 创建一个模拟的音频文件内容（在实际使用时，这里应该是真实的音频数据）
const mockAudioBuffer = Buffer.from('这是一个模拟的音频文件内容')

// 测试后端语音识别 API
async function testSpeechRecognition() {
  try {
    console.log('正在调用语音识别 API...')
    
    // 创建 FormData 对象
    const FormData = require('form-data')
    const formData = new FormData()
    formData.append('audio', mockAudioBuffer, { filename: 'test.wav' })
    
    // 调用本地语音识别 API
    const response = await axios.post('http://localhost:5000/api/speech-to-text', 
      formData, 
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 10000 // 10秒超时
      }
    )
    
    console.log('语音识别成功！')
    console.log('识别结果:', response.data.text)
    console.log('\n测试完成。可以通过前端 http://localhost:3000/speech-test 页面进行更完整的测试。')
  } catch (error) {
    console.error('测试失败:', error.message)
    if (error.response) {
      console.error('服务器返回错误:', error.response.data)
    } else if (error.request) {
      console.error('无法连接到服务器，请确保后端服务正在运行。')
      console.error('请先运行: cd backend && npm run dev')
    }
  }
}

// 运行测试
testSpeechRecognition()