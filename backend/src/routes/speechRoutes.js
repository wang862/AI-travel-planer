const express = require('express')
const router = express.Router()
const multer = require('multer')
const speechController = require('../controllers/speechController')

// 配置文件上传
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

// 语音转文字
router.post('/', upload.single('audio'), speechController.speechToText)

module.exports = router