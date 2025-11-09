# AI-travel-planer
大语言模型辅助软件工程第三次作业

一、说明：

软件旨在简化旅行规划过程，通过 AI 了解用户需求，自动生成详细的旅行路线和建议，并提供实时旅行辅助。

二、核心功能：
1、该软件是一个可以生成用户个性化旅行规划的工具，支持用户语音或者文字输入旅行要求（语音输入通过调用科大讯飞开放平台api转成文字），包括：时间、地点、预算、特殊要求等，将用户旅行需求通过调用阿里云大语言模型API，生成符合用户要求的旅行规划。然后使用高德地图API，根据规划中的地点，生成详细的路线地图。
2、软件支持用户数据管理，使用Supabase（用户认证 / 云端存储），可以支持用户注册登录，用户可以在软件中保存自己的旅行规划，以及记录旅行开销。
3、语音识别：基于科大讯飞语音识别 API 提供语音识别功能
4、地图导航：基于高德地图 API 提供地理位置服务和导航功能，调用地图 API，在页面加载目的地地图，将行程中的景点、餐厅坐标标记在地图上，支持导航路线查询。
5、数据存储/认证： Supabase。
6、行程规划和费用预算：通过大语言模型完成形成规划和费用预算的估计。
7、UI/UX： 地图为主的交互界面，清晰的行程展示，美观的图片。

三、api使用说明(如果所需的api信息未提供，需要告知我)
1、语音识别api使用讯飞开放平台的语音识别api，api文档在中英识别大模型API文档中有详细说明。
#以下是我注册的api信息：
APPID 8b96d643
APISecret MTQ3N2Q5MDgyODBkNmEwY2YxYmI0ODE1
APIKey 889ae9990c87b34399a15ff2e2109a3a

2、旅行规划api使用阿里云大语言模型API。API Key已经配置到了环境变量中变量名DASHSCOPE_API_KEY，OpenAI的Python SDK或DashScope的Python SDK已经安装好了，可以用来调用阿里云百炼平台上的模型。
通义千问的api参考文档已经存放在“通义千问api参考”中。
#以下是我注册的api信息：
sk-7880f4e41cfe4d00a8ec4ec926655c16

3、地图导航使用高德地图Web服务 API。（如果需要具体哪种功能的文档，请告诉我）
具体参考文档：https://lbs.amap.com/api/webservice/guide/api/georegeo
#以下是我注册的api信息：
key: cc306c96c0b3c50c2843bd0515a1095f

4、用户数据管理使用Supabase（用户认证 / 云端存储）。

#以下是我注册的api信息
Project URL：https://nvvdcxfweiyxaekowaaq.supabase.co
anon public:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52dmRjeGZ3ZWl5eGFla293YWFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NjY4NjQsImV4cCI6MjA3ODI0Mjg2NH0.BzITlFdiCDe0H4BT4GISe3uMewslM6bg_hB-ckKMkjs
service_role secret:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52dmRjeGZ3ZWl5eGFla293YWFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjY2Njg2NCwiZXhwIjoyMDc4MjQyODY0fQ.Z0oCX3UGm42sedk-UN7rIiLd_GWaiMUG78WVD20en0s