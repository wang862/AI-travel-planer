const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const aiService = require('./aiService')
const amapService = require('./amapService')

dotenv.config({ path: '../config/.env' })

// 初始化 Supabase 客户端
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const tripService = {
  // 创建旅行计划
  async createTrip(tripData, userId) {
    try {
      const { destination, startDate, endDate, budget, preferences } = tripData
      
      // 计算行程天数
      const start = new Date(startDate)
      const end = new Date(endDate)
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
      
      // 尝试使用 AI 生成行程
      let itinerary = []
      try {
        itinerary = await this.generateItinerary(destination, days, budget, preferences)
      } catch (aiError) {
        console.warn('AI 生成行程失败，使用默认行程:', aiError)
        // 使用默认行程
        itinerary = this.getDefaultItinerary(days)
      }

      const { data, error } = await supabase
        .from('trips')
        .insert([{
          user_id: userId,
          destination,
          start_date: startDate,
          end_date: endDate,
          budget,
          preferences,
          itinerary
        }])
        .select()
        .single()

      if (error) {
        throw new Error('创建行程失败: ' + error.message)
      }
      
      return {
        id: data.id,
        destination: data.destination,
        startDate: data.start_date,
        endDate: data.end_date,
        budget: data.budget,
        preferences: data.preferences,
        itinerary: data.itinerary,
        createdAt: data.created_at
      }
    } catch (error) {
      console.error('创建行程失败:', error)
      throw error
    }
  },

  // 获取用户的所有旅行计划
  async getUserTrips(userId) {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error('获取行程列表失败: ' + error.message)
      }

      return data
    } catch (error) {
      console.error('获取用户行程失败:', error)
      // 如果数据库操作失败，返回空数组
      return []
    }
  },

  // 获取单个旅行计划详情
  async getTripById(tripId, userId) {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') { // 记录不存在
          return null
        }
        throw new Error('获取行程详情失败: ' + error.message)
      }

      return {
        id: data.id,
        destination: data.destination,
        startDate: data.start_date,
        endDate: data.end_date,
        budget: data.budget,
        preferences: data.preferences,
        itinerary: data.itinerary || [],
        createdAt: data.created_at
      }
    } catch (error) {
      console.error('获取行程详情失败:', error)
      throw error
    }
  },

  // 更新旅行计划
  async updateTrip(tripId, tripData, userId) {
    try {
      // 检查行程是否属于该用户
      const existingTrip = await this.getTripById(tripId, userId)
      if (!existingTrip) {
        return null
      }

      // 准备更新数据
      const updates = {}
      if (tripData.destination !== undefined) updates.destination = tripData.destination
      if (tripData.startDate !== undefined) updates.start_date = tripData.startDate
      if (tripData.endDate !== undefined) updates.end_date = tripData.endDate
      if (tripData.budget !== undefined) updates.budget = tripData.budget
      if (tripData.preferences !== undefined) updates.preferences = tripData.preferences
      if (tripData.itinerary !== undefined) updates.itinerary = tripData.itinerary

      const { data, error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', tripId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        throw new Error('更新行程失败: ' + error.message)
      }

      return {
        id: data.id,
        destination: data.destination,
        startDate: data.start_date,
        endDate: data.end_date,
        budget: data.budget,
        preferences: data.preferences,
        itinerary: data.itinerary,
        createdAt: data.created_at
      }
    } catch (error) {
      console.error('更新行程失败:', error)
      throw error
    }
  },

  // 删除旅行计划
  async deleteTrip(tripId, userId) {
    try {
      // 检查行程是否属于该用户
      const existingTrip = await this.getTripById(tripId, userId)
      if (!existingTrip) {
        return false
      }

      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId)
        .eq('user_id', userId)

      if (error) {
        throw new Error('删除行程失败: ' + error.message)
      }

      return true
    } catch (error) {
      console.error('删除行程失败:', error)
      throw error
    }
  },

  // 生成旅行行程
  async generateItinerary(destination, days, budget, preferences = '') {
    try {
      // 构建提示词
      const prompt = `为${destination}创建一个${days}天的旅行计划，预算为${budget}元。${preferences ? '特殊要求：' + preferences : ''}。请以JSON格式返回，包含每天的活动安排，每个活动包含名称、时间、描述和地点信息。格式如下：
      [
        {
          "day": 1,
          "activities": [
            {
              "name": "活动名称",
              "time": "09:00-12:00",
              "description": "活动描述",
              "location": "具体地点名称"
            }
          ]
        }
      ]`
      
      // 调用 AI 服务生成行程
      const response = await aiService.generateTravelItinerary(destination, '', '', preferences)
      
      // 解析响应，确保是有效的JSON
      let itineraryData = null
      try {
        // 检查响应格式
        if (response.days && Array.isArray(response.days)) {
          // 适配 days 格式的响应
          itineraryData = response.days.map(day => ({
            day: day.day,
            activities: day.activities
          }))
        } else if (Array.isArray(response)) {
          // 直接使用数组格式
          itineraryData = response
        } else {
          throw new Error('AI返回的行程格式不正确')
        }
      } catch (parseError) {
        console.error('解析AI响应失败:', parseError)
        // 如果解析失败，尝试提取JSON部分
        const jsonStr = JSON.stringify(response)
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0])
            if (parsed.days && Array.isArray(parsed.days)) {
              itineraryData = parsed.days.map(day => ({
                day: day.day,
                activities: day.activities
              }))
            }
          } catch (e) {
            throw new Error('无法解析AI响应为有效的行程格式')
          }
        } else {
          throw new Error('无法解析AI响应为JSON格式')
        }
      }
      
      // 确保返回的是数组格式的行程
      if (!Array.isArray(itineraryData)) {
        throw new Error('AI返回的行程格式不正确')
      }

      // 尝试使用高德地图API为行程添加地理坐标
      try {
        const enrichedItinerary = await amapService.enrichItineraryWithLocations(itineraryData)
        return enrichedItinerary
      } catch (amapError) {
        console.warn('高德地图服务调用失败，使用原始行程:', amapError)
        // 如果地理编码失败，返回原始行程
        return itineraryData
      }
    } catch (error) {
      console.error('生成行程失败:', error)
      // 如果 AI 服务失败，返回默认行程
      const defaultItinerary = this.getDefaultItinerary(days)
      
      // 尝试为默认行程添加位置信息
      try {
        return await amapService.enrichItineraryWithLocations(defaultItinerary)
      } catch (amapError) {
        console.warn('为默认行程添加位置信息失败:', amapError)
        return defaultItinerary
      }
    }
  },
  
  // 默认行程（当 AI 服务不可用时）
  getDefaultItinerary(days = 3) {
    const itinerary = []
    
    for (let i = 1; i <= days; i++) {
      const dayActivities = []
      
      if (i === 1) {
        dayActivities.push(
          { 
            name: '抵达目的地', 
            time: '全天', 
            description: '抵达目的地，入住酒店，休息调整时差',
            location: null
          },
          { 
            name: '当地美食体验', 
            time: '晚上', 
            description: '品尝当地特色美食',
            location: null
          }
        )
      } else if (i === days) {
        dayActivities.push(
          { 
            name: '自由活动', 
            time: '上午', 
            description: '自由活动，可购物或休息',
            location: null
          },
          { 
            name: '返程', 
            time: '下午', 
            description: '整理行李，前往机场/车站返程',
            location: null
          }
        )
      } else {
        dayActivities.push(
          { 
            name: '景点游览', 
            time: '09:00-12:00', 
            description: '游览当地主要景点',
            location: null
          },
          { 
            name: '午餐', 
            time: '12:00-13:30', 
            description: '品尝当地特色午餐',
            location: null
          },
          { 
            name: '文化体验', 
            time: '14:00-17:00', 
            description: '参观博物馆或体验当地文化',
            location: null
          },
          { 
            name: '晚餐', 
            time: '18:00-20:00', 
            description: '享用晚餐',
            location: null
          }
        )
      }
      
      itinerary.push({
        day: i,
        activities: dayActivities
      })
    }
    
    return itinerary
  }
}

module.exports = tripService