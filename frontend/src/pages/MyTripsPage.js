import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/AuthContext'

function MyTripsPage() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    // 这里应该调用后端API获取用户的旅行计划列表
    // 模拟数据
    const mockTrips = [
      {
        id: '1',
        destination: '北京',
        startDate: '2023-07-15',
        endDate: '2023-07-20',
        budget: 5000
      },
      {
        id: '2',
        destination: '上海',
        startDate: '2023-08-10',
        endDate: '2023-08-15',
        budget: 6000
      }
    ]

    setTrips(mockTrips)
    setLoading(false)
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
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyTripsPage