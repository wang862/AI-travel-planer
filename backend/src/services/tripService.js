const { createClient } = require('@supabase/supabase-js')

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

  // 调用LLM生成行程（模拟实现）
  async generateItinerary(destination, startDate, endDate, preferences) {
    // 这里应该调用阿里云的大语言模型API
    // 模拟返回行程数据
    return [
      {
        day: 1,
        activities: [
          { name: '抵达并入住酒店', time: '14:00-15:00' },
          { name: '城市概览', time: '16:00-18:00' },
          { name: '当地美食体验', time: '19:00-21:00' }
        ]
      },
      {
        day: 2,
        activities: [
          { name: '主要景点参观', time: '09:00-12:00' },
          { name: '午餐', time: '12:00-13:30' },
          { name: '文化体验活动', time: '14:00-17:00' }
        ]
      }
    ]
  }
}

module.exports = tripService