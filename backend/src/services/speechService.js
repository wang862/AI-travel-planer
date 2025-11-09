const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const WebSocket = require('ws')
const CryptoJS = require('crypto-js')
const { format } = require('date-fns')
const { utcToZonedTime } = require('date-fns-tz')

const speechService = {
  // 语音转文字
  async speechToText(audioData) {
    console.log('===== 语音识别请求开始 =====')
    try {
      console.log(`接收到音频数据，大小: ${audioData.length}字节`)
      
      // 1. 保存音频文件（用于调试和后续分析）
      const tempDir = path.join(__dirname, '../../temp')
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
        console.log(`创建临时目录: ${tempDir}`)
      }
      
      const filename = `${uuidv4()}.wav`
      const filepath = path.join(tempDir, filename)
      fs.writeFileSync(filepath, audioData)
      console.log(`✅ 音频文件已保存: ${filepath}`)
      
      // 2. 实际调用讯飞语音识别API（中英识别大模型）
      const appId = process.env.XUNFEI_APPID
      const apiKey = process.env.XUNFEI_API_KEY
      const apiSecret = process.env.XUNFEI_API_SECRET
      
      // 详细日志记录API配置信息（注意：不记录完整的密钥）
      console.log('=== 讯飞API配置检查（中英识别大模型）===')
      
      // 显式检查环境变量是否存在
      console.log(`📋 环境变量状态 - XUNFEI_APPID: ${process.env.hasOwnProperty('XUNFEI_APPID') ? '存在' : '不存在'}`)
      console.log(`📋 环境变量状态 - XUNFEI_API_KEY: ${process.env.hasOwnProperty('XUNFEI_API_KEY') ? '存在' : '不存在'}`)
      console.log(`📋 环境变量状态 - XUNFEI_API_SECRET: ${process.env.hasOwnProperty('XUNFEI_API_SECRET') ? '存在' : '不存在'}`)
      
      // 检查值是否有效
      console.log(`📏 配置长度 - APPID: ${appId ? appId.length : 0}, API Key: ${apiKey ? apiKey.length : 0}, API Secret: ${apiSecret ? apiSecret.length : 0}`)
      console.log(`📄 APPID前4位: ${appId ? appId.substring(0, 4) + '...' : '未设置'}`)
      console.log(`🔑 API Key前4位: ${apiKey ? apiKey.substring(0, 4) + '...' : '未设置'}`)
      console.log(`🔒 API Secret前4位: ${apiSecret ? apiSecret.substring(0, 4) + '...' : '未设置'}`)
      
      // 验证API配置是否完整
      if (!appId || !apiKey || !apiSecret) {
        console.warn('⚠️  讯飞API配置不完整，缺少必要参数')
        const missingParams = []
        if (!appId) missingParams.push('XUNFEI_APPID')
        if (!apiKey) missingParams.push('XUNFEI_API_KEY')
        if (!apiSecret) missingParams.push('XUNFEI_API_SECRET')
        console.warn(`⚠️  缺失的配置: ${missingParams.join(', ')}`)
        
        // 添加详细的排查建议
        console.warn('🔍 排查建议:')
        console.warn('1. 检查.env文件是否位于正确位置（backend目录下）')
        console.warn('2. 确认.env文件格式正确，没有多余的空格或引号')
        console.warn('3. 确认环境变量名称拼写完全正确')
        console.warn('4. 重启服务以加载最新的环境变量')
        console.warn('5. 请使用真实有效的讯飞API密钥')
        
        return {
          success: false,
          error: `API配置不完整: ${missingParams.join(', ')}`,
          message: '请检查讯飞API配置'
        }
      }
      
      // 检查是否使用了默认配置
      const isDefaultAppId = appId === 'YOUR_APPID' || appId.length < 6
      const isDefaultApiKey = apiKey === 'YOUR_API_KEY' || apiKey.length < 10
      const isDefaultApiSecret = apiSecret === 'YOUR_API_SECRET' || apiSecret.length < 10
      
      console.log('=== 配置有效性检查 ===')
      console.log(`APPID是否可能为默认值: ${isDefaultAppId}`)
      console.log(`API_KEY是否可能为默认值: ${isDefaultApiKey}`)
      console.log(`API_SECRET是否可能为默认值: ${isDefaultApiSecret}`)
      
      // 尝试调用API
      console.log('🔄 尝试使用当前配置调用讯飞中英识别大模型API...')
      
      try {
        const result = await this.callXunfeiAPI(audioData, appId, apiKey, apiSecret)
        console.log('✅ 讯飞API调用成功，识别完成')
        return result
      } catch (apiError) {
        console.error('❌ 讯飞API调用失败:', apiError.message)
        
        // 详细记录API错误信息，帮助用户排查
        console.error('❌ API错误详情:', JSON.stringify(apiError, Object.getOwnPropertyNames(apiError)))
        
        // 针对特定错误提供更具体的建议
        if (apiError.message.includes('认证失败') || apiError.message.includes('401')) {
          console.error('❌ 排查建议: 请检查.env文件中的API密钥格式是否正确，特别是是否有多余的空格或换行符')
          console.error('❌ 排查建议: 请确认您在讯飞开放平台上创建的项目已正确开通语音听写（流式）服务')
        } else if (apiError.message.includes('超时')) {
          console.error('❌ 排查建议: 请检查网络连接，确保能够访问讯飞API服务器')
        }
        
        console.info('🔄 切换到本地音频分析模式')
        // 失败时回退到本地分析模式
        return this.analyzeAudioContent(audioData, filepath, false)
      }
      
    } catch (error) {
      console.error('❌ 语音识别处理过程中发生异常:', error)
      console.error('❌ 异常堆栈:', error.stack)
      // 返回友好的错误消息，同时记录详细错误
      return `语音识别处理过程中出现错误: ${error.message}\n建议检查网络连接和API配置后重试`
    } finally {
      console.log('===== 语音识别请求结束 =====')
    }
  },
  
  // 本地音频分析（仅用于错误情况）
  async analyzeAudioContent(audioData, filepath) {
    console.log('🔍 进入音频内容分析模式')
    
    try {
      // 仅在API连接失败时提供基本信息
      console.log('🔬 进行基本音频特征分析')
      
      // 返回API配置错误信息
      return {
        success: false,
        error: 'API配置错误',
        message: '请检查讯飞API配置是否正确',
        message2: '请确保您使用的是真实有效的讯飞API密钥',
        message3: '如需测试功能，请使用正确配置的讯飞API账号'
      }
    } catch (error) {
      console.error('❌ 音频分析失败:', error.message)
      return {
        success: false,
        error: '音频分析失败',
        message: error.message
      }
    }
  },

  // 生成RFC1123格式的时间戳
  generateRFC1123Date() {
    try {
      // 使用date-fns生成RFC1123格式的UTC时间戳
      const now = new Date()
      const year = now.getUTCFullYear()
      const month = now.getUTCMonth()
      const date = now.getUTCDate()
      const hours = now.getUTCHours()
      const minutes = now.getUTCMinutes()
      const seconds = now.getUTCSeconds()
      
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      
      const weekday = weekdays[now.getUTCDay()]
      const monthStr = months[month]
      
      return `${weekday}, ${String(date).padStart(2, '0')} ${monthStr} ${year} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} GMT`
    } catch (error) {
      console.error('生成时间戳失败，使用备用方法:', error.message)
      // 备用方法
      return new Date().toUTCString()
    }
  },

  // 生成API鉴权签名
  generateAuthSignature(apiKey, apiSecret, date, host) {
    try {
      // 生成signature_origin
      const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v1 HTTP/1.1`
      
      // 使用hmac-sha256算法进行加密
      const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret)
      const signatureBase64 = CryptoJS.enc.Base64.stringify(signatureSha)
      
      // 生成authorization_origin
      const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureBase64}"`
      
      // 对authorization_origin进行base64编码
      return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(authorizationOrigin))
    } catch (error) {
      console.error('生成认证签名失败:', error.message)
      throw error
    }
  },

  // 生成WebSocket连接URL
  generateWsUrl(apiKey, apiSecret) {
    try {
      const host = 'iat.xf-yun.com'
      const date = this.generateRFC1123Date()
      console.log('生成的RFC1123日期:', date)
      
      const authorization = this.generateAuthSignature(apiKey, apiSecret, date, host)
      console.log('生成的授权信息长度:', authorization.length)
      
      const params = new URLSearchParams({
        authorization,
        date,
        host
      })
      
      const wsUrl = `wss://${host}/v1?${params.toString()}`
      console.log('WebSocket URL构建完成:', wsUrl.substring(0, 50) + '...')
      return wsUrl
    } catch (error) {
      console.error('生成WebSocket URL失败:', error.message)
      throw error
    }
  },

  // 实际调用讯飞API（中英识别大模型）
  async callXunfeiAPI(audioData, appId, apiKey, apiSecret) {
    console.log('=== 开始讯飞API调用流程（中英识别大模型）===')
    console.log('=== API配置详情 ===')
    console.log(`APPID: ${appId ? appId.substring(0, 4) + '...' : '未提供'}`)
    console.log(`API_KEY长度: ${apiKey ? apiKey.length : 0}字符`)
    console.log(`API_SECRET长度: ${apiSecret ? apiSecret.length : 0}字符`)
    console.log(`音频数据大小: ${audioData.length}字节`)
    
    // 显式检查配置格式有效性
    console.log('🔍 配置格式有效性检查:')
    console.log(`   - APPID是否为字符串类型: ${typeof appId === 'string'}`)
    console.log(`   - API_KEY是否为字符串类型: ${typeof apiKey === 'string'}`)
    console.log(`   - API_SECRET是否为字符串类型: ${typeof apiSecret === 'string'}`)
    
    // 检查是否使用了占位符或示例值
    const isPlaceholderAppId = appId === 'YOUR_APPID' || appId === '123456' || appId.length < 6;
    const isPlaceholderApiKey = apiKey === 'YOUR_API_KEY' || apiKey.startsWith('api_key_') || apiKey.length < 10;
    const isPlaceholderApiSecret = apiSecret === 'YOUR_API_SECRET' || apiSecret.startsWith('api_secret_') || apiSecret.length < 10;
    
    console.log(`⚠️  可能的占位符检测 - APPID: ${isPlaceholderAppId}, API_KEY: ${isPlaceholderApiKey}, API_SECRET: ${isPlaceholderApiSecret}`)
    
    return new Promise((resolve, reject) => {
      try {
        // 生成WebSocket连接URL
        const wsUrl = this.generateWsUrl(apiKey, apiSecret)
        
        // 创建WebSocket连接
        console.log('正在创建WebSocket连接...')
        const ws = new WebSocket(wsUrl)
        
        let recognizedText = ''
        let timeoutId
        let connectionStartTime = Date.now()
        let messageReceived = false
        
        // 连接超时处理
        timeoutId = setTimeout(() => {
          console.error('❌ WebSocket连接超时（30秒）')
          ws.close()
          reject(new Error('语音识别请求超时（30秒），可能是API密钥错误或网络问题'))
        }, 30000) // 30秒超时
        
        // 连接建立事件
        ws.on('open', () => {
          const connectionTime = Date.now() - connectionStartTime
          console.log(`✅ 讯飞WebSocket连接已建立（耗时: ${connectionTime}ms）`) 
          console.log('✅ 连接建立成功，这表明API密钥认证基本通过')
          
          // 准备发送音频数据（分帧发送）
          console.log('准备发送音频数据（分帧）...')
          
          const frameSize = 1280 // 每一帧的音频大小
          const intervel = 40 // 发送音频间隔(单位:ms)
          let status = 0 // 音频的状态信息，标识音频是第一帧，还是中间帧、最后一帧
          let index = 0
          
          // 分帧发送音频数据
          const sendAudioFrames = () => {
            // 计算当前帧的数据范围
            const start = index * frameSize
            const end = Math.min(start + frameSize, audioData.length)
            const frameData = audioData.slice(start, end)
            
            if (frameData.length === 0) {
              // 所有数据已发送完成
              console.log('✅ 所有音频数据已发送完成')
              return
            }
            
            // 根据帧类型设置状态
            if (start === 0) {
              status = 0 // 第一帧
            } else if (end < audioData.length) {
              status = 1 // 中间帧
            } else {
              status = 2 // 最后一帧
            }
            
            // 构建请求参数
            const params = {
              "header": {
                "status": status,
                "app_id": appId
              }
            }
            
            // 第一帧需要包含parameter
            if (status === 0) {
              params.parameter = {
                "iat": {
                  "domain": "slm", 
                  "language": "zh_cn", 
                  "accent": "mandarin",
                  "dwa": "wpgs", 
                  "result": {
                    "encoding": "utf8",
                    "compress": "raw",
                    "format": "plain"
                  }
                }
              }
            }
            
            // 添加音频数据
            params.payload = {
              "audio": {
                "audio": frameData.toString('base64'), 
                "sample_rate": 16000, 
                "encoding": "raw"
              }
            }
            
            // 发送当前帧
            try {
              const paramsString = JSON.stringify(params)
              ws.send(paramsString)
              console.log(`📤 发送第${index + 1}帧数据（状态: ${status}，大小: ${frameData.length}字节）`)
              
              // 增加索引
              index++
              
              // 如果不是最后一帧，继续发送下一帧
              if (status < 2) {
                setTimeout(sendAudioFrames, intervel)
              }
            } catch (sendError) {
              console.error('❌ 发送音频帧失败:', sendError.message)
              reject(new Error(`发送音频数据失败: ${sendError.message}`))
            }
          }
          
          // 开始发送第一帧
          sendAudioFrames()
          
          // 发送后超时处理
          setTimeout(() => {
            if (!messageReceived) {
              console.error('❌ 发送数据后未收到响应（15秒）')
              ws.close()
              reject(new Error('发送语音数据后未收到API响应，可能是API配置或网络问题'))
            }
          }, 15000) // 15秒接收响应超时
        })
        
        // 接收消息事件
        ws.on('message', (data) => {
          messageReceived = true
          try {
            console.log('📨 收到WebSocket消息')
            const dataStr = data.toString()
            
            // 记录响应长度但不打印敏感内容
            console.log(`响应数据长度: ${dataStr.length}字符`)
            
            // 安全地解析响应
            const result = JSON.parse(dataStr)
            console.log('响应头部状态码:', result.header?.code || '未知')
            console.log('响应头部状态:', result.header?.status || '未知')
            
            // 检查是否有错误
            if (result.header && result.header.code && result.header.code !== 0) {
              console.error(`❌ API返回错误: 代码=${result.header.code}, 消息=${result.header.message || '未知错误'}`)
              
              let errorMessage = `讯飞API错误: ${result.header.code} - ${result.header.message || '未知错误'}`
              
              // 根据常见错误码提供更具体的指导
              if (result.header.code === 101107 || result.header.code === 10105) {
                errorMessage += '\n提示: 请检查API密钥和密钥是否匹配，以及项目是否已开通语音听写（流式）服务'
              } else if (result.header.code === 101114) {
                errorMessage += '\n提示: 音频格式错误，请确保使用正确的采样率（16000Hz）和格式（PCM）'
              }
              
              reject(new Error(errorMessage))
              return
            }
            
            // 处理识别结果
            if (result.payload && result.payload.result) {
              console.log('✅ 成功获取识别结果片段')
              try {
                // 解析base64编码的结果文本
                const textBase64 = result.payload.result.text
                const textDecoded = Buffer.from(textBase64, 'base64').toString('utf8')
                console.log('解码后的结果文本长度:', textDecoded.length)
                
                // 解析JSON格式的文本结果
                const textJson = JSON.parse(textDecoded)
                
                // 提取识别文本
                let text = ''
                if (textJson.ws && Array.isArray(textJson.ws)) {
                  textJson.ws.forEach(item => {
                    if (item.cw && Array.isArray(item.cw)) {
                      item.cw.forEach(cwItem => {
                        if (cwItem.w) {
                          text += cwItem.w
                        }
                      })
                    }
                  })
                }
                
                recognizedText = text
                console.log('🎯 当前识别结果:', text)
              } catch (parseError) {
                console.error('❌ 解析识别结果失败:', parseError.message)
                console.error('原始响应文本:', dataStr.substring(0, 200) + '...')
              }
            }
            
            // 检查是否识别完成
            if (result.header && result.header.status === 2) {
              console.log('✅ 识别完成，总结果:', recognizedText)
              clearTimeout(timeoutId)
              ws.close()
              resolve(recognizedText || '无法识别内容')
            }
          } catch (error) {
            console.error('❌ 处理WebSocket消息失败:', error.message)
            console.error('错误堆栈:', error.stack)
            reject(new Error(`处理API响应失败: ${error.message}`))
          }
        })
        
        // 错误事件
        ws.on('error', (error) => {
          clearTimeout(timeoutId)
          console.error('❌ WebSocket连接错误:', error.message)
          console.error('错误详情:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
          
          // 提供更具体的错误信息和详细排查建议
          let errorMessage = `WebSocket连接失败: ${error.message}`
          let detailedSuggestions = '\n\n详细排查建议:'
          
          if (error.message.includes('ECONNREFUSED')) {
            errorMessage = '无法连接到讯飞服务器，请检查网络连接'
            detailedSuggestions += '\n1. 确认服务器地址 iat.xf-yun.com 是否可访问'
            detailedSuggestions += '\n2. 检查防火墙是否阻止了WebSocket连接'
            detailedSuggestions += '\n3. 尝试使用ping命令检查网络连通性'
          } else if (error.message.includes('401') || error.message.includes('认证')) {
            errorMessage = '讯飞API认证失败，请检查API密钥配置'
            detailedSuggestions += '\n1. 确认APPID、API_KEY和API_SECRET完全正确'
            detailedSuggestions += '\n2. 检查环境变量中是否有多余的空格或特殊字符'
            detailedSuggestions += '\n3. 确认密钥没有过期（讯飞API密钥默认有效期为1年）'
            detailedSuggestions += '\n4. 检查讯飞开放平台上项目是否已正确激活'
            detailedSuggestions += '\n5. 确认项目已开通语音听写（流式）服务'
          } else if (error.message.includes('403')) {
            errorMessage = '讯飞API权限不足，请确认您的账户有语音识别权限'
            detailedSuggestions += '\n1. 检查讯飞开放平台上账户余额是否充足'
            detailedSuggestions += '\n2. 确认项目已开通语音听写（流式）服务'
            detailedSuggestions += '\n3. 查看API调用量是否超过限制'
          } else if (error.message.includes('ENOTFOUND')) {
            errorMessage = '无法解析服务器地址，请检查网络连接'
            detailedSuggestions += '\n1. 确认DNS设置正常'
            detailedSuggestions += '\n2. 检查网络连接状态'
            detailedSuggestions += '\n3. 尝试使用IP地址直接连接（如果知道）'
          } else if (error.message.includes('ETIMEDOUT')) {
            errorMessage = '连接超时，请检查网络连接或API配置'
            detailedSuggestions += '\n1. 检查网络连接稳定性'
            detailedSuggestions += '\n2. 增加超时时间设置'
            detailedSuggestions += '\n3. 检查服务器负载情况'
          } else {
            detailedSuggestions += '\n1. 确认.env文件中的API密钥格式正确'
            detailedSuggestions += '\n2. 确认密钥未过期'
            detailedSuggestions += '\n3. 检查网络连接'
            detailedSuggestions += '\n4. 检查讯飞平台上项目是否已开通语音听写（流式）服务'
            detailedSuggestions += '\n5. 查看讯飞开放平台的开发者日志获取更多错误信息'
          }
          
          // 始终添加环境变量检查建议
          detailedSuggestions += '\n\n环境变量检查:'
          detailedSuggestions += '\n- 确认.env文件位于正确的目录（backend目录）'
          detailedSuggestions += '\n- 确认.env文件中的变量名拼写正确（XUNFEI_APPID, XUNFEI_API_KEY, XUNFEI_API_SECRET）'
          detailedSuggestions += '\n- 确认环境变量值没有多余的引号或空格'
          detailedSuggestions += '\n- 重启应用以确保环境变量被正确加载'
          
          reject(new Error(errorMessage + detailedSuggestions))
        })
        
        // 连接关闭事件
        ws.on('close', (code, reason) => {
          clearTimeout(timeoutId)
          console.log(`🔒 WebSocket连接已关闭，代码: ${code}，原因: ${reason || '无'}`)
          
          // 根据关闭代码提供更多信息
          if (code === 1006) {
            console.error('❌ 连接异常断开，可能是网络问题或API认证失败')
          } else if (code === 1000) {
            console.log('✅ 连接正常关闭')
          }
          
          // 如果有识别结果就返回，否则报错
          if (recognizedText) {
            resolve(recognizedText)
          } else {
            reject(new Error(`连接已关闭但未收到识别结果，关闭代码: ${code}\n可能的原因: API密钥错误、网络问题或音频格式不兼容`))
          }
        })
        
      } catch (error) {
        console.error('❌ 讯飞API调用初始化失败:', error.message)
        reject(new Error(`讯飞API调用失败: ${error.message}`))
      }
    })
  }
}

module.exports = speechService