import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/AuthContext'
import { tripAPI } from '../services/supabaseClient'

function MyTripsPage() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchTrips = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // 调用后端API获取用户的旅行计划列表
        const data = await tripAPI.getUserTrips()
        // 转换数据格式，确保前端使用正确的属性名
        const formattedTrips = data.map(trip => ({
          id: trip.id,
          destination: trip.destination,
          startDate: trip.start_date,
          endDate: trip.end_date,
          budget: trip.budget
        }))
        setTrips(formattedTrips)
      } catch (error) {
        console.error('获取行程列表失败:', error)
        // 出错时显示错误消息
        alert('获取行程列表失败，请稍后重试')
      } finally {
        setLoading(false)
      }
    }

    fetchTrips()
  }, [user])

  if (loading) {
    return <div className="container">加载中...</div>
  }

  if (!user) {
    return (
      <div className="container">
        <p>请先登录查看您的旅行计划</p>
        <Link to="/login">去登录</Link>
      </div>
    )
  }

  return (
    <div className="container">
      <h1>我的旅行计划</h1>
      {trips.length === 0 ? (
        <p>您还没有保存的旅行计划</p>
      ) : (
        <div className="trips-list">
          {trips.map(trip => (
            <Link to={`/trips/${trip.id}`} key={trip.id}>
              <div className="trip-card">
                <h3>{trip.destination}</h3>
                <p>{trip.startDate} - {trip.endDate}</p>
                <p>预算: ¥{trip.budget}</p>
                <Link to={`/trips/${trip.id}`} className="trip-detail-link">查看详情</Link>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyTripsPage