const speechService = require('../services/speechService')

const speechController = {
  // 语音转文字
  async speechToText(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: '未提供音频文件' })
      }
      
      const audioData = req.file.buffer
      const text = await speechService.speechToText(audioData)
      
      res.json({ text })
    } catch (error) {
      console.error('语音识别失败:', error)
      res.status(500).json({ error: '语音识别处理失败' })
    }
  }
}

module.exports = speechController