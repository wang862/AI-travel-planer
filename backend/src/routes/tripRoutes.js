const express = require('express')
const router = express.Router()
const tripService = require('../services/tripService')
const authMiddleware = require('../middleware/authMiddleware')

// 应用认证中间件到所有行程路由
router.use(authMiddleware)

// 获取用户的所有旅行计划
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId
    const trips = await tripService.getUserTrips(userId)
    
    // 转换数据格式以保持前端兼容性
    const formattedTrips = trips.map(trip => ({
      id: trip.id,
      destination: trip.destination,
      startDate: trip.start_date,
      endDate: trip.end_date,
      budget: trip.budget,
      createdAt: trip.created_at,
      // 添加简要的行程预览
      itineraryPreview: trip.itinerary && trip.itinerary.length > 0 ? 
        `${trip.itinerary.length}天行程` : 
        '暂无行程'
    }))
    
    res.json({
      success: true,
      trips: formattedTrips
    })
  } catch (error) {
    console.error('获取行程列表错误:', error)
    res.status(500).json({
      success: false,
      message: error.message || '获取行程列表失败'
    })
  }
})

// 获取特定旅行计划详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId
    
    const trip = await tripService.getTripById(id, userId)
    
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: '行程不存在'
      })
    }
    
    res.json({
      success: true,
      ...trip
    })
  } catch (error) {
    console.error('获取行程详情错误:', error)
    res.status(500).json({
      success: false,
      message: error.message || '获取行程详情失败'
    })
  }
})

// 创建新的旅行计划
router.post('/', async (req, res) => {
  try {
    const userId = req.user.userId
    const { destination, startDate, endDate, budget, preferences } = req.body
    
    // 验证必要参数
    if (!destination || !startDate || !endDate || !budget) {
      return res.status(400).json({
        success: false,
        message: '目的地、开始日期、结束日期和预算都是必填项'
      })
    }
    
    // 创建行程
    const tripData = {
      userId,
      destination,
      startDate,
      endDate,
      budget: parseInt(budget, 10),
      preferences
    }
    
    const newTrip = await tripService.createTrip(tripData)
    
    res.status(201).json({
      success: true,
      trip: newTrip
    })
  } catch (error) {
    console.error('创建行程错误:', error)
    res.status(500).json({
      success: false,
      message: error.message || '创建行程失败'
    })
  }
})

// 更新旅行计划
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId
    const updateData = req.body
    
    const updatedTrip = await tripService.updateTrip(id, userId, updateData)
    
    if (!updatedTrip) {
      return res.status(404).json({
        success: false,
        message: '行程不存在或无权限修改'
      })
    }
    
    res.json({
      success: true,
      trip: updatedTrip
    })
  } catch (error) {
    console.error('更新行程错误:', error)
    res.status(500).json({
      success: false,
      message: error.message || '更新行程失败'
    })
  }
})

// 删除旅行计划
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId
    
    const success = await tripService.deleteTrip(id, userId)
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: '行程不存在或无权限删除'
      })
    }
    
    res.json({
      success: true,
      message: '行程删除成功'
    })
  } catch (error) {
    console.error('删除行程错误:', error)
    res.status(500).json({
      success: false,
      message: error.message || '删除行程失败'
    })
  }
})

module.exports = router