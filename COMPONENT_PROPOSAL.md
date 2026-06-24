# 团队组件抽取提案 · three-demo 模块化重构

> **背景：** 本项目 original 架构中 `main.js`（541 行）是一个"大泥球"——场景初始化、模型加载、点击交互、移动逻辑、骨骼动画全部杂糅在一个文件里。虽然功能完整，但难以维护、无法复用。
>
> **目标：** 用 SaaS 前端的组件化思维，将大泥球拆解为**高内聚、低耦合**的独立模块。
>
> **日期：** 2026-06-25（M01 · SaaS 副线日）

---

## 一、当前代码结构（重构前）

```
main.js (541行)            ← 大泥球：所有逻辑混在一起
├─ 场景/相机/渲染器 (L10-32)
├─ 轨道控制器 (L34-40)
├─ 进度跟踪 (L46-65)
├─ 模型加载 × 4 (L99-226)
├─ 光照/地面/网格 (L228-258)
├─ 选中箭头 (L260-269)
├─ 动画循环 (L274-369)
├─ 选中/交互 (L374-539)
└─ 路径绘制 (L541)

pathfinder.js (228行)      ← ✅ 已经抽离的模块
└─ createAABBAvoidance()
```

**问题：** 动画循环（数据更新）和交互逻辑（事件处理）共享同一批变量（`selectedModel`、`moveQueue`、`pathLine`等），改一处可能影响另一处。

---

## 二、组件化重构方案（已完成）

### 2.1 模块划分

| 模块 | 职责 | 行数 | 依赖 | 复用性 |
|------|------|------|------|--------|
| `scene-setup.js` | 场景/相机/渲染器/光照/地面一次性初始化 + resize 自适应 | 67 | three.js | ⭐⭐⭐ 任何 Three.js 项目通用，改改参数就能用 |
| `selection-system.js` | 模型选中/箭头指示/点击射线检测/地面点拾取 | 84 | three.js | ⭐⭐⭐ 任何需要点击选 3D 物体的场景可用 |
| `movement-animator.js` | 移动队列/路径跟随/转向/路径线绘制淡出/士兵骨骼动画 | 202 | three.js + pathfinder.js | ⭐⭐ 依赖路径规划器，但移动队列+动画混合器逻辑可复用 |
| `pathfinder.js` | AABB 包围盒碰撞检测 + 5级回退绕行算法 | 228 | three.js | ✅ 之前已抽离 |
| `main.js` | **编排层**：模型加载 + 事件绑定 + 动画循环 | 179 | 全部模块 | ⭐ 业务特有的胶水代码，不通用 |

### 2.2 模块依赖关系

```
index.html
  └─ main.js                      ← 编排层（知道所有模块，但让模块互相不知道）
       ├─ scene-setup.js          ← 纯初始化，不依赖任何其他模块
       ├─ pathfinder.js           ← 纯算法，不依赖 UI
       ├─ selection-system.js     ← 依赖 scene（用于 parent 链查找、箭头添加）
       ├─ movement-animator.js    ← 依赖 scene + pf
       └─ three.js (CDN)          ← 底层库
```

**关键设计决策：** `main.js` 是唯一"知道所有其他模块"的文件。三个模块之间**不直接相互引用**。模块间通信通过 `main.js` 传递参数实现：

```
selection-system          movement-animator
  │                             │
  │  getModel() / getType()     │  moveTo() / update() / clearQueue()
  └──────┬──── main.js ──┬──────┘
         │  编排交互逻辑   │
         └───────────────┘
```

### 2.3 为什么这样拆

| 原则 | 体现 |
|------|------|
| **单一职责** | 每个模块只做一类事：场景初始化 / 交互检测 / 移动动画 |
| **高内聚** | 选中系统的 raycaster、arrow、doSelect 放在一起；移动相关的 moveQueue、pathLine、soldier 放在一起 |
| **低耦合** | 模块之间不直接引用——选中系统不需要知道 pathfinder 的存在，移动系统不需要知道 raycaster 的存在 |
| **依赖倒置** | 移动系统接收 `pf` 作为参数，而不是自己创建——可以替换为任何实现了 isPathBlocked/computeWaypoints 的对象 |

---

## 三、如果扩到 React 项目——同样的思路怎么用

### 3.1 当前架构的 React 映射

