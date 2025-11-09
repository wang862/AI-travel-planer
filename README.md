# AI-travel-planer
智能旅行规划助手 - 基于大语言模型的个性化旅行规划系统

## 一、项目概述

本项目旨在简化旅行规划过程，通过 AI 技术了解用户需求，自动生成详细的旅行路线和建议，并提供实时旅行辅助功能。系统集成了多种现代技术，包括大语言模型、语音识别、地图可视化和用户数据管理，为用户提供一站式的旅行规划解决方案。

## 二、已实现功能

### 1. 用户认证与管理
- 完整的用户注册、登录功能（基于Supabase）
- 个人行程数据的安全存储与管理
- 用户会话管理和权限控制

### 2. 行程规划与管理
- 行程创建、查看、编辑和删除功能
- 基于阿里云大语言模型的智能行程生成
- 行程预算明细和费用管理
- 行程活动安排与时间规划

### 3. 地图可视化
- 基于高德地图API的行程可视化展示
- 行程地点标记和信息窗口
- 行程路线连接和导航规划
- 智能地图中心点计算和视野调整

### 4. 地理位置服务
- 地理编码与逆地理编码
- POI搜索和位置信息增强
- 路径规划和距离计算

### 5. 语音识别（待完善）
- 集成科大讯飞语音识别API

## 三、技术栈

### 前端
- React.js - 构建用户界面
- React Router - 路由管理
- Axios - API请求
- @amap/amap-jsapi-loader - 高德地图加载器
- Supabase.js - 用户认证和数据交互

### 后端
- Node.js - 服务器环境
- Express.js - Web框架
- Supabase - 数据库和认证服务
- Axios - API请求
- 阿里云大语言模型 - 智能行程生成
- 高德地图API - 地理位置服务

## 四、安装与运行

### 前置条件
- Node.js 16.x 或更高版本
- npm 或 yarn 包管理器

### 安装步骤

#### 1. 克隆项目
```bash
git clone [仓库地址]
cd AI-travel-planer
```

#### 2. 后端配置与运行
```bash
cd backend
npm install

# 配置环境变量
cp config/.env.example config/.env
cp config/.env.amap.example config/.env
# 编辑 .env 文件，填入所需的 API 密钥和配置信息

npm start
```

#### 3. 前端配置与运行
```bash
cd ../frontend
npm install
npm run dev
```

## 五、API配置说明

### 1. 高德地图API
- 配置文件：`backend/config/.env`
- 配置项：`AMAP_KEY=your_amap_key`
- 功能：提供地理编码、路径规划、地图可视化等服务

### 2. Supabase配置
- 配置文件：`backend/config/.env` 和 `frontend/src/services/supabaseClient.js`
- 主要配置：
  - Project URL
  - anon public key
  - service role secret
- 功能：用户认证、数据存储和查询

### 3. 阿里云大语言模型API
- 配置文件：`backend/config/.env`
- 配置项：`DASHSCOPE_API_KEY=your_api_key`
- 功能：智能行程生成和优化

### 4. 科大讯飞语音识别API
- 配置文件：待配置
- 所需配置：APPID、APISecret、APIKey
- 功能：语音识别和转换

## 六、项目结构

```
AI-travel-planer/
├── backend/                  # 后端代码
│   ├── config/               # 配置文件
│   ├── src/                  # 源代码
│   │   ├── controllers/      # 控制器
│   │   ├── services/         # 服务层
│   │   ├── routes/           # 路由
│   │   └── models/           # 数据模型
│   └── package.json          # 后端依赖
├── frontend/                 # 前端代码
│   ├── src/                  # 源代码
│   │   ├── pages/            # 页面组件
│   │   ├── components/       # 通用组件
│   │   ├── services/         # 服务层
│   │   └── assets/           # 静态资源
│   └── package.json          # 前端依赖
```

## 七、使用说明

1. **用户注册与登录**
   - 访问前端应用，点击注册按钮创建新账户
   - 使用注册的邮箱和密码登录系统

2. **创建旅行规划**
   - 登录后，点击"创建行程"按钮
   - 填写目的地、日期、预算等信息
   - 系统将自动生成初步行程规划

3. **查看与编辑行程**
   - 在"我的行程"页面查看所有行程
   - 点击行程卡片进入详情页面
   - 在详情页面可以查看地图可视化、编辑行程活动和预算

4. **地图功能使用**
   - 行程详情页面显示高德地图
   - 地图上标记了行程中的所有活动地点
   - 可查看地点详情，地图自动调整视角展示所有地点

## 八、注意事项

1. 使用前请确保已正确配置所有API密钥
2. 高德地图API需要申请并获取有效的密钥
3. 项目目前仍在开发中，部分功能可能需要进一步完善
4. 语音识别功能尚未完全集成到主应用中