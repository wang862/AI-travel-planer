import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/AuthContext'
import { useSpeechRecognition } from '../hooks/SpeechRecognitionHook'

function TripPlannerPage() {
  const [tripData, setTripData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    interests: '',
    requirements: ''
  })
  const { user } = useAuth()
  const { startListening, stopListening, transcript, isListening } = useSpeechRecognition()
  const navigate = useNavigate()
  
  // 当语音识别结果变化时，尝试解析并填充表单
  useEffect(() => {
    if (transcript) {
      parseVoiceInput(transcript)
    }
  }, [transcript])
  
  // 解析语音输入内容，提取旅行信息
  const parseVoiceInput = (text) => {
    // 简单的正则表达式匹配来提取信息
    const destinationMatch = text.match(/去([\u4e00-\u9fa5]+)(?:旅行|旅游|玩)/)
    const budgetMatch = text.match(/预算(\d+)元/)
    const daysMatch = text.match(/(\d+)天/)
    
    const newData = { ...tripData }
    
    // 提取目的地
    if (destinationMatch && destinationMatch[1]) {
      newData.destination = destinationMatch[1]
    }
    
    // 提取预算
    if (budgetMatch && budgetMatch[1]) {
      newData.budget = budgetMatch[1]
    }
    
    // 如果有天数信息，计算日期范围
    if (daysMatch && daysMatch[1]) {
      const days = parseInt(daysMatch[1])
      const today = new Date()
      const startDate = today.toISOString().split('T')[0]
      
      const endDate = new Date(today)
      endDate.setDate(today.getDate() + days)
      const endDateStr = endDate.toISOString().split('T')[0]
      
      newData.startDate = startDate
      newData.endDate = endDateStr
    }
    
    // 设置要求字段为完整的语音识别结果
    newData.requirements = text
    
    setTripData(newData)
  }

  const handleChange = (e) => {
    setTripData({
      ...tripData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // 这里将调用后端API生成旅行计划
    console.log('提交旅行计划请求:', tripData)
    alert('旅行计划生成中，请稍候...')
  }

  return (
    <div className="container">
      <h1>规划您的旅行</h1>
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div>
            <label>目的地</label>
            <input
              type="text"
              name="destination"
              value={tripData.destination}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <label>开始日期</label>
            <input
              type="date"
              name="startDate"
              value={tripData.startDate}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <label>结束日期</label>
            <input
              type="date"
              name="endDate"
              value={tripData.endDate}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <label>预算</label>
            <input
              type="number"
              name="budget"
              value={tripData.budget}
              onChange={handleChange}
              required
              placeholder="请输入预算金额"
            />
          </div>
          
          <div>
            <label>兴趣偏好</label>
            <input
              type="text"
              name="interests"
              value={tripData.interests}
              onChange={handleChange}
              placeholder="例如：美食、历史、自然风景"
            />
          </div>
          
          <div>
            <label>特殊要求</label>
            <textarea
              name="requirements"
              value={tripData.requirements}
              onChange={handleChange}
              rows="4"
              placeholder="请输入任何特殊要求"
            />
          </div>
          
          <div>
            <button 
              type="button" 
              onClick={isListening ? stopListening : startListening}
              style={{ marginRight: '10px', backgroundColor: isListening ? '#ff4444' : '#4CAF50', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              {isListening ? '🔴 停止语音输入' : '🎤 开始语音输入'}
            </button>
            {transcript && (
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                <p><strong>语音识别结果:</strong> {transcript}</p>
                {Object.entries(tripData).some(([key, value]) => value) && (
                  <p><em>已自动填充识别到的信息</em></p>
                )}
              </div>
            )}
            <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>请尝试说类似这样的话："我想去北京旅行，预算5000元，计划玩5天"</p>
          </div>
          
          <button type="submit">生成旅行计划</button>
        </form>
      </div>
    </div>
  )
}

export default TripPlannerPage