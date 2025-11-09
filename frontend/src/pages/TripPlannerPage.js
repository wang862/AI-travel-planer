import React, { useState } from 'react'
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
              style={{ marginRight: '10px' }}
            >
              {isListening ? '停止语音输入' : '开始语音输入'}
            </button>
            {transcript && <p>语音输入: {transcript}</p>}
          </div>
          
          <button type="submit">生成旅行计划</button>
        </form>
      </div>
    </div>
  )
}

export default TripPlannerPage