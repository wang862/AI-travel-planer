const express = require('express')
const router = express.Router()
const tripController = require('../controllers/tripController')
const authMiddleware = require('../middleware/authMiddleware')

// 创建旅行计划
router.post('/', authMiddleware, tripController.createTrip)

// 获取用户的所有旅行计划
router.get('/', authMiddleware, tripController.getUserTrips)

// 获取单个旅行计划详情
router.get('/:id', authMiddleware, tripController.getTripById)

// 更新旅行计划
router.put('/:id', authMiddleware, tripController.updateTrip)

// 删除旅行计划
router.delete('/:id', authMiddleware, tripController.deleteTrip)

module.exports = router