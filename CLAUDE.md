# 3D 大屏系统

## 启动
```bash
cd bigscreen
npm run dev        # 开发 → http://localhost:5173
npm run build      # 构建
```

## 技术栈
Vite + React 19 + TypeScript + R3F + Ant Design + Zustand

## 模块架构
```
src/
├── components/
│   ├── three/           ← 3D 场景组件（R3F）
│   │   ├── Scene.tsx          Canvas 入口
│   │   ├── SceneLights.tsx    光照
│   │   ├── Ground.tsx         地面 + 网格
│   │   ├── SceneController.tsx 交互 + 移动动画
│   │   ├── Car.tsx            汽车（障碍物）
│   │   ├── Soldier.tsx        士兵（可选角色）
│   │   ├── Queen.tsx          女王（可选角色）
│   │   ├── Batman.tsx         蝙蝠侠（装饰）
│   │   ├── SelectorArrow.tsx  选中箭头
│   │   └── PathLine.tsx       路径线
│   └── business/
│       └── LoadingScreen.tsx  加载进度条
├── layouts/MainLayout.tsx     系统布局（右侧导航）
├── pages/BigScreen.tsx        大屏页（全屏控制）
├── store/sceneStore.ts        zustand 状态
├── utils/
│   ├── pathfinder.ts          AABB 避障规划器
│   └── modelRegistry.ts       模型引用注册表
└── types/scene.ts             类型定义
```

## 模型
| 文件 | 位置 | 说明 |
|---|---|---|
| `public/models/car.glb` | (0,0,0) | 障碍物 |
| `public/models/Soldier.glb` | (-1.5,0,0) | 带动画 |
| `public/models/queen.glb` | (1.5,0,0) | 可选角色 |
| `public/models/skin.glb` | (0,0.7,0) | 蝙蝠侠装饰 |

## 部署
```bash
docker build -t bigscreen .
docker run -d -p 80:80 bigscreen
```

## 开发准则
### 1. 先想后写
- 不确定的先问，有多个方案列出选择
### 2. 保持简单
- 只做被要求的，不造通用抽象
### 3. 手术
刀式修改
- 只动相关代码，匹配既有风格
### 4. 目标驱动
- 复杂任务先列步骤：`[做什么] → 验证：[怎么确认做对了]`
