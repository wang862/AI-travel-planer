const axios = require('axios');
const WebSocket = require('ws');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config', '.env') });

// 讯飞API配置信息
const APPID = process.env.XUNFEI_APPID;
const API_KEY = process.env.XUNFEI_API_KEY;
const API_SECRET = process.env.XUNFEI_API_SECRET;

console.log('📄 从.env文件加载配置信息:');
console.log('  - APPID:', APPID ? '已配置' : '未配置');
console.log('  - API_KEY:', API_KEY ? '已配置' : '未配置');
console.log('  - API_SECRET:', API_SECRET ? '已配置' : '未配置');

// 创建临时音频文件进行测试
function createTestAudioFile() {
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const audioFilePath = path.join(tempDir, 'test-audio.pcm');
    // 创建一个包含简单正弦波的PCM音频文件（16000Hz, 16bit, 单声道）
    // 这将产生一个1kHz的测试音调，持续约2秒
    const sampleRate = 16000;
    const duration = 2; // 2秒
    const sampleCount = sampleRate * duration;
    const buffer = Buffer.alloc(sampleCount * 2); // 16位 = 2字节每样本
    
    for (let i = 0; i < sampleCount; i++) {
        // 生成1kHz的正弦波
        const amplitude = 0.3; // 30%音量
        const value = Math.sin(2 * Math.PI * 1000 * i / sampleRate);
        const intValue = Math.floor(value * amplitude * 32767); // 16位有符号整数
        
        // 写入小端序的16位整数
        buffer.writeInt16LE(intValue, i * 2);
    }
    
    fs.writeFileSync(audioFilePath, buffer);
    console.log(`创建测试音频文件: ${audioFilePath}`);
    console.log(`音频文件信息: ${sampleRate}Hz, 16bit, 单声道, ${duration}秒, 正弦波测试音`);
    return audioFilePath;
}

// 生成RFC1123格式的时间戳
function generateRFC1123Date() {
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
}

// 生成WebSocket连接参数
function generateWsUrl() {
    const host = 'iat.xf-yun.com';
    const date = generateRFC1123Date();
    console.log('生成的RFC1123日期:', date);
    
    // 生成signature_origin
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v1 HTTP/1.1`;
    
    // 使用hmac-sha256算法进行加密
    const signa = crypto.createHmac('sha256', API_SECRET)
        .update(signatureOrigin)
        .digest('base64');
    
    // 生成authorization_origin
    const authorizationOrigin = `api_key="${API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signa}"`;
    
    // 对authorization_origin进行base64编码
    const signature = Buffer.from(authorizationOrigin).toString('base64');
    
    const url = `wss://${host}/v1?authorization=${encodeURIComponent(signature)}&date=${encodeURIComponent(date)}&host=${host}`;
    console.log('生成的WebSocket URL:', url);
    return url;
}

