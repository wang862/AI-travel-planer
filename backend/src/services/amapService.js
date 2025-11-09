const axios = require('axios');

class AMapService {
  constructor() {
    this.apiKey = process.env.AMAP_API_KEY || ''; // 从环境变量获取API密钥
    this.baseUrl = 'https://restapi.amap.com/v3';
  }

  /**
   * 地理编码 - 根据地址获取经纬度
   * @param {string} address - 地址信息
   * @param {string} city - 城市（可选）
   * @returns {Promise} - 包含经纬度的Promise
   */
  async geocode(address, city = '') {
    try {
      const response = await axios.get(`${this.baseUrl}/geocode/geo`, {
        params: {
          key: this.apiKey,
          address: address,
          city: city,
          output: 'json'
        }
      });

      if (response.data.status === '1' && response.data.geocodes && response.data.geocodes.length > 0) {
        const location = response.data.geocodes[0].location.split(',');
        return {
          lng: parseFloat(location[0]),
          lat: parseFloat(location[1]),
          formattedAddress: response.data.geocodes[0].formatted_address
        };
      } else {
        throw new Error(`地理编码失败: ${response.data.info}`);
      }
    } catch (error) {
      console.error('地理编码错误:', error.message);
      throw error;
    }
  }

  /**
   * 逆地理编码 - 根据经纬度获取地址
   * @param {number} lat - 纬度
   * @param {number} lng - 经度
   * @returns {Promise} - 包含地址信息的Promise
   */
  async reverseGeocode(lat, lng) {
    try {
      const response = await axios.get(`${this.baseUrl}/geocode/regeo`, {
        params: {
          key: this.apiKey,
          location: `${lng},${lat}`,
          output: 'json',
          extensions: 'base'
        }
      });

      if (response.data.status === '1' && response.data.regeocode) {
        return {
          formattedAddress: response.data.regeocode.formatted_address,
          addressComponent: response.data.regeocode.addressComponent
        };
      } else {
        throw new Error(`逆地理编码失败: ${response.data.info}`);
      }
    } catch (error) {
      console.error('逆地理编码错误:', error.message);
      throw error;
    }
  }

  /**
   * 路径规划 - 驾车路线
   * @param {Object} origin - 起点 {lat, lng}
   * @param {Object} destination - 终点 {lat, lng}
   * @param {Object} options - 可选参数
   * @returns {Promise} - 路径规划结果
   */
  async drivingRoute(origin, destination, options = {}) {
    try {
      const response = await axios.get(`${this.baseUrl}/direction/driving`, {
        params: {
          key: this.apiKey,
          origin: `${origin.lng},${origin.lat}`,
          destination: `${destination.lng},${destination.lat}`,
          strategy: options.strategy || 0, // 0-推荐路线，1-最短路线，2-最快路线
          output: 'json'
        }
      });

      if (response.data.status === '1' && response.data.route && response.data.route.paths.length > 0) {
        const path = response.data.route.paths[0];
        return {
          distance: path.distance, // 距离（米）
          duration: path.duration, // 时间（秒）
          steps: path.steps, // 路段信息
          polyline: path.polyline // 路线坐标点
        };
      } else {
        throw new Error(`路径规划失败: ${response.data.info}`);
      }
    } catch (error) {
      console.error('路径规划错误:', error.message);
      throw error;
    }
  }

  /**
   * 地点搜索 - 搜索周边POI
   * @param {Object} location - 中心点 {lat, lng}
   * @param {string} keywords - 搜索关键词
   * @param {Object} options - 可选参数
   * @returns {Promise} - 搜索结果
   */
  async searchPoi(location, keywords, options = {}) {
    try {
      const response = await axios.get(`${this.baseUrl}/place/around`, {
        params: {
          key: this.apiKey,
          location: `${location.lng},${location.lat}`,
          keywords: keywords,
          radius: options.radius || 1000, // 搜索半径（米）
          types: options.types || '', // POI类型
          offset: options.offset || 20, // 返回结果数量
          page: options.page || 1, // 页码
          output: 'json'
        }
      });

      if (response.data.status === '1') {
        return {
          total: parseInt(response.data.count),
          pois: response.data.pois.map(poi => ({
            id: poi.id,
            name: poi.name,
            location: {
              lng: parseFloat(poi.location.split(',')[0]),
              lat: parseFloat(poi.location.split(',')[1])
            },
            address: poi.address,
            tel: poi.tel,
            type: poi.type,
            businessArea: poi.business_area
          }))
        };
      } else {
        throw new Error(`POI搜索失败: ${response.data.info}`);
      }
    } catch (error) {
      console.error('POI搜索错误:', error.message);
      throw error;
    }
  }

  /**
   * 批量地理编码 - 为多个地址获取经纬度
   * @param {Array} addresses - 地址数组
   * @returns {Promise} - 包含所有地址经纬度的Promise
   */
  async batchGeocode(addresses) {
    try {
      const geocodePromises = addresses.map(async (addressInfo) => {
        try {
          const result = await this.geocode(
            addressInfo.address,
            addressInfo.city || ''
          );
          return {
            original: addressInfo,
            success: true,
            data: result
          };
        } catch (error) {
          return {
            original: addressInfo,
            success: false,
            error: error.message
          };
        }
      });

      return Promise.all(geocodePromises);
    } catch (error) {
      console.error('批量地理编码错误:', error.message);
      throw error;
    }
  }

  /**
   * 为行程中的活动添加位置信息
   * @param {Array} itinerary - 行程数据
   * @returns {Promise} - 添加位置信息后的行程
   */
  async enrichItineraryWithLocations(itinerary) {
    try {
      const enrichedItinerary = [];

      for (const day of itinerary) {
        const enrichedDay = { ...day, activities: [] };

        for (const activity of day.activities) {
          let enrichedActivity = { ...activity };

          // 如果活动没有位置信息或者只有名称，尝试进行地理编码
          if (!activity.location || typeof activity.location === 'string') {
            try {
              const locationName = typeof activity.location === 'string' 
                ? activity.location 
                : `${activity.name}`;
              
              const locationData = await this.geocode(locationName);
              enrichedActivity.location = {
                lat: locationData.lat,
                lng: locationData.lng,
                address: locationData.formattedAddress
              };
            } catch (error) {
              console.warn(`无法获取"${activity.name}"的位置信息:`, error.message);
              // 保留原始位置信息
              if (!enrichedActivity.location) {
                enrichedActivity.location = null;
              }
            }
          }

          enrichedDay.activities.push(enrichedActivity);
        }

        enrichedItinerary.push(enrichedDay);
      }

      return enrichedItinerary;
    } catch (error) {
      console.error('行程位置信息增强错误:', error.message);
      throw error;
    }
  }
}

module.exports = new AMapService();