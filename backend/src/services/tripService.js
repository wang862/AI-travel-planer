const { createClient } = require('@supabase/supabase-js')
const aiService = require('./aiService')

// 初始化Supabase客户端
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const tripService = {
  // 创建旅行计划
  async createTrip(tripData, userId) {
    const { destination, startDate, endDate, budget, preferences } = tripData
    
    // 调用LLM生成详细行程
    const itinerary = await this.generateItinerary(destination, startDate, endDate, preferences)
    
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

    if (error) throw new Error(error.message)
    
    return data[0]
  },

  // 获取用户的所有旅行计划
  async getUserTrips(userId) {
    const { data, error } = await supabase
      .from('trips')
      .select('id, destination, start_date, end_date, budget')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    
    return data
  },

  // 获取单个旅行计划详情
  async getTripById(tripId, userId) {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .eq('user_id', userId)
      .single()

    if (error && error.code === 'PGRST116') {
      return null
    }
    
    if (error) throw new Error(error.message)
    
    return data
  },

  // 更新旅行计划
  async updateTrip(tripId, tripData, userId) {
    const { data, error } = await supabase
      .from('trips')
      .update(tripData)
      .eq('id', tripId)
      .eq('user_id', userId)
      .select()

    if (error) throw new Error(error.message)
    
    return data.length > 0 ? data[0] : null
  },

  // 删除旅行计划
  async deleteTrip(tripId, userId) {
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
    
    return true
  },

  // 调用LLM生成行程
  async generateItinerary(destination, startDate, endDate, preferences) {
    try {
      console.log('开始调用阿里云大模型生成行程...')
      // 调用阿里云大模型API生成行程
      const result = await aiService.generateTravelItinerary(destination, startDate, endDate, preferences)
      
      // 确保返回的数据格式符合预期
      if (result && result.days) {
        console.log('行程生成成功，共', result.days.length, '天行程')
        return result.days
      }
      
      // 兜底返回，确保总是有有效的行程数据
      console.warn('行程格式不符合预期，使用默认行程')
      return this.getDefaultItinerary(destination, startDate, endDate)
    } catch (error) {
      console.error('生成行程失败:', error.message)
      // 出错时返回默认行程
      return this.getDefaultItinerary(destination, startDate, endDate)
    }
  },
  
  // 默认行程（当大模型调用失败时使用）
  getDefaultItinerary(destination, startDate, endDate) {
    // 计算天数差
    const start = new Date(startDate)
    const end = new Date(endDate)
    const dayCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
    
    const defaultItinerary = []
    
    for (let i = 1; i <= Math.min(dayCount, 7); i++) { // 最多7天默认行程
      const currentDate = new Date(start)
      currentDate.setDate(start.getDate() + i - 1)
      const dateStr = currentDate.toISOString().split('T')[0]
      
      defaultItinerary.push({
        day: i,
        date: dateStr,
        activities: [
          { name: '主要景点参观', time: '09:00-12:00', description: `在${destination}参观主要景点`, location: `${destination}市中心` },
          { name: '午餐', time: '12:00-13:30', description: '品尝当地美食', location: `${destination}特色餐厅` },
          { name: '自由活动', time: '14:00-17:00', description: '根据个人兴趣自由安排', location: `${destination}` },
          { name: '晚餐', time: '18:00-20:00', description: '享用晚餐', location: `${destination}餐厅` }
        ]
      })
    }
    
    return defaultItinerary
  }
}

module.exports = tripService