const tripService = require('../services/tripService')

const tripController = {
  // 创建旅行计划
  async createTrip(req, res) {
    try {
      const tripData = req.body
      const userId = req.user.id
      const newTrip = await tripService.createTrip(tripData, userId)
      res.status(201).json(newTrip)
    } catch (error) {
      res.status(400).json({ error: error.message })
    }
  },

  // 获取用户的所有旅行计划
  async getUserTrips(req, res) {
    try {
      const userId = req.user.id
      const trips = await tripService.getUserTrips(userId)
      res.json(trips)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  // 获取单个旅行计划详情
  async getTripById(req, res) {
    try {
      const { id } = req.params
      const userId = req.user.id
      const trip = await tripService.getTripById(id, userId)
      
      if (!trip) {
        return res.status(404).json({ error: '旅行计划不存在' })
      }
      
      res.json(trip)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  // 更新旅行计划
  async updateTrip(req, res) {
    try {
      const { id } = req.params
      const tripData = req.body
      const userId = req.user.id
      
      const updatedTrip = await tripService.updateTrip(id, tripData, userId)
      
      if (!updatedTrip) {
        return res.status(404).json({ error: '旅行计划不存在或无权更新' })
      }
      
      res.json(updatedTrip)
    } catch (error) {
      res.status(400).json({ error: error.message })
    }
  },

  // 删除旅行计划
  async deleteTrip(req, res) {
    try {
      const { id } = req.params
      const userId = req.user.id
      
      const success = await tripService.deleteTrip(id, userId)
      
      if (!success) {
        return res.status(404).json({ error: '旅行计划不存在或无权删除' })
      }
      
      res.json({ message: '旅行计划删除成功' })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }
}

module.exports = tripController