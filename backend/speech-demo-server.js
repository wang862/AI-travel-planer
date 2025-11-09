const express = require('express');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const crypto = require('crypto');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config({ path: './config/.env' });

// 加载环境变量
const APPID = process.env.XUNFEI_APPID;
const API_KEY = process.env.XUNFEI_API_KEY;
const API_SECRET = process.env.XUNFEI_API_SECRET;

// 创建Express应用
const app = express();
app.use(cors());
app.use(express.json());

// 设置静态文件目录，用于提供前端页面
app.use(express.static(path.join(__dirname, 'public')));

// 确保temp目录存在
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExt = path.extname(file.originalname);
        cb(null, 'audio-' + uniqueSuffix + fileExt);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB限制
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /\.(wav|mp3|pcm|m4a)$/i;
        if (allowedTypes.test(file.originalname)) {
            cb(null, true);
        } else {
            cb(new Error('只支持音频文件: wav, mp3, pcm, m4a'));
        }
    }
});

// 生成RFC1123格式的日期
function generateRFC1123Date() {
    return new Date().toUTCString();
}

// 生成WebSocket URL
function generateWsUrl() {
    const host = 'iat.xf-yun.com';
    const date = generateRFC1123Date();
    console.log('生成的RFC1123日期:', date);
    
    // 生成signature_origin (注意这里需要包含GET /v1 HTTP/1.1)
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v1 HTTP/1.1`;
    
    // 使用hmac-sha256算法进行加密
    const signa = crypto.createHmac('sha256', API_SECRET)
        .update(signatureOrigin)
        .digest('base64');
    
    // 生成authorization_origin
    const authorizationOrigin = `api_key="${API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signa}"`;
    
    // 对authorization_origin进行base64编码（这是关键步骤）
    const signature = Buffer.from(authorizationOrigin).toString('base64');
    
    // 构建URL，注意host参数不需要URL编码
    const url = `wss://${host}/v1?authorization=${encodeURIComponent(signature)}&date=${encodeURIComponent(date)}&host=${host}`;
    console.log('生成的WebSocket URL:', url);
    return url;
}

// 语音识别函数
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
                    const dataStr = data.toString();
                    const result = JSON.parse(dataStr);
                    
                    // 检查是否有错误
                    if (result.header && result.header.code !== 0) {
                        console.error(`❌ API返回错误: 代码=${result.header.code}, 消息=${result.header.message || '未知错误'}`);
                        clearTimeout(timeoutId);
                        reject(new Error(`讯飞API错误: ${result.header.code} - ${result.header.message || '未知错误'}`));
                        ws.close();
                        return;
                    }
                    
                    // 处理识别结果
                    try {
                        console.log('处理识别结果片段');
                        console.log('原始响应数据:', dataStr);
                        
                        // 检查直接在result中的ws字段（这是当前API返回的格式）
                        if (result.ws && Array.isArray(result.ws)) {
                            console.log('检测到result.ws格式的结果');
                            const words = [];
                            for (const wordGroup of result.ws) {
                                if (wordGroup.cw && Array.isArray(wordGroup.cw)) {
                                    for (const char of wordGroup.cw) {
                                        if (char.w && char.w.trim()) {
                                            words.push(char.w);
                                        }
                                    }
                                }
                            }
                            const text = words.join('');
                            console.log('从result.ws提取的文本内容:', text);
                            if (text.trim()) {
                                recognizedText += text;
                            }
                        }
                        // 检查payload.result中的ws字段
                        else if (result.payload && result.payload.result && result.payload.result.ws) {
                            console.log('检测到payload.result.ws格式的结果');
                            const words = [];
                            for (const wordGroup of result.payload.result.ws || []) {
                                for (const char of wordGroup.cw || []) {
                                    if (char.w && char.w.trim()) {
                                        words.push(char.w);
                                    }
                                }
                            }
                            const text = words.join('');
                            console.log('从payload.result.ws提取的文本内容:', text);
                            if (text.trim()) {
                                recognizedText += text;
                            }
                        }
                        // 检查是否有base64编码的结果文本
                        else if (result.payload && result.payload.result && result.payload.result.text) {
                            // 尝试解析base64编码的结果文本
                            const textBase64 = result.payload.result.text;
                            const textDecoded = Buffer.from(textBase64, 'base64').toString('utf8');
                            console.log('解码后的识别结果:', textDecoded);
                            if (textDecoded.trim()) {
                                recognizedText += textDecoded;
                            }
                        }
                        
                        // 如果没有识别到有效文本，记录情况
                        if (recognizedText === '' || recognizedText.trim() === '') {
                            console.log('未从当前响应中提取到有效文本');
                        }
                    } catch (parseError) {
                        console.error('❌ 解析识别结果失败:', parseError.message);
                        console.error('原始响应数据:', dataStr);
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

// API端点：上传并识别语音
app.post('/api/speech-to-text', upload.single('audio'), async (req, res) => {
    try {
        console.log('收到语音识别请求');
        const startTime = Date.now();
        
        if (!req.file) {
            return res.status(400).json({ error: '未收到音频文件' });
        }
        
        console.log(`上传的文件: ${req.file.originalname}, 大小: ${req.file.size} 字节`);
        
        // 调用语音识别函数
        const result = await recognizeSpeech(req.file.path);
        
        // 计算处理时间
        const processingTime = (Date.now() - startTime) / 1000;
        console.log(`语音识别完成，用时: ${processingTime.toFixed(2)}秒`);
        
        // 可选：删除临时文件
        // fs.unlinkSync(req.file.path);
        
        // 返回结果
        res.json({
            success: true,
            text: result,
            processingTime: processingTime.toFixed(2),
            fileName: req.file.originalname,
            fileSize: req.file.size
        });
    } catch (error) {
        console.error('语音识别出错:', error);
        res.status(500).json({
            success: false,
            error: error.message || '语音识别失败'
        });
    }
});

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: '语音识别服务运行正常',
        timestamp: new Date().toISOString()
    });
});

// 启动服务器
const PORT = 8888; // 直接指定端口，不使用环境变量
app.listen(PORT, () => {
    console.log(`======================================`);
    console.log(`讯飞语音识别测试服务已启动`);
    console.log(`服务地址: http://localhost:${PORT}`);
    console.log(`API文档: http://localhost:${PORT}/api/speech-to-text`);
    console.log(`======================================`);
});