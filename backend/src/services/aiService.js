const axios = require('axios');

const aiService = {
  // 调用阿里云通义千问大模型API
  async callAliyunLLM(prompt, messages = []) {
    try {
      const apiKey = process.env.DASHSCOPE_API_KEY;
      if (!apiKey) {
        throw new Error('阿里云大模型API密钥未配置');
      }

      // 构建完整的消息列表
      const fullMessages = [
        {
          role: 'system',
          content: '你是一个专业的旅行规划助手，擅长根据用户的需求生成详细、合理、个性化的旅行计划。请确保行程安排合理，包含必要的活动、餐饮和交通信息。'
        },
        ...messages,
        {
          role: 'user',
          content: prompt
        }
      ];

      // 调用阿里云通义千问API (使用OpenAI兼容接口)
      const response = await axios.post(
        'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        {
          model: 'qwen-plus', // 使用通义千问增强版模型
          messages: fullMessages,
          temperature: 0.7, // 适当的随机性
          max_tokens: 2000 // 足够生成详细行程
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );

      // 处理响应
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content;
      } else {
        throw new Error('API响应格式不正确或为空');
      }
    } catch (error) {
      console.error('调用阿里云大模型API失败:', error.message);
      // 处理网络错误或API错误
      if (error.response) {
        throw new Error(`API错误: ${error.response.status} - ${error.response.statusText}`);
      }
      throw error;
    }
  },

  // 生成旅行行程
  async generateTravelItinerary(destination, startDate, endDate, preferences = '') {
    try {
      // 构建提示词
      const prompt = `请为我生成一份详细的${destination}旅行计划，从${startDate}到${endDate}。
      ${preferences ? `特殊要求：${preferences}` : ''}
      
      请按以下JSON格式返回行程安排：
      {
        "days": [
          {
            "day": 1,
            "date": "YYYY-MM-DD",
            "activities": [
              {
                "name": "活动名称",
                "time": "09:00-12:00",
                "description": "活动描述",
                "location": "地点名称",
                "transportation": "交通方式（可选）"
              }
            ]
          }
        ]
      }
      
      请确保行程合理，包含必要的景点、餐饮和休息时间。每个活动请提供详细描述和具体地点。`;

      // 调用大模型
      const response = await this.callAliyunLLM(prompt);
      
      // 尝试解析JSON响应
      try {
        // 提取JSON部分（如果响应中包含其他文本）
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(response);
      } catch (parseError) {
        console.warn('无法解析JSON响应，尝试返回文本内容:', parseError.message);
        // 如果无法解析为JSON，返回格式化的文本响应
        return {
          days: [
            {
              day: 1,
              date: startDate,
              activities: [
                {
                  name: '行程详情',
                  time: '全天',
                  description: response,
                  location: destination
                }
              ]
            }
          ]
        };
      }
    } catch (error) {
      console.error('生成旅行行程失败:', error.message);
      throw error;
    }
  }
};

module.exports = aiService;