// 从 three 核心库导入所有功能，命名空间为 THREE
import * as THREE from 'three';
// 导入轨道控制器，能让用户拖拽鼠标旋转/缩放视角
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// 导入 GLTF 模型加载器，用来加载 .glb/.gltf 格式的 3D 模型
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// 从自定义的 pathfinder.js 导入 AABB 避障路径规划器
import { createAABBAvoidance } from './pathfinder.js';

// ========== 场景 ==========
// 创建一个新场景，场景是所有 3D 物体的容器
const scene = new THREE.Scene();
// 设置场景背景颜色为浅灰色
scene.background = new THREE.Color(0xeeeeee);

// ========== 相机 ==========
// 创建透视相机：参数依次为（视角 75°, 宽高比, 近裁面 0.1, 远裁面 100）
// 视角越大看到范围越广但会有透视变形，宽高比保证画面不拉伸
// 近裁面和远裁面之间的物体才会被渲染
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
// 把相机放在 (3, 3, 5) 位置——即从右上方斜着看向原点
camera.position.set(3, 3, 5);

// ========== 渲染器 ==========
// 创建 WebGL 渲染器，antialias 开启抗锯齿让边缘更平滑
const renderer = new THREE.WebGLRenderer({ antialias: true });
// 设置渲染尺寸为浏览器窗口大小
renderer.setSize(window.innerWidth, window.innerHeight);
// 适配显示器的像素比（高清屏上更清晰）
renderer.setPixelRatio(window.devicePixelRatio);
// 把渲染器生成的 canvas 添加到页面中
document.body.appendChild(renderer.domElement);

// ========== 轨道控制器 ==========
// 创建轨道控制器，绑定到相机和 canvas，实现鼠标拖拽旋转/缩放
const controls = new OrbitControls(camera, renderer.domElement);
// 启用阻尼惯性——拖拽松开后视角会慢慢停下来，手感更顺滑
controls.enableDamping = true;
// 缩放时鼠标指向哪里就放大哪里
controls.zoomToCursor = true;

// ========== 模型加载 ==========
// 创建 GLTF 加载器实例
const loader = new GLTFLoader();
// 总共有 4 个模型需要加载（汽车、蝙蝠侠、士兵、女王）
const TOTAL_MODELS = 4;
// 已加载完成的模型计数
let modelsLoaded = 0;

// 更新加载进度的函数
function updateProgress() {
    // 已加载数加 1
    modelsLoaded++;
    // 计算百分比
    const pct = Math.round((modelsLoaded / TOTAL_MODELS) * 100);
    // 更新页面上的进度条宽度
    document.getElementById('progress-fill').style.width = pct + '%';
    // 更新页面上的进度文字
    document.getElementById('progress-text').textContent = pct + '%';
    // 如果全部加载完成
    if (modelsLoaded >= TOTAL_MODELS) {
        // 延迟 400ms 后隐藏加载画面（加延迟是为了看到 100% 的瞬间）
        setTimeout(() => document.getElementById('loading').classList.add('hidden'), 400);
    }
}
// 存储女王模型的引用
let queenModel = null;
// 存储汽车模型的引用
let carModel = null;
// 障碍物数组，把汽车放进去，路径规划时会避开它
const obstacles = [];
// 创建路径规划器：传入障碍物列表和碰撞安全距离参数
const pf = createAABBAvoidance(obstacles, { safetyMargin: 0.6, detourMargin: 1.0 });

// 路径线的自动清除计时器（帧数计数）
let pathClearTimer = 0;
// 移动队列：存储一系列目标点，角色会逐个走过去
let moveQueue = [];
// 路径线对象：在地面上画出的绿色线条，显示行走路线
let pathLine = null;

// ── 选中系统 ──
// 当前选中的模型对象
let selectedModel = null;
// 当前选中的类型：'queen' 或 'soldier'
let selectedType = '';
// 跑步阈值：目标距离超过 4 个单位时用跑步动画
const RUN_THRESHOLD = 4;

