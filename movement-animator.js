/**
 * Movement + Animation 模块
 *
 * 职责：管理角色移动、路径可视化、士兵骨骼动画
 * - 移动队列（逐点行走）
 * - 面向方向平滑转向
 * - 路径线绘制 + 到达后自动淡出
 * - 士兵动画混合器（idle / walk / run 交叉淡入淡出）
 * - 选中箭头跟随模型位置
 *
 * 用法：
 *   const movement = createMovementSystem(scene, pf);
 *   movement.initSoldier(model, gltf);          // 士兵加载后调用
 *   movement.moveTo(endX, endZ, model, type);   // 移动到目标
 *   movement.update(selModel, selType, selArrow);  // 每帧调用
 *   movement.fadeAction('idle');                // 切动画
 *   movement.clearQueue();                      // 清空移动队列
 */

import * as THREE from 'three';

export function createMovementSystem(scene, pf) {
    const moveQueue = [];
    let pathLine = null;
    let pathClearTimer = 0;
    const clock = new THREE.Clock();
    const RUN_THRESHOLD = 4;

    // ── 士兵动画系统 ──
    const soldier = { model: null, mixer: null, actions: {}, currentAction: null };

    // =========================================
    // 公开 API
    // =========================================

    /** 初始化士兵骨骼动画（加载模型后调用） */
    function initSoldier(model, gltf) {
        soldier.model = model;
        const mixer = new THREE.AnimationMixer(model);
        soldier.mixer = mixer;
        soldier.actions.idle = mixer.clipAction(gltf.animations[0]);
        soldier.actions.walk = mixer.clipAction(gltf.animations[1]);
        soldier.actions.run = mixer.clipAction(gltf.animations[2]);
        soldier.actions.idle.play();
        soldier.currentAction = soldier.actions.idle;
    }

    /** 交叉淡入淡出切换动画（idle / walk / run） */
    function fadeAction(name) {
        const next = soldier.actions[name];
        if (!next || soldier.currentAction === next) return;
        if (soldier.currentAction) soldier.currentAction.fadeOut(0.2);
        next.reset().fadeIn(0.2).play();
        soldier.currentAction = next;
    }

    /** 清空移动队列（切换选中时调用） */
    function clearQueue() {
        moveQueue.length = 0;
    }

    /**
     * 计算路径并加入移动队列
     * @param {number} endX - 目标 X
     * @param {number} endZ - 目标 Z
     * @param {THREE.Object3D} model - 要移动的模型
     * @param {string} type - 'queen' | 'soldier'
     */
    function moveTo(endX, endZ, model, type) {
        const startX = model.position.x;
        const startZ = model.position.z;

        // 重置路径线淡出计时（新移动指令）
        pathClearTimer = 0;

        const blocked = pf.isPathBlocked(startX, startZ, endX, endZ);

        if (blocked) {
            // 路径被阻挡 → 生成绕行点
            const waypoints = pf.computeWaypoints(startX, startZ, endX, endZ);
            clearQueue();
            moveQueue.push(...waypoints, { x: endX, z: endZ });
            drawPath([{ x: startX, z: startZ }, ...waypoints, { x: endX, z: endZ }], true);
        } else {
            // 直线可达
            clearQueue();
            moveQueue.push({ x: endX, z: endZ });
            drawPath([{ x: startX, z: startZ }, { x: endX, z: endZ }], true);
        }
    }

    /**
     * 每帧更新——在 requestAnimationFrame 中调用
     * @param {THREE.Object3D|null} selModel - 当前选中模型
     * @param {string} selType - 当前选中类型
     * @param {THREE.Mesh} selArrow - 选中箭头
     */
    function update(selModel, selType, selArrow) {
        const delta = clock.getDelta();

        // ── 移动逻辑 ──
        if (selModel && moveQueue.length > 0) {
            const target = moveQueue[0];
            const dx = target.x - selModel.position.x;
            const dz = target.z - selModel.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < 0.1) {
                // 到达当前目标点 → 取下一点
                moveQueue.shift();
                if (moveQueue.length === 0) {
                    // 全部到达 → 士兵切待机
                    if (selType === 'soldier') fadeAction('idle');
                    // 开始路径线淡出（2秒 = 120帧）
                    if (pathLine) pathClearTimer = 120;
                }
            } else {
                // 继续移动
                const speed = selType === 'soldier'
                    ? (dist > RUN_THRESHOLD ? 0.08 : 0.04)
                    : 0.05;
                selModel.position.x += dx * speed;
                selModel.position.z += dz * speed;

                // 平滑转向
                const targetAngle = Math.atan2(dx, dz);
                let angleDiff = targetAngle - selModel.rotation.y;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                selModel.rotation.y += angleDiff * 0.12;

                // 士兵根据距离切换走路/跑步动画
                if (selType === 'soldier') {
                    fadeAction(dist > RUN_THRESHOLD ? 'run' : 'walk');
                }
            }
        }

        // ── 路径线淡出 ──
        if (pathClearTimer > 0) {
            pathClearTimer--;
            if (pathLine) {
                pathLine.material.transparent = true;
                pathLine.material.opacity = pathClearTimer / 120;
                pathLine.material.needsUpdate = true;
            }
            if (pathClearTimer === 0) {
                if (pathLine) {
                    scene.remove(pathLine);
                    pathLine.geometry.dispose();
                    pathLine.material.dispose();
                    pathLine = null;
                }
            }
        }

        // ── 骨骼动画更新 ──
        if (soldier.mixer) soldier.mixer.update(delta);

        // ── 选中箭头跟随模型 ──
        if (selArrow && selArrow.visible && selModel) {
            selArrow.position.x = selModel.position.x;
            selArrow.position.z = selModel.position.z;
        }
    }

    // =========================================
    // 内部函数
    // =========================================

    /** 在地面上绘制绿色路径线 */
    function drawPath(points, safe) {
        if (pathLine) {
            scene.remove(pathLine);
            pathLine.geometry.dispose();
            pathLine.material.dispose();
            pathLine = null;
        }
        if (!points || points.length < 2) return;
        const positions = [];
        for (const p of points) positions.push(p.x, 0.05, p.z);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const mat = new THREE.LineBasicMaterial({
            color: safe ? 0x00ff00 : 0xff0000,
            linewidth: 2,
            depthTest: false,
        });
        pathLine = new THREE.Line(geo, mat);
        scene.add(pathLine);
    }

    return {
        initSoldier,
        fadeAction,
        clearQueue,
        moveTo,
        update,
        /** soldier 对象引用（main.js 需要读取 soldier.model 进行加载和选中判定） */
        soldier,
    };
}
