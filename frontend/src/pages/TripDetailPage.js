import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useAuth } from '../hooks/AuthContext'

function TripDetailPage() {
  const { id } = useParams()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    // 这里应该调用后端API获取旅行计划详情
    // 模拟数据
    const mockTrip = {
      id: id,
      destination: '北京',
      startDate: '2023-07-15',
      endDate: '2023-07-20',
      budget: 5000,
      itinerary: [
        {
          day: 1,
          activities: [
            { name: '故宫', time: '09:00-12:00', location: { lat: 39.916345, lng: 116.397155 } },
            { name: '天安门广场', time: '13:00-14:30', location: { lat: 39.9042, lng: 116.4074 } },
            { name: '王府井步行街', time: '15:00-18:00', location: { lat: 39.9147, lng: 116.4135 } }
          ]
        },
        {
          day: 2,
          activities: [
            { name: '长城', time: '08:00-14:00', location: { lat: 40.431908, lng: 116.570374 } },
            { name: '颐和园', time: '15:00-18:00', location: { lat: 39.9998, lng: 116.2751 } }
          ]
        }
      ],
      budgetBreakdown: {
        accommodation: 2000,
        transportation: 1000,
        food: 1000,
        attractions: 500,
        shopping: 500
      }
    }
    
    setTrip(mockTrip)
    setLoading(false)
  }, [id])

  if (loading) {
    return <div className="container">加载中...</div>
  }

  if (!trip) {
    return <div className="container">未找到旅行计划</div>
  }

  // 提取所有位置用于地图显示
  const allLocations = trip.itinerary.flatMap(day => day.activities.map(activity => activity.location))

  const handleDeleteTrip = async () => {
    if (window.confirm('确定要删除这个旅行计划吗？此操作无法撤销。')) {
      try {
        await tripAPI.deleteTrip(id)
        alert('旅行计划删除成功')
        navigate('/my-trips')
      } catch (error) {
        console.error('删除行程失败:', error)
        alert('删除失败，请稍后重试')
      }
    }
  }

  // 计算地图中心点（取第一个有位置信息的活动）
  const getMapCenter = () => {
    for (const day of trip.itinerary) {
      for (const activity of day.activities) {
        if (activity.location && activity.location.lat && activity.location.lng) {
          return [activity.location.lat, activity.location.lng]
        }
      }
    }
    // 默认中心点（北京）
    return [39.9042, 116.4074]
  }

  return (
    <div className="container">
      <div className="trip-header">
        <h1>{trip.destination}旅行计划</h1>
        <div className="trip-actions">
          <button onClick={() => navigate('/my-trips')} className="btn-back">返回列表</button>
          <button onClick={handleDeleteTrip} className="btn-delete">删除行程</button>
        </div>
      </div>
      
      <div className="trip-info">
        <p><strong>日期：</strong>{trip.startDate} - {trip.endDate}</p>
        <p><strong>预算：</strong>¥{trip.budget}</p>
        {trip.preferences && <p><strong>特殊要求：</strong>{trip.preferences}</p>}
        <p><strong>创建时间：</strong>{new Date(trip.createdAt).toLocaleString()}</p>
      </div>
      
      <h2>行程安排</h2>
      {trip.itinerary.length > 0 ? (
        trip.itinerary.map(day => (
          <div key={day.day} className="day-itinerary">
            <h3>第{day.day}天{day.date ? ` (${day.date})` : ''}</h3>
            <ul>
              {day.activities.map((activity, index) => (
                <li key={index} className="activity-item">
                  <div className="activity-time">{activity.time}</div>
                  <div className="activity-content">
                    <strong>{activity.name}</strong>
                    {activity.description && <p>{activity.description}</p>}
                    {activity.location && typeof activity.location === 'string' && (
                      <p className="activity-location">地点：{activity.location}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <p>暂无行程安排</p>
      )}
      
      <h2>预算明细</h2>
      <div className="budget-breakdown">
        <p>住宿: ¥{trip.budgetBreakdown.accommodation}</p>
        <p>交通: ¥{trip.budgetBreakdown.transportation}</p>
        <p>餐饮: ¥{trip.budgetBreakdown.food}</p>
        <p>景点门票: ¥{trip.budgetBreakdown.attractions}</p>
        <p>购物: ¥{trip.budgetBreakdown.shopping}</p>
        <hr />
        <p><strong>总计: ¥{trip.budget}</strong></p>
      </div>
      
      <h2>行程地图</h2>
      <div className="map-container">
        <MapContainer center={getMapCenter()} zoom={12} style={{ height: '400px', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {trip.itinerary.flatMap(day => day.activities).map((activity, index) => (
            activity.location && activity.location.lat && activity.location.lng && (
              <Marker key={index} position={[activity.location.lat, activity.location.lng]}>
                <Popup>{activity.name} ({activity.time})</Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </div>
    </div>
  )
}

export default TripDetailPage