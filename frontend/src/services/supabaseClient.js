import { createClient } from '@supabase/supabase-js'

// Supabase配置
const SUPABASE_URL = 'https://nvvdcxfweiyxaekowaaq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52dmRjeGZ3ZWl5eGFla293YWFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NjY4NjQsImV4cCI6MjA3ODI0Mjg2NH0.BzITlFdiCDe0H4BT4GISe3uMewslM6bg_hB-ckKMkjs'

// 创建Supabase客户端实例
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// API服务基础URL
export const API_BASE_URL = 'http://localhost:5000/api'

// API请求工具函数
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  
  // 从Supabase获取当前会话令牌
  const { data: { session } } = await supabase.auth.getSession()
  
  // 设置默认headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }
  
  // 如果有认证令牌，添加到请求头
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }
  
  const config = {
    ...options,
    headers
  }
  
  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP错误! 状态: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API请求失败:', error)
    throw error
  }
}

// 认证相关API
export const authAPI = {
  async register(email, password) {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
  },
  
  async login(email, password) {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
  },
  
  async getCurrentUser() {
    return apiRequest('/auth/me')
  }
}

// 行程相关API
export const tripAPI = {
  async createTrip(tripData) {
    return apiRequest('/trips', {
      method: 'POST',
      body: JSON.stringify(tripData)
    })
  },
  
  async getUserTrips() {
    return apiRequest('/trips')
  },
  
  async getTripById(tripId) {
    return apiRequest(`/trips/${tripId}`)
  },
  
  async updateTrip(tripId, tripData) {
    return apiRequest(`/trips/${tripId}`, {
      method: 'PUT',
      body: JSON.stringify(tripData)
    })
  },
  
  async deleteTrip(tripId) {
    return apiRequest(`/trips/${tripId}`, {
      method: 'DELETE'
    })
  }
}