// 直接连接讯飞WebSocket API进行语音识别
async function recognizeSpeech(audioFilePath) {
    return new Promise((resolve, reject) => {
        try {
            const wsUrl = generateWsUrl();
            console.log('正在连接讯飞WebSocket API...');
            
            const ws = new WebSocket(wsUrl);
            let recognizedText = '';
            let connectionStartTime = Date.now();
            let messageReceived = false;
            let timeoutId;
            
            // 连接超时处理
            timeoutId = setTimeout(() => {
                console.error('❌ WebSocket连接超时（30秒）');
                ws.close();
                reject(new Error('语音识别请求超时（30秒），可能是API密钥错误或网络问题'));
            }, 30000); // 30秒超时
            
            // 连接打开
            ws.on('open', () => {
                const connectionTime = Date.now() - connectionStartTime;
                console.log(`✅ 讯飞WebSocket连接已建立（耗时: ${connectionTime}ms）`);
                console.log('✅ 连接建立成功，这表明API密钥认证基本通过');
                
                // 读取并发送音频数据（分帧发送）
                const audioData = fs.readFileSync(audioFilePath);
                console.log(`准备发送音频数据，大小: ${audioData.length} 字节`);
                
                const frameSize = 1280; // 每一帧的音频大小
                const interval = 40; // 发送音频间隔(单位:ms)
                let status = 0; // 音频的状态信息，标识音频是第一帧，还是中间帧、最后一帧
                let index = 0;
                
                // 分帧发送音频数据
                const sendAudioFrames = () => {
                    // 计算当前帧的数据范围
                    const start = index * frameSize;
                    const end = Math.min(start + frameSize, audioData.length);
                    const frameData = audioData.slice(start, end);
                    
                    if (frameData.length === 0) {
                        // 所有数据已发送完成
                        console.log('✅ 所有音频数据已发送完成');
                        return;
                    }
                    
                    // 根据帧类型设置状态
                    if (start === 0) {
                        status = 0; // 第一帧
                    } else if (end < audioData.length) {
                        status = 1; // 中间帧
                    } else {
                        status = 2; // 最后一帧
                    }
                    
                    // 构建请求参数（符合讯飞API要求的格式）
                    const params = {
                        "header": {
                            "status": status,
                            "app_id": APPID
                        }
                    };
                    
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
                        };
                    }
                    
                    // 添加音频数据
                    params.payload = {
                        "audio": {
                            "audio": frameData.toString('base64'), 
                            "sample_rate": 16000, 
                            "encoding": "raw"
                        }
                    };
                    
                    // 发送当前帧
                    try {
                        const paramsString = JSON.stringify(params);
                        ws.send(paramsString);
                        console.log(`📤 发送第${index + 1}帧数据（状态: ${status}，大小: ${frameData.length}字节）`);
                        
                        // 增加索引
                        index++;
                        
                        // 如果不是最后一帧，继续发送下一帧
                        if (status < 2) {
                            setTimeout(sendAudioFrames, interval);
                        }
                    } catch (sendError) {
                        console.error('❌ 发送音频帧失败:', sendError.message);
                        reject(new Error(`发送音频数据失败: ${sendError.message}`));
                    }
                };
                
                // 开始发送第一帧
                sendAudioFrames();
                
                // 发送后超时处理
                setTimeout(() => {
                    if (!messageReceived) {
                        console.error('❌ 发送数据后未收到响应（15秒）');
                        ws.close();
                        reject(new Error('发送语音数据后未收到API响应，可能是API配置或网络问题'));
                    }
                }, 15000); // 15秒接收响应超时
            });
            
            // 接收消息
            ws.on('message', (data) => {
                messageReceived = true;
                try {
                    console.log('📨 收到WebSocket消息');
                    const dataStr = data.toString();
                    
                    // 打印完整的响应数据进行调试
                    console.log(`响应数据长度: ${dataStr.length}字符`);
                    console.log('完整响应内容:', dataStr);
                    
                    // 安全地解析响应
                    const result = JSON.parse(dataStr);
                    console.log('响应对象类型:', typeof result);
                    console.log('响应对象属性:', Object.keys(result));
                    
                    // 正确访问header属性
                    if (result.header) {
                        console.log('响应头部状态码:', result.header.code);
                        console.log('响应头部状态:', result.header.status);
                        console.log('响应会话ID:', result.header.sid);
                    } else {
                        console.warn('响应中没有header字段');
                    }
                    
                    // 检查是否有错误
                    if (result.header && result.header.code !== 0) {
                        console.error(`❌ API返回错误: 代码=${result.header.code}, 消息=${result.header.message || '未知错误'}`);
                        
                        let errorMessage = `讯飞API错误: ${result.header.code} - ${result.header.message || '未知错误'}`;
                        
                        // 根据常见错误码提供更具体的指导
                        if (result.header.code === 101107 || result.header.code === 10105) {
                            errorMessage += '\n提示: 请检查API密钥和密钥是否匹配，以及项目是否已开通语音听写（流式）服务';
                        } else if (result.header.code === 101114) {
                            errorMessage += '\n提示: 音频格式错误，请确保使用正确的采样率（16000Hz）和格式（PCM）';
                        }
                        
                        clearTimeout(timeoutId);
                        reject(new Error(errorMessage));
                        ws.close();
                        return;
                    }
                    
                    // 处理识别结果
                    if (result.payload && result.payload.result) {
                        console.log('✅ 成功获取识别结果片段');
                        try {
                            // 解析base64编码的结果文本
                            const textBase64 = result.payload.result.text;
                            if (textBase64) {
                                const textDecoded = Buffer.from(textBase64, 'base64').toString('utf8');
                                console.log('解码后的结果文本长度:', textDecoded.length);
                                console.log('识别结果片段:', textDecoded);
                                recognizedText += textDecoded;
                            } else {
                                console.log('结果中没有text字段或为空');
                            }
                        } catch (parseError) {
                            console.error('❌ 解析识别结果失败:', parseError.message);
                        }
                    }
                    
                    // 检查是否完成识别
                    if (result.header && result.header.status === 2) {
                        console.log('✅ 识别完成');
                        clearTimeout(timeoutId);
                        resolve(recognizedText || '未识别到文本');
                        ws.close();
                    }
                } catch (e) {
                    console.error('解析响应出错:', e);
                }
            });
            
            // 连接错误
            ws.on('error', (error) => {
                console.error('WebSocket错误:', error);
                clearTimeout(timeoutId);
                reject(error);
            });
            
            // 连接关闭
            ws.on('close', () => {
                clearTimeout(timeoutId);
                if (messageReceived && !recognizedText) {
                    resolve('未识别到文本');
                }
            });
            
        } catch (error) {
            console.error('识别过程出错:', error);
            reject(error);
        }
    });
}

// 主函数
async function main() {
    console.log('======================================');
    console.log('讯飞语音识别直接测试程序');
    console.log('======================================');
    
    // 检查API配置
    if (!APPID || !API_KEY || !API_SECRET) {
        console.error('❌ API配置不完整，请检查.env文件中的配置');
        return;
    } else {
        console.log('✅ API配置完整，可以开始测试');
    }
    
    try {
        // 创建测试音频文件
        const audioFilePath = createTestAudioFile();
        
        // 执行语音识别
        console.log('\n🔄 开始语音识别过程...');
        const startTime = Date.now();
        const result = await recognizeSpeech(audioFilePath);
        const endTime = Date.now();
        
        console.log('\n======================================');
        console.log('识别结果:', result);
        console.log('处理时间:', (endTime - startTime) / 1000, '秒');
        console.log('======================================');
        
    } catch (error) {
        console.error('\n❌ 识别失败:', error.message);
        console.log('\n🔍 排查建议:');
        console.log('1. 检查讯飞API配置是否正确');
        console.log('2. 确保网络连接正常，可以访问讯飞服务器');
        console.log('3. 检查音频文件格式是否符合要求(PCM, 16kHz, 16bit)');
        console.log('4. 查看讯飞控制台是否有API调用记录');
    }
}

// 执行主函数
main();