// ── 士兵动画系统 ──
// 士兵相关的所有数据的对象
const soldier = {
    model: null,      // 士兵的 3D 模型
    mixer: null,      // 动画混合器，控制动画播放
    actions: {},      // 存储三个动画：idle(待机) walk(走路) run(跑步)
    currentAction: null, // 当前正在播放的动画
};
// 开始加载汽车模型
loader.load(
    // 模型文件路径
    './models/car.glb',
    // 加载成功后的回调函数，参数 gltf 包含整个模型数据
    (gltf) => {
        // 从 gltf 中取出场景对象
        const model = gltf.scene;
        // 保存引用
        carModel = model;
        // 把汽车加入障碍物数组，路径规划会避开它
        obstacles.push(model);
        // 将汽车缩小到原大小的 0.5 倍
        model.scale.set(0.5, 0.5, 0.5);
        // 放在原点位置
        model.position.set(0, 0, 0);
        // 添加到场景中显示
        scene.add(model);
        // 更新加载进度
        updateProgress();

        // 延迟 500ms 等模型完全加载后计算包围盒
        setTimeout(() => {
            // 更新模型的世界矩阵，确保位置数据是最新的
            model.updateWorldMatrix(true, true);
            // 计算模型的轴对齐包围盒
            const rawBox = new THREE.Box3().setFromObject(model);
            // 复制包围盒并向外扩展 0.6 单位（这就是碰撞检测的范围）
            const b = rawBox.clone().expandByScalar(0.6);
            // 计算包围盒底部四个角的坐标（在 y=0.02 高度画线）
            const pts = [
                new THREE.Vector3(b.min.x, 0.02, b.min.z),
                new THREE.Vector3(b.max.x, 0.02, b.min.z),
                new THREE.Vector3(b.max.x, 0.02, b.max.z),
                new THREE.Vector3(b.min.x, 0.02, b.max.z),
                new THREE.Vector3(b.min.x, 0.02, b.min.z),
            ];
            // 用这四个点生成一个矩形线框，显示在场景中
            const g = new THREE.BufferGeometry().setFromPoints(pts);
            scene.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xff0000 })));
            // 在控制台输出碰撞区域信息
            console.log('🚗 碰撞区域:', b);
        }, 500);
    },
    // 加载进度回调
    (xhr) => {
        console.log(`加载进度: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
    },
    // 加载失败回调
    (error) => {
        console.error('模型加载失败:', error);
    }
);

// 开始加载蝙蝠侠模型
loader.load(
    './models/skin.glb',
    (gltf) => {
        const model = gltf.scene;
        // 缩小到 0.4 倍
        model.scale.set(0.4, 0.4, 0.4);
        // 放在 (3, 0, 0)
        model.position.set(0, 0.7, 0);
        scene.add(model);
        updateProgress();
    },
    (xhr) => {
        console.log(`加载进度: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
    },
    (error) => {
        console.error('模型加载失败:', error);
    }
);
// 开始加载士兵模型
loader.load(
    './models/Soldier.glb',
    (gltf) => {
        const model = gltf.scene;
        // 保存到 soldier 对象
        soldier.model = model;
        // 缩放 0.5 倍，Z 轴设为 -0.5 是镜像翻转（因为模型默认朝向反了）
        model.scale.set(0.5, 0.5, -0.5);
        // 放在 (-1.5, 0, 0)
        model.position.set(-1.5, 0, 0);
        scene.add(model);

        // 创建动画混合器，负责模型的骨骼动画播放
        const mixer = new THREE.AnimationMixer(model);
        soldier.mixer = mixer;
        // 把模型的三个动画片段分别绑定到 actions
        // animations[0] = 待机, [1] = 走路, [2] = 跑步
        soldier.actions.idle = mixer.clipAction(gltf.animations[0]);
        soldier.actions.walk = mixer.clipAction(gltf.animations[1]);
        soldier.actions.run = mixer.clipAction(gltf.animations[2]);
        // 默认播放待机动画
        soldier.actions.idle.play();
        soldier.currentAction = soldier.actions.idle;

        updateProgress();
    },
    (xhr) => {
        console.log(`加载进度: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
    },
    (error) => {
        console.error('模型加载失败:', error);
    }
);

// 开始加载女王模型
loader.load(
    './models/queen.glb',
    (gltf) => {
        const model = gltf.scene;
        // 保存引用
        queenModel = model;
        // 缩小到 0.4 倍
        model.scale.set(0.4, 0.4, 0.4);
        // 放在 (3, 0, 0)
        model.position.set(1.5, 0, 0);
        scene.add(model);
        updateProgress();
    },
    (xhr) => {
        console.log(`加载进度: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
    },
    (error) => {
        console.error('模型加载失败:', error);
    }
);

// ========== 光照 ==========
// 环境光：均匀照亮所有面，没有方向，防止背光面全黑
// 这里用白色全强度，因为场景里没有环境光的话标准材质会显示为黑色
const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(ambientLight);
// 平行光：从特定方向照射，产生明暗立体感
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
// 把光源放在 (5, 5, 5) 从右上后方照射
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// ========== 地面 + 网格 ==========
// 创建地面几何体：一个 10x10 的平面
const groundGeo = new THREE.PlaneGeometry(10, 10);
// 地面材质：深蓝灰色，粗糙表面
const groundMat = new THREE.MeshStandardMaterial({
    color: 0x222233,
    roughness: 0.8,
    metalness: 0.1,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
// 平面默认是竖直的，绕 X 轴旋转 -90° 变成水平
ground.rotation.x = -Math.PI / 2;
// 稍微下沉一点，让网格线在地面之上
ground.position.y = -0.01;
scene.add(ground);

// 辅助网格：帮助观察空间位置
// 参数：大小10，分割20段，中心线紫蓝色，网格线暗紫色
const gridHelper = new THREE.GridHelper(10, 20, 0x6666aa, 0x444466);
scene.add(gridHelper);

// 选中箭头：用一个小锥体表示当前选中了哪个角色
const arrowMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
const selArrow = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 8), arrowMat);
// 旋转 180° 让锥体尖端朝下
selArrow.rotation.x = Math.PI;
// 放在头顶上方 1.6 单位处
selArrow.position.y = 1.6;
// 默认隐藏，选中后才显示
selArrow.visible = false;
scene.add(selArrow);

// 创建时钟，用于计算每帧的时间差（驱动动画用）
const clock = new THREE.Clock();

// ========== 动画循环 ==========
function animate() {
    // 请求浏览器在下一帧调用 animate，形成每帧循环（约 60次/秒）
    requestAnimationFrame(animate);

    // 更新轨道控制器：必须每帧调用，阻尼效果才能工作
    controls.update();

    // ── 角色移动 ──
    // 如果有选中的模型，并且移动队列中有目标点
    if (selectedModel && moveQueue.length > 0) {
        // 取出队列中第一个目标点
        const target = moveQueue[0];
        // 计算当前位置到目标点的 X 和 Z 方向差值
        const dx = target.x - selectedModel.position.x;
        const dz = target.z - selectedModel.position.z;
        // 计算到目标点的直线距离
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 0.1) {
            // 距离小于 0.1 说明已到达目标点，从队列中移除它
            moveQueue.shift();
            // 如果队列空了（所有目标点都走完了）
            if (moveQueue.length === 0) {
                // 如果是士兵，切回待机动画
                if (selectedType === 'soldier') fadeAction(soldier, 'idle');
                // 设置计时器：约 2 秒后自动清除路径线（60fps × 2秒 = 120帧）
                if (pathLine) pathClearTimer = 120;
            }
        } else {
            // 还没到达，继续向目标点移动
            // 根据角色类型和距离决定移动速度
            const speed = selectedType === 'soldier'
                ? (dist > RUN_THRESHOLD ? 0.08 : 0.04)  // 士兵：超过阈值用跑步速度，否则走路速度
                : 0.05;                                   // 女王：固定速度
            // 每帧向目标靠近 speed 比例的距离
            selectedModel.position.x += dx * speed;
            selectedModel.position.z += dz * speed;

            // 让模型面向移动方向
            // atan2 计算出目标点相对于当前位置的角度
            const targetAngle = Math.atan2(dx, dz);
            // 计算当前朝向和目标朝向的差值
            let angleDiff = targetAngle - selectedModel.rotation.y;
            // 把角度差归一化到 [-PI, PI] 范围，防止绕远路旋转
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            // 每帧只旋转角度差的 12%，实现平滑转向
            selectedModel.rotation.y += angleDiff * 0.12;

            // 如果是士兵，根据距离切换走路/跑步动画
            if (selectedType === 'soldier') {
                const next = dist > RUN_THRESHOLD ? 'run' : 'walk';
                fadeAction(soldier, next);
            }
        }
    }

    // ── 路径线淡出 ──
    // 如果清除计时器大于 0
    if (pathClearTimer > 0) {
        pathClearTimer--;
        if (pathLine) {
            // 开启透明度支持
            pathLine.material.transparent = true;
            // 透明度随计时器递减（从 1 渐变到 0）
            pathLine.material.opacity = pathClearTimer / 120;
            pathLine.material.needsUpdate = true;
        }
        // 计时器归零时，彻底移除路径线对象
        if (pathClearTimer === 0) {
            if (pathLine) {
                scene.remove(pathLine);
                pathLine.geometry.dispose();
                pathLine.material.dispose();
                pathLine = null;
            }
        }
    }

    // ── 更新骨骼动画 ──
    // 计算距上一帧的时间差（秒）
    const delta = clock.getDelta();
    // 更新动画混合器，让骨骼动画正常播放
    if (soldier.mixer) soldier.mixer.update(delta);

    // ── 选中箭头跟随 ──
    // 如果箭头显示且有选中模型，箭头跟随模型位置
    if (selArrow.visible && selectedModel) {
        selArrow.position.x = selectedModel.position.x;
        selArrow.position.z = selectedModel.position.z;
    }

    // 渲染场景：把 scene 通过 camera 的视角绘制到 canvas 上
    renderer.render(scene, camera);
}

