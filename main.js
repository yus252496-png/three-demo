// ============================================
// 导入 Three.js 核心库
// ============================================
import * as THREE from 'three';
// 导入轨道控制器（允许用户用鼠标拖拽/缩放来旋转视角）
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// ============================================
// 1. 创建场景 Scene（场景是所有物体的容器）
// ============================================
const scene = new THREE.Scene();
// 设置场景的背景色为深红色（RGB: 0xaa1a2e）
scene.background = new THREE.Color(0xaa1a2e);

// ============================================
// 2. 创建透视相机 Camera（模拟人眼透视效果）
// 参数1: 视角 75°（视野范围，越大看到越多但画面会变形）
// 参数2: 宽高比（自动根据窗口宽高计算，防止拉伸）
// 参数3: 近裁面 0.1（距离相机 < 0.1 的物体不渲染）
// 参数4: 远裁面 1000（距离相机 > 1000 的物体不渲染）
// ============================================
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
// 把相机向后移动 5 个单位（沿 Z 轴负方向后退）
camera.position.set(3, 3, 5);

// ============================================
// 3. 创建 WebGL 渲染器 Renderer（负责把 3D 场景绘制到屏幕上）
// antialias: true 表示开启抗锯齿，让边缘更平滑
// ============================================
const renderer = new THREE.WebGLRenderer({ antialias: true });
// 设置渲染尺寸为整个浏览器窗口的大小
renderer.setSize(window.innerWidth, window.innerHeight);
// 匹配显示器的像素比（高清屏上更清晰，防止模糊）
renderer.setPixelRatio(window.devicePixelRatio);
// 把渲染器的 <canvas> 元素添加到 HTML 页面的 <body> 中
document.body.appendChild(renderer.domElement);

// ============================================
// 创建轨道控制器（将鼠标/触控操作绑定到相机）
// 参数1: 要控制的相机
// 参数2: 监听的 DOM 元素（这里监听 canvas 上的鼠标事件）
// ============================================
const controls = new OrbitControls(camera, renderer.domElement);
// 启用阻尼（物理惯性）效果——拖拽松开后视角会缓慢停下来，手感更顺滑
controls.enableDamping = true;
controls.zoomToCursor = true;  
// // ============================================
// // 4. 创建立方体（Box）
// // ============================================
// // 4.1 几何体 Geometry：定义形状——长宽高各为 1 的立方体
// const geometry = new THREE.BoxGeometry(1, 1, 1);
// // 4.2 材质 Material：定义外观——标准材质，颜色为亮蓝色 (0x00aaff)
// // MeshStandardMaterial 需要光照才能显示，否则为黑色
// const material = new THREE.MeshStandardMaterial({ color: 'green' });
// // 4.3 网格 Mesh = 几何体 + 材质，组合成一个可渲染的物体
// const cube = new THREE.Mesh(geometry, material);
// // 4.4 将立方体添加到场景中（不添加就不会显示）
// scene.add(cube);

// // ============================================
// // 4.1 创建一个球体（Sphere）
// // ============================================
// // 4.1.1 球体几何体：半径 0.8，水平分段 32，垂直分段 32（分段越高越光滑）
// const sphereGeometry = new THREE.SphereGeometry(0.8, 32, 32);
// // 4.1.2 球体材质：橙色 (0xff5500)，金属感 0.3，粗糙度 0.4（介于光滑和粗糙之间）
// const sphereMaterial = new THREE.MeshStandardMaterial({ color: 'red', metalness: 0.3, roughness: 0.4 });
// // 4.1.3 创建球体网格
// const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
// // 4.1.4 把球体沿 X 轴向右移动 2.5 个单位，让它和立方体分开
// sphere.position.x = 2.5;
// // 4.1.5 将球体添加到场景中
// scene.add(sphere);

// 在场景、相机、渲染器、光照、轨道控制后面加：
// 加载外部模型
const loader = new GLTFLoader();
loader.load(
  './models/car.glb',  
  (gltf) => {
    const model = gltf.scene;
    model.scale.set(0.5, 0.5, 0.5);    // 调整大小
    model.position.set(0, 0, 0);  // 调整位置
    scene.add(model);
  },
  (xhr) => {
    console.log(`加载进度: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
  },
  (error) => {
    console.error('模型加载失败:', error);
  }
);
loader.load(
  './models/queen.glb',  
  (gltf) => {
    const model = gltf.scene;
    model.scale.set(0.5, 0.5, 0.5);    // 调整大小
    model.position.set(1, 0, 0);  // 调整位置
    scene.add(model);
  },
  (xhr) => {
    console.log(`加载进度: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
  },
  (error) => {
    console.error('模型加载失败:', error);
  }
);

// ============================================
// 5. 添加光照（重要！ MeshStandardMaterial 需要光照才能显示颜色）
// 没有光照的话，材质会显示为全黑色
// ============================================
// 5.1 环境光 AmbientLight：均匀照亮所有表面，没有方向
// 颜色暗灰色 (0x404040)，防止背光面完全漆黑
const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(ambientLight);
// 5.2 平行光 DirectionalLight：从一个方向照射，产生明暗对比
// 颜色白色 (0xffffff)，强度 1（最大为 1）
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
// 设置光源位置在 (5, 5, 5)，即从右上后方照射物体
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// ============================================
// 6. 添加辅助网格 GridHelper（帮助观察空间位置和方向）
// 参数1: 网格大小 10（宽高各 10 个单位）
// 参数2: 分割数 20（每条边分成 20 段 → 每个小格 0.5 单位）
// 参数3: 中心线颜色 黄色 0xffff00
// 参数4: 网格线颜色 深灰 0x444444
// ============================================
const gridHelper = new THREE.GridHelper(10, 20, 0xffff00, 0xaaaaaa);
scene.add(gridHelper);

// ============================================
// 7. 动画循环（浏览器的 requestAnimationFrame 驱动）
// 每一帧都会重新渲染场景，形成连续动画
// ============================================
function animate() {
    // 7.1 请求浏览器执行下一帧动画（形成递归循环，约 60 帧/秒）
    requestAnimationFrame(animate);

    // 下面两行被注释掉了——原本让立方体绕 X 轴和 Y 轴自转
    // cube.rotation.x += 0.01;  // 每帧绕 X 轴旋转 0.01 弧度
    // cube.rotation.y += 0.01;  // 每帧绕 Y 轴旋转 0.01 弧度

    // 7.2 更新轨道控制器（必须每帧调用，阻尼效果才能生效）
    controls.update();

    // 7.3 渲染：把场景和相机交给渲染器，绘制到 canvas 上
    renderer.render(scene, camera);
}

// 7.4 启动动画循环
animate();
