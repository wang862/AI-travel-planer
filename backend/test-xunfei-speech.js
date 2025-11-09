// 讯飞语音识别测试脚本
const fs = require('fs')
const path = require('path')
const axios = require('axios')

console.log('\n==================================')
console.log('讯飞语音识别功能测试脚本')
console.log('==================================\n')

// 先测试健康检查端点
async function testHealthEndpoint() {
  try {
    console.log('🔍 正在测试健康检查端点...')
    const response = await axios.get('http://localhost:54321/health', {
      timeout: 5000
    })
    console.log('✅ 健康检查成功:', response.data.status)
    return true
  } catch (error) {
    console.error('❌ 健康检查失败:', error.message)
    return false
  }
}

// 测试函数
async function testXunfeiSpeechRecognition() {
  try {
    // 首先测试健康检查端点
    const isHealthy = await testHealthEndpoint()
    if (!isHealthy) {
      console.error('\n❌ 服务器不可用，请确保服务器正在运行在端口54321上')
      return
    }
    
    // 创建一个简单的测试音频数据
    const testAudioData = Buffer.from('AUDIO_DATA_PLACEHOLDER', 'utf8')
    
    console.log('\n🔄 正在准备测试数据...')
    console.log(`🎧 测试音频数据大小: ${testAudioData.length} 字节`)
    
    // 创建FormData
    const FormData = require('form-data')
    const formData = new FormData()
    formData.append('audio', testAudioData, { filename: 'test.wav' })
    
    console.log('📤 正在发送到讯飞语音识别API...')
    console.log('⏱️ 设置了15秒超时，等待响应...')
    
    // 发送请求到我们的专用服务器
    const startTime = Date.now()
    const response = await axios.post(
      'http://localhost:54321/api/xunfei-speech-to-text',
      formData,
      {
        headers: {
          ...formData.getHeaders()
        },
        timeout: 15000 // 15秒超时
      }
    )
    
    const duration = (Date.now() - startTime) / 1000
    
    console.log('\n✅ 测试成功！')
    console.log(`⏱️ 响应时间: ${duration.toFixed(2)}秒`)
    console.log('📊 识别结果:', JSON.stringify(response.data, null, 2))
    console.log('\n==================================')
    console.log('测试完成。服务器运行正常！')
    console.log('==================================')
    
  } catch (error) {
    console.log('\n❌ 测试失败')
    
    if (error.response) {
      // 服务器返回了错误响应
      console.error('服务器返回错误:')
      console.error(`  - 状态码: ${error.response.status}`)
      console.error(`  - 响应数据:`, JSON.stringify(error.response.data, null, 2))
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('无法连接到服务器:', error.message)
      console.error('请确保服务器正在运行并且端口正确')
    } else {
      // 请求配置出错
      console.error('请求配置错误:', error.message)
      console.error('错误详情:', error.stack)
    }
    
    console.log('\n🔍 排查建议:')
    console.log('1. 确认服务器正在运行 (node xunfei-speech-server.js)')
    console.log('2. 检查端口是否正确 (当前使用54321)')
    console.log('3. 检查讯飞API配置是否正确')
    console.log('4. 确保网络连接正常，可以访问讯飞服务器')
    console.log('5. 可能需要使用真实的音频文件进行测试')
    
    console.log('\n==================================')
    console.log('测试结束，出现错误')
    console.log('==================================')
  }
}

// 运行测试
testXunfeiSpeechRecognition()