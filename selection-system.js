/**
 * Selection System 模块
 *
 * 职责：管理模型选中交互
 * - 选中箭头（绿色锥体，在选中模型头顶显示）
 * - 点击模型检测（Raycaster → 沿 parent 链找根节点）
 * - 地面点击点获取（用于移动目标定位）
 * - 区分点击 vs 拖拽不在本模块处理（由 main.js 的 pointerdown/up 判定）
 *
 * 用法：
 *   const sel = createSelectionSystem(scene);
 *   const hit = sel.getHitModel(event, camera, [queenModel, soldierModel]);
 *   const pt = sel.getGroundPoint(event, camera, groundPlane);
 *   sel.doSelect(hit, 'queen');
 */

import * as THREE from 'three';

export function createSelectionSystem(scene) {
    // ── 选中箭头（绿色锥体，朝下） ──
    const selArrow = new THREE.Mesh(
        new THREE.ConeGeometry(0.12, 0.2, 8),
        new THREE.MeshBasicMaterial({ color: 0x00ff88 })
    );
    selArrow.rotation.x = Math.PI;
    selArrow.position.y = 1.6;
    selArrow.visible = false;
    scene.add(selArrow);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    let selectedModel = null;
    let selectedType = '';

    /** 选中模型——更新引用 + 显示箭头 */
    function doSelect(model, type) {
        if (selectedModel === model) return;
        selectedModel = model;
        selectedType = type;
        selArrow.visible = true;
        selArrow.position.set(model.position.x, 1.6, model.position.z);
    }

    /** 射线检测：点击到可选模型列表中的哪个 → 返回根节点，或 null */
    function getHitModel(event, camera, selectableRoots) {
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);

        const meshes = [];
        for (const root of selectableRoots) {
            if (!root) continue;
            root.traverse(child => { if (child.isMesh) meshes.push(child); });
        }
        const hits = raycaster.intersectObjects(meshes);
        if (hits.length === 0) return null;

        let root = hits[0].object;
        while (root.parent && root.parent !== scene) root = root.parent;
        return root;
    }

    /** 射线检测：获取地面点击点 → Vector3，或 null */
    function getGroundPoint(event, camera, plane) {
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);

        const intersect = new THREE.Vector3();
        return raycaster.ray.intersectPlane(plane, intersect) ? intersect : null;
    }

    return {
        doSelect,
        getHitModel,
        getGroundPoint,
        selArrow,
        /** 当前选中的模型对象 */
        getModel: () => selectedModel,
        /** 当前选中类型 'queen' | 'soldier' */
        getType: () => selectedType,
    };
}
