/**
 * Scene Setup 模块
 *
 * 职责：一次性完成 Three.js 场景初始化
 * - 创建场景(Scene)、相机(Camera)、渲染器(Renderer)
 * - 添加轨道控制器(OrbitControls)、光照、地面、网格
 * - 窗口 resize 自适应
 *
 * 用法：
 *   import { setupScene } from './scene-setup.js';
 *   const { scene, camera, renderer, controls, groundPlane } = setupScene(document.body);
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function setupScene(container) {
    // ── 场景 ──
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeeeeee);

    // ── 相机 ──
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(3, 3, 5);

    // ── 渲染器 ──
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // ── 轨道控制器 ──
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.zoomToCursor = true;

    // ── 光照 ──
    scene.add(new THREE.AmbientLight(0xffffff));

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    // ── 实体地面 ──
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10),
        new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.8, metalness: 0.1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    scene.add(ground);

    // ── 网格辅助线 ──
    scene.add(new THREE.GridHelper(10, 20, 0x6666aa, 0x444466));

    // ── 窗口 resize 自适应 ──
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ── 地面平面（用于射线检测） ──
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    return { scene, camera, renderer, controls, groundPlane };
}
