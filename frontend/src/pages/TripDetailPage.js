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

  return (
    <div className="container">
      <h1>{trip.destination} 旅行计划</h1>
      <p>日期: {trip.startDate} - {trip.endDate}</p>
      <p>预算: ¥{trip.budget}</p>

      <div className="map-container">
        <MapContainer center={allLocations[0]} zoom={10}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {allLocations.map((location, index) => (
            <Marker key={index} position={location}>
              <Popup>
                <p>{trip.itinerary.flatMap(day => day.activities)[index].name}</p>
                <p>{trip.itinerary.flatMap(day => day.activities)[index].time}</p>
              </Popup>
            </Marker>
          ))}
          {allLocations.length > 1 && <Polyline positions={allLocations} />}
        </MapContainer>
      </div>

      <h2>详细行程</h2>
      {trip.itinerary.map(day => (
        <div key={day.day} className="trip-card">
          <h3>第 {day.day} 天</h3>
          {day.activities.map((activity, index) => (
            <div key={index}>
              <h4>{activity.name}</h4>
              <p>时间: {activity.time}</p>
            </div>
          ))}
        </div>
      ))}

      <h2>预算明细</h2>
      <div className="trip-card">
        <p>住宿: ¥{trip.budgetBreakdown.accommodation}</p>
        <p>交通: ¥{trip.budgetBreakdown.transportation}</p>
        <p>餐饮: ¥{trip.budgetBreakdown.food}</p>
        <p>景点门票: ¥{trip.budgetBreakdown.attractions}</p>
        <p>购物: ¥{trip.budgetBreakdown.shopping}</p>
      </div>
    </div>
  )
}

export default TripDetailPage