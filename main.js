// ========== 导入 ==========
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createAABBAvoidance } from './pathfinder.js';
import { setupScene } from './scene-setup.js';
import { createSelectionSystem } from './selection-system.js';
import { createMovementSystem } from './movement-animator.js';

// ========== 场景初始化 ==========
const { scene, camera, renderer, controls, groundPlane } = setupScene(document.body);

// ========== 模型加载 ==========
const loader = new GLTFLoader();
const TOTAL_MODELS = 4;
let modelsLoaded = 0;

function updateProgress() {
    modelsLoaded++;
    const pct = Math.round((modelsLoaded / TOTAL_MODELS) * 100);
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('progress-text').textContent = pct + '%';
    if (modelsLoaded >= TOTAL_MODELS) {
        setTimeout(() => document.getElementById('loading').classList.add('hidden'), 400);
    }
}

let queenModel = null;
let carModel = null;
const obstacles = [];
const pf = createAABBAvoidance(obstacles, { safetyMargin: 0.6, detourMargin: 1.0 });

// ========== 交互系统 ==========
const selection = createSelectionSystem(scene);
const movement = createMovementSystem(scene, pf);

// ── 汽车 ──
loader.load(
    './models/car.glb',
    (gltf) => {
        const model = gltf.scene;
        carModel = model;
        obstacles.push(model);
        model.scale.set(0.5, 0.5, 0.5);
        model.position.set(0, 0, 0);
        scene.add(model);
        updateProgress();

        setTimeout(() => {
            model.updateWorldMatrix(true, true);
            const rawBox = new THREE.Box3().setFromObject(model);
            const b = rawBox.clone().expandByScalar(0.6);
            const pts = [
                new THREE.Vector3(b.min.x, 0.02, b.min.z),
                new THREE.Vector3(b.max.x, 0.02, b.min.z),
                new THREE.Vector3(b.max.x, 0.02, b.max.z),
                new THREE.Vector3(b.min.x, 0.02, b.max.z),
                new THREE.Vector3(b.min.x, 0.02, b.min.z),
            ];
            const g = new THREE.BufferGeometry().setFromPoints(pts);
            scene.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xff0000 })));
            console.log('🚗 碰撞区域:', b);
        }, 500);
    },
    undefined,
    (error) => console.error('汽车加载失败:', error)
);

// ── 蝙蝠侠（装饰，不可选中）──
loader.load(
    './models/skin.glb',
    (gltf) => {
        const model = gltf.scene;
        model.scale.set(0.4, 0.4, 0.4);
        model.position.set(0, 0.7, 0);
        scene.add(model);
        updateProgress();
    },
    undefined,
    (error) => console.error('蝙蝠侠加载失败:', error)
);

// ── 士兵 ──
loader.load(
    './models/Soldier.glb',
    (gltf) => {
        const model = gltf.scene;
        model.scale.set(0.4, 0.4, -0.4);
        model.position.set(-1.5, 0, 0);
        scene.add(model);
        movement.initSoldier(model, gltf);
        updateProgress();
    },
    undefined,
    (error) => console.error('士兵加载失败:', error)
);

// ── 女王 ──
loader.load(
    './models/queen.glb',
    (gltf) => {
        const model = gltf.scene;
        queenModel = model;
        model.scale.set(0.4, 0.4, 0.4);
        model.position.set(1.5, 0, 0);
        scene.add(model);
        updateProgress();
    },
    undefined,
    (error) => console.error('女王加载失败:', error)
);

// ========== 动画循环 ==========
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    movement.update(selection.getModel(), selection.getType(), selection.selArrow);
    renderer.render(scene, camera);
}
animate();

// ========== 点击交互 ==========
let pointerDownPos = { x: 0, y: 0 };
let pointerDownTime = 0;

renderer.domElement.addEventListener('pointerdown', (e) => {
    pointerDownPos.x = e.clientX;
    pointerDownPos.y = e.clientY;
    pointerDownTime = Date.now();
});

renderer.domElement.addEventListener('pointerup', (e) => {
    // ── 拖拽判定：移动 > 10px 或按住 > 300ms 视为拖拽 ──
    const dx = e.clientX - pointerDownPos.x;
    const dy = e.clientY - pointerDownPos.y;
    const dt = Date.now() - pointerDownTime;
    if (Math.sqrt(dx * dx + dy * dy) > 10 || dt > 300) return;

    // ── ① 检测是否点击到可选模型 ──
    const selectables = [];
    if (queenModel) selectables.push(queenModel);
    if (movement.soldier.model) selectables.push(movement.soldier.model);

    const hit = selection.getHitModel(e, camera, selectables);
    if (hit) {
        let type = '';
        if (queenModel && hit === queenModel) type = 'queen';
        else if (movement.soldier.model && hit === movement.soldier.model) type = 'soldier';
        if (type) {
            // 切换选中：旧模型停运动 + 士兵切待机
            const prevType = selection.getType();
            if (prevType === 'soldier') movement.fadeAction('idle');
            movement.clearQueue();
            selection.doSelect(hit, type);
            if (type === 'soldier') movement.fadeAction('idle');
        }
        return;
    }

    // ── ② 没点中模型 → 移动选中角色 ──
    const selModel = selection.getModel();
    if (!selModel || !carModel) return;

    const pt = selection.getGroundPoint(e, camera, groundPlane);
    if (!pt) return;

    const endX = pt.x;
    const endZ = pt.z;

    // 不允许超出地面范围
    if (Math.abs(endX) > 5 || Math.abs(endZ) > 5) return;

    // 点击汽车包围盒内部 → 不移动
    carModel.updateWorldMatrix(true, true);
    const clickBox = new THREE.Box3().setFromObject(carModel).expandByScalar(0.6);
    if (clickBox.containsPoint(new THREE.Vector3(endX, 0.5, endZ))) return;

    // 执行移动
    movement.moveTo(endX, endZ, selModel, selection.getType());
});