// 启动动画循环
animate();

// ========== 模型选中 + 地面移动 ==========
// 平滑切换动画的工具函数
function fadeAction(soldierObj, name) {
    // 获取要切换的动画
    const next = soldierObj.actions[name];
    // 如果动画不存在或者已经是当前动画，不做任何事
    if (!next || soldierObj.currentAction === next) return;
    // 当前动画在 0.2 秒内淡出
    if (soldierObj.currentAction) soldierObj.currentAction.fadeOut(0.2);
    // 新动画重置状态并在 0.2 秒内淡入播放
    next.reset().fadeIn(0.2).play();
    // 更新当前动画记录
    soldierObj.currentAction = next;
}

// 光线投射器：用于检测鼠标点击到了哪个 3D 物体
const raycaster = new THREE.Raycaster();
// 鼠标位置归一化坐标（范围 -1 到 1）
const pointer = new THREE.Vector2();
// 定义一个水平面（法线朝上 y=1，高度 y=0），代表地面
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

// 在地面上绘制路径线的函数
function drawPath(points, safe) {
    // 移除之前画的路径线（如果有），并释放 GPU 资源
    if (pathLine) { scene.remove(pathLine); pathLine.geometry.dispose(); pathLine.material.dispose(); pathLine = null; }
    // 如果点不足 2 个，无法画线
    if (!points || points.length < 2) return;
    // 提取所有点的 x, z 坐标，y 固定为 0.05（刚好在地面上方）
    const positions = [];
    for (const p of points) { positions.push(p.x, 0.05, p.z); }
    // 创建缓冲区几何体，填入顶点坐标
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    // 创建线条材质：绿色表示安全，红色表示被阻挡
    const mat = new THREE.LineBasicMaterial({ color: safe ? 0x00ff00 : 0xff0000, linewidth: 2, depthTest: false });
    // 组合成 Line 对象添加到场景
    pathLine = new THREE.Line(geo, mat);
    scene.add(pathLine);
}