| Vanilla JS 模块 | React 等价物 |
|----------------|-------------|
| `scene-setup.js` | `SceneProvider` Context + `useSetupScene()` hook |
| `selection-system.js` | `useSelection()` hook + `SelectionArrow` component |
| `movement-animator.js` | `useMovement()` hook + `PathLine` component |
| `main.js`（编排层） | 父组件+组合 hooks |

### 3.2 React 版组件树

```jsx
<ThreeCanvas>                          // scene-setup → 提供场景上下文
  <AmbientLight />
  <DirectionalLight />
  <Ground />
  <GridHelper />

  <ModelLoader url="./models/car.glb">  // 模型加载
    <CollisionBox />                    // 红色碰撞区域可视化
  </ModelLoader>

  <SelectableModel                      // selection-system
    type="soldier"
    onSelect={() => movement.moveTo()}
  >
    <SoldierAnimation />               // movement-animator
  </SelectableModel>

  <SelectionArrow />                   // 绿色选中箭头
  <PathLine />                         // 路径可视化
</ThreeCanvas>
```

### 3.3 配置化思路（SaaS 思维）

如果把 `three-demo` 视为一个"3D 场景配置器"的 MVP，那么组件化的下一步是配置驱动：

```javascript
// scene-config.json — 把场景配置变成数据
{
  "scene": {
    "width": 10,
    "depth": 10,
    "groundColor": "#222233",
    "gridColor": "#6666aa"
  },
  "models": [
    { "type": "obstacle", "url": "./models/car.glb", "position": [0, 0, 0], "scale": 0.5 },
    { "type": "character", "url": "./models/Soldier.glb", "position": [-1.5, 0, 0], "scale": 0.4 },
    { "type": "character", "url": "./models/queen.glb", "position": [1.5, 0, 0], "scale": 0.4 },
    { "type": "decoration", "url": "./models/skin.glb", "position": [0, 0.7, 0], "scale": 0.4 }
  ],
  "pathfinding": {
    "safetyMargin": 0.6,
    "detourMargin": 1.0
  }
}
```

**核心认知：** 组件化不只是"把大文件拆小"，而是**让数据在模块间按约定流动**。当模块间的通信接口稳定了，数据就可以来自任何地方（用户配置 / API 响应 / WebSocket 推送）。

---

## 四、可进一步抽取的点

| 潜在模块 | 当前所在位置 | 抽取理由 | 优先级 |
|---------|-------------|---------|-------|
| `model-loader.js` | main.js（4 个 loader.load） | 模型加载逻辑重复度高，参数相似 | ⭐ 中 |
| `progress-bar.js` | main.js（updateProgress + HTML） | 加载动画可封装为独立组件 | ⭐ 低 |
| `collision-box.js` | main.js（car 加载的回调里） | 碰撞区域可视化逻辑可独立 | ⭐ 低 |
| `camera-controls.js` | scene-setup.js 内部 | 如果未来需要切换视角模式（俯视/跟随/自由），需要独立 | ⭐⭐ 中 |

---

## 五、复盘

### 这次学到了什么

1. **先画边界，再写代码。** `main.js` 拆之前我先画了模块关系图，明确了"每个模块的边界在哪里"、"通信靠什么"。这件事比写代码本身更重要。
2. **编排层是必要的。** 不是所有代码都能塞进独立的模块——总需要一层"胶水代码"来串联（类似 Redux 的 connect 或 React 的 App 组件）。把胶水层集中在 `main.js`，而不是分散在各个模块里。
3. **共享状态是耦合的根源。** `selectedModel` 和 `moveQueue` 被选中的交互和移动的动画共同读写——如果未来需要多角色同时移动，这套方案就要升级（进入 ECS 或状态管理库）。

### 如果在库卡项目里落地

- 库卡的产线监控面板，天然适合组件化：**设备列表、3D 场景、状态面板、报警列表** 四个大模块，每个模块内部再拆
- 组件边界按"需求变化方向"划分：设备列表的变动原因是数据源变了，3D 场景的变动原因是视角/模型变了——变化方向不同，就不该放在一个文件里
- 可先做"组件抽取审计"：对你当前负责的 2-3 个页面，逐一标记"哪些逻辑是业务特有的 / 哪些可以通用"，然后优先抽取通用部分
