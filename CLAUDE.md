# 3D 大屏系统

## 启动/构建
```bash
npm run dev        # 开发 → http://localhost:5173
npm run build      # 构建
```

## 技术栈
Vite + React 19 + TypeScript + R3F + Ant Design + Zustand + ECharts

## 页面路由
| 路由 | 页面 | 说明 |
|------|------|------|
| `/bigscreen` | BigScreen | 3D 场景主屏（全屏、截图、HUD、图表面板、设备信息） |
| `/dashboard` | Dashboard | 工业看板（2×2 图表网格） |

## 模块架构
```
src/
├── components/
│   ├── three/              ← 3D 场景组件（R3F）
│   │   ├── Scene.tsx             Canvas 入口 + 加载覆盖层
│   │   ├── SceneLights.tsx       光照（半球光 + 方向光阴影）
│   │   ├── Ground.tsx            地面 + 发光网格 + 环形脉冲
│   │   ├── SceneController.tsx   移动/入场动画/箭头/路径淡出
│   │   ├── GroundClickCatcher.tsx 地面点击 → 移动
│   │   ├── Car.tsx               汽车障碍物 + 碰撞框
│   │   ├── Soldier.tsx           士兵（idle/walk/run 动画）
│   │   ├── Queen.tsx             女王（可选角色）
│   │   ├── Batman.tsx            蝙蝠侠（装饰）
│   │   └── PathLine.tsx          路径线
│   ├── business/           ← 业务 UI 覆盖层
│   │   ├── LoadingScreen.tsx     加载进度条
│   │   ├── SceneHUD.tsx          系统监视器（FPS/选中/提示）
│   │   ├── DeviceInfoCard.tsx    设备信息弹窗
│   │   └── ChartPanel.tsx        浮动图表面板
│   └── charts/             ← ECharts 科技风图表
│       ├── OeeTrendChart.tsx     OEE 趋势折线图
│       ├── AlarmPieChart.tsx     报警分布饼图
│       ├── OutputBarChart.tsx    产线产量柱状图
│       └── UtilizationGauge.tsx  设备稼动率仪表盘
├── layouts/MainLayout.tsx        右侧导航布局
├── pages/
│   ├── BigScreen.tsx             大屏页（全屏/截图/面板控制）
│   └── Dashboard.tsx             工业看板页
├── store/sceneStore.ts           Zustand 场景状态
├── utils/
│   ├── modelRegistry.ts          模型引用注册表
│   ├── pathfinder.ts             AABB 避障规划器
│   ├── chartConfig.ts            科技风配色方案
│   └── screenshotCapture.ts      截图工具
└── types/scene.ts                类型定义
```

## 交互流程
1. 点击角色（士兵/女王）→ 选中（显示绿色箭头），可移动
2. 点击障碍物（汽车/蝙蝠侠）→ 显示设备信息卡
3. 选中角色后点击地面 → 路径规划 + 平滑移动 + 路径线淡出
4. 右上角按钮：截图 / HUD / 图表 / 全屏

## 模型
| 文件 | 位置 | 说明 |
|---|---|---|
| `public/models/car.glb` | (0,0,0) | 障碍物 |
| `public/models/Soldier.glb` | (-1.5,0,0) | idle/walk/run 动画 |
| `public/models/queen.glb` | (1.5,0,0) | 可选角色 |
| `public/models/skin.glb` | (0,0.7,0) | 蝙蝠侠装饰 |

## 部署
```bash
docker build -t bigscreen .
docker run -d -p 80:80 bigscreen
```