// ── 区分点击和拖拽 ──
// 记录鼠标按下时的位置
let pointerDownPos = { x: 0, y: 0 };
// 记录鼠标按下时的时间
let pointerDownTime = 0;

// 鼠标按下事件
renderer.domElement.addEventListener('pointerdown', (e) => {
    pointerDownPos.x = e.clientX;
    pointerDownPos.y = e.clientY;
    pointerDownTime = Date.now();
});

// 鼠标松开事件
renderer.domElement.addEventListener('pointerup', (e) => {
    // 计算鼠标移动距离
    const dx = e.clientX - pointerDownPos.x;
    const dy = e.clientY - pointerDownPos.y;
    // 计算按下到松开的时间差
    const dt = Date.now() - pointerDownTime;
    // 如果移动超过 10 像素或者时间超过 300ms，认为是拖拽而非点击，不处理
    if (Math.sqrt(dx * dx + dy * dy) > 10 || dt > 300) return;

    // 将鼠标屏幕坐标转换为 Three.js 归一化坐标
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    // 从相机位置通过鼠标方向发射射线
    raycaster.setFromCamera(pointer, camera);

    // ── ① 检测是否点击到了可选中的模型 ──
    // 把可选的模型放到数组里
    const selectables = [];
    if (queenModel) selectables.push(queenModel);
    if (soldier.model) selectables.push(soldier.model);

    // 遍历所有可选模型，收集它们的网格子对象
    const meshes = [];
    for (const root of selectables) {
        root.traverse((child) => { if (child.isMesh) meshes.push(child); });
    }
    // 检测射线是否与网格相交
    const hits = raycaster.intersectObjects(meshes);
    if (hits.length > 0) {
        // 点击到了某个网格
        const clicked = hits[0].object;
        // 沿父级链往上找，直到找到 GLTF 的根节点（即 scene 的直接子级）
        let root = clicked;
        while (root.parent && root.parent !== scene) root = root.parent;
        // 判断点击到的是女王还是士兵，调用 doSelect 选中
        if (queenModel && root === queenModel) { doSelect(queenModel, 'queen'); return; }
        if (soldier.model && root === soldier.model) { doSelect(soldier.model, 'soldier'); return; }
        return;
    }

    // ── ② 没点中模型，检测是否点到地面（移动选中模型）──
    // 没有选中模型或汽车还没加载完，不处理
    if (!selectedModel || !carModel) return;

    // 计算射线与地面的交点
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(groundPlane, intersectPoint);
    if (!intersectPoint) return;

    // 获取选中模型当前的位置（起点）
    const startX = selectedModel.position.x;
    const startZ = selectedModel.position.z;
    // 获取点击位置（终点）
    const endX = intersectPoint.x;
    const endZ = intersectPoint.z;

    // 如果点击位置超出地面范围（±5），不移动
    if (Math.abs(endX) > 5 || Math.abs(endZ) > 5) return;

    // 如果目标点在汽车的碰撞包围盒内部，不允许移动过去（不能走到车里）
    carModel.updateWorldMatrix(true, true);
    const clickBox = new THREE.Box3().setFromObject(carModel).expandByScalar(0.6);
    if (clickBox.containsPoint(new THREE.Vector3(endX, 0.5, endZ))) return;

    // 检测从起点到终点的直线路径是否被障碍物阻挡
    const blocked = pf.isPathBlocked(startX, startZ, endX, endZ);

    // 有新的移动指令，取消旧的路径线自动清除计时
    pathClearTimer = 0;

    if (blocked) {
        // 路径被阻挡：让路径规划器计算绕行点
        const waypoints = pf.computeWaypoints(startX, startZ, endX, endZ);
        // 移动队列 = 绕行点序列 + 最终目标点
        moveQueue = [...waypoints, { x: endX, z: endZ }];
        // 画出完整路径（起点 → 绕行点们 → 终点）
        const fullPath = [{ x: startX, z: startZ }, ...waypoints, { x: endX, z: endZ }];
        drawPath(fullPath, true);
    } else {
        // 直线可达：直接把终点加入移动队列
        moveQueue = [{ x: endX, z: endZ }];
        // 画出直线路径
        drawPath([{ x: startX, z: startZ }, { x: endX, z: endZ }], true);
    }
});

// 选中模型的函数
function doSelect(model, type) {
    // 如果已经选中了这个模型，不做任何事
    if (selectedModel === model) return;

    // 如果之前选中的是士兵且正在移动，切回待机动画
    const prevType = selectedType;
    if (prevType === 'soldier') {
        fadeAction(soldier, 'idle');
    }

    // 清空移动队列，让旧模型停下来
    moveQueue = [];

    // 更新选中状态
    selectedModel = model;
    selectedType = type;
    // 显示选中箭头
    selArrow.visible = true;
    selArrow.position.set(model.position.x, 1.6, model.position.z);

    // 选中士兵时播放待机动画
    if (type === 'soldier') fadeAction(soldier, 'idle');
    console.log(`✅ 选中: ${type}`);
}

// ========== 路径规划工具（已抽取为独立模块 pathfinder.js）==========
