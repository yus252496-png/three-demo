# 组件架构

## 数据流

```
BigScreen（编排层）
 ├─ Scene（R3F Canvas）
 │   ├─ SceneLights
 │   ├─ Ground（网格 + 环形脉冲）
 │   ├─ Car / Soldier / Queen / Batman（模型，点击触发设备信息或选中）
 │   ├─ GroundClickCatcher（地面点击 → 路径 → 移动）
 │   ├─ SceneController（useFrame 驱动移动/动画/入场/箭头/路径淡出）
 │   └─ PathLine（路径可视化）
 ├─ SceneHUD（FPS/选中状态监视器）
 ├─ DeviceInfoCard（设备参数弹窗）
 ├─ ChartPanel（ECharts 小面板合集）
 └─ 按钮栏（截图/HUD/图表/全屏）
```

## 状态管理

- **Zustand（sceneStore）**：选中模型、设备信息、移动队列、路径点
- **modelRegistry（模块级单例）**：模型 Object3D 引用、动画动作、路径规划器（非响应式，供 useFrame 高频读写）
- **组件间通信**：模型组件在 `useEffect` 中注册到 `modelRegistry`，`SceneController`/`GroundClickCatcher` 从中读取

## 关键约束

- 高频 Three.js 操作（position、rotation、mixer.update）不走 React state → 用 ref 直接操控
- 页面切换时 `sceneStore.resetScene()` + `modelRegistry.reset()` 清理过期引用
