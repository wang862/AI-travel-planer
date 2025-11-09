import AMapLoader from '@amap/amap-jsapi-loader';

class AMapService {
  constructor() {
    this.map = null;
    this.markers = [];
    this.polylines = [];
    this.infoWindows = [];
  }

  // 初始化地图
  async initMap(containerId, options = {}) {
    try {
      // 加载高德地图API
      await AMapLoader.load({
        key: '您的高德地图API密钥', // 需要替换为真实的API密钥
        version: '2.0',
        plugins: ['AMap.Marker', 'AMap.InfoWindow', 'AMap.Polyline', 'AMap.Geocoder']
      });

      // 创建地图实例
      this.map = new AMap.Map(containerId, {
        zoom: options.zoom || 12,
        center: options.center || [116.397428, 39.90923], // 默认北京
        viewMode: '3D',
        mapStyle: 'amap://styles/light'
      });

      // 添加地图控件
      this.map.addControl(new AMap.ToolBar());
      this.map.addControl(new AMap.Scale());

      return this.map;
    } catch (error) {
      console.error('初始化高德地图失败:', error);
      throw error;
    }
  }

  // 设置地图中心点和缩放级别
  setCenter(center, zoom = null) {
    if (this.map) {
      this.map.setCenter(center);
      if (zoom) {
        this.map.setZoom(zoom);
      }
    }
  }

  // 清除所有标记
  clearMarkers() {
    if (this.markers.length > 0) {
      this.map.remove(this.markers);
      this.markers = [];
    }
  }

  // 清除所有折线
  clearPolylines() {
    if (this.polylines.length > 0) {
      this.map.remove(this.polylines);
      this.polylines = [];
    }
  }

  // 清除所有信息窗口
  clearInfoWindows() {
    if (this.infoWindows.length > 0) {
      this.infoWindows.forEach(infoWindow => infoWindow.close());
      this.infoWindows = [];
    }
  }

  // 添加单个标记
  addMarker(position, options = {}) {
    if (!this.map) return null;

    const marker = new AMap.Marker({
      position: position,
      title: options.title || '',
      content: options.content || '',
      icon: options.icon || null
    });

    this.map.add(marker);
    this.markers.push(marker);

    // 添加信息窗口
    if (options.infoContent) {
      const infoWindow = new AMap.InfoWindow({
        content: options.infoContent,
        offset: new AMap.Pixel(0, -30)
      });

      marker.on('click', () => {
        infoWindow.open(this.map, position);
      });

      this.infoWindows.push(infoWindow);
    }

    return marker;
  }

  // 批量添加标记
  addMarkers(markersData) {
    if (!this.map || !Array.isArray(markersData)) return [];

    const newMarkers = markersData.map(data => 
      this.addMarker(data.position, data.options)
    );

    return newMarkers;
  }

  // 添加折线
  addPolyline(path, options = {}) {
    if (!this.map || !Array.isArray(path)) return null;

    const polyline = new AMap.Polyline({
      path: path,
      strokeColor: options.strokeColor || '#1890ff',
      strokeWeight: options.strokeWeight || 5,
      strokeOpacity: options.strokeOpacity || 0.8,
      strokeStyle: options.strokeStyle || 'solid',
      lineJoin: options.lineJoin || 'round'
    });

    this.map.add(polyline);
    this.polylines.push(polyline);

    return polyline;
  }

  // 根据地址获取经纬度（地理编码）
  async getLocationByAddress(address) {
    try {
      const geocoder = new AMap.Geocoder();
      return new Promise((resolve, reject) => {
        geocoder.getLocation(address, (status, result) => {
          if (status === 'complete' && result.geocodes && result.geocodes.length > 0) {
            const { location } = result.geocodes[0];
            resolve([location.lng, location.lat]);
          } else {
            reject(new Error(`地理编码失败: ${result.info}`));
          }
        });
      });
    } catch (error) {
      console.error('地理编码错误:', error);
      throw error;
    }
  }

  // 根据经纬度获取地址（逆地理编码）
  async getAddressByLocation(location) {
    try {
      const geocoder = new AMap.Geocoder();
      return new Promise((resolve, reject) => {
        geocoder.getAddress(location, (status, result) => {
          if (status === 'complete' && result.regeocode) {
            resolve(result.regeocode.formattedAddress);
          } else {
            reject(new Error(`逆地理编码失败: ${result.info}`));
          }
        });
      });
    } catch (error) {
      console.error('逆地理编码错误:', error);
      throw error;
    }
  }

  // 计算两点之间的路径
  async calculateRoute(start, end, options = {}) {
    try {
      const driving = new AMap.Driving({
        map: this.map,
        panel: options.panel || null,
        policy: options.policy || AMap.DrivingPolicy.LEAST_TIME
      });

      return new Promise((resolve, reject) => {
        driving.search(start, end, (status, result) => {
          if (status === 'complete' && result.routes && result.routes.length > 0) {
            resolve(result.routes[0]);
          } else {
            reject(new Error(`路径规划失败: ${result.info}`));
          }
        });
      });
    } catch (error) {
      console.error('路径规划错误:', error);
      throw error;
    }
  }

  // 销毁地图实例
  destroy() {
    if (this.map) {
      this.clearMarkers();
      this.clearPolylines();
      this.clearInfoWindows();
      this.map.destroy();
      this.map = null;
    }
  }
}

// 导出单例
export default new AMapService();