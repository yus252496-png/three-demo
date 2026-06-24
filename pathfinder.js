/**
 * AABB Obstacle Avoidance Pathfinder
 *
 * 基于 AABB（轴对齐包围盒）的 2D 路径规划器
 *
 * 核心能力：
 * 1. 检测直线路径是否被障碍物阻挡
 * 2. 计算绕行路径点序列（5 级回退算法）
 *
 * 用法：
 *   import { createAABBAvoidance } from './pathfinder.js';
 *
 *   const pf = createAABBAvoidance([carMesh, truckMesh], {
 *     safetyMargin: 1.5,
 *     detourMargin: 1.8,
 *   });
 *
 *   // 检测是否被阻挡
 *   const blocked = pf.isPathBlocked(x1, z1, x2, z2);
 *
 *   // 获取绕行路径（返回绕行点数组，[] 表示直线可达）
 *   const waypoints = pf.computeWaypoints(fromX, fromZ, toX, toZ);
 *   // → 路径：起点 → waypoints[0] → waypoints[1] → ... → 终点
 */

import * as THREE from 'three';

// =========================================
// 2D 距离
// =========================================
function dist(x1, z1, x2, z2) {
    return Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
}

// =========================================
// 获取 THREE.Object3D 在 XZ 平面的包围盒参数
// =========================================
function getBoxParams(obj) {
    obj.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(obj);
    return {
        minX: box.min.x,
        maxX: box.max.x,
        minZ: box.min.z,
        maxZ: box.max.z,
        cx: (box.min.x + box.max.x) / 2,
        cz: (box.min.z + box.max.z) / 2,
        hw: (box.max.x - box.min.x) / 2,
        hz: (box.max.z - box.min.z) / 2,
    };
}

/**
 * 创建一个 AABB 避障路径规划器
 *
 * @param {THREE.Object3D[]} obstacles - 障碍物模型数组
 * @param {Object} options
 * @param {number} options.safetyMargin  - 碰撞检测安全距离（默认 1.5）
 * @param {number} options.detourMargin  - 绕行点外推距离（默认 1.8）
 * @param {number} options.sampleDensity - 路径采样密度，单位/点（默认 0.3）
 * @param {number} options.minSamples    - 最少采样点数（默认 50）
 * @returns {{ isPathBlocked, computeWaypoints }}
 */
export function createAABBAvoidance(obstacles, options = {}) {
    const {
        safetyMargin = 1.5,
        detourMargin = 1.8,
        sampleDensity = 0.3,
        minSamples = 50,
    } = options;

    const _obstacles = obstacles; // 保留引用，允许动态添加障碍物

    // =========================================
    // 检测直线路径是否被障碍物挡住
    // =========================================
    function isPathBlocked(x1, z1, x2, z2) {
        for (const obstacle of _obstacles) {
            obstacle.updateWorldMatrix(true, true);
            const box = new THREE.Box3().setFromObject(obstacle);
            box.expandByScalar(safetyMargin);

            const totalDist = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
            const samples = Math.max(minSamples, Math.ceil(totalDist / sampleDensity));
            for (let i = 1; i < samples; i++) {
                const t = i / samples;
                const px = x1 + (x2 - x1) * t;
                const pz = z1 + (z2 - z1) * t;
                if (box.containsPoint(new THREE.Vector3(px, 0.5, pz))) {
                    return true;
                }
            }
        }
        return false;
    }

    // =========================================
    // 生成绕行路径（5 级回退算法）
    //
    // 返回值：
    //   []             → 直线可达，无需绕行
    //   [p]            → 经过一个绕行点即可
    //   [p1, p2]       → 需要经过两个绕行点
    //
    // 路径始终不穿过任何障碍物的 safetyMargin 范围
    // =========================================
    function computeWaypoints(fromX, fromZ, toX, toZ, primaryObstacleIndex = 0) {
        // 直线可达 → 不需要绕行
        if (!isPathBlocked(fromX, fromZ, toX, toZ)) {
            return [];
        }

        // 获取主障碍物（用于计算绕行方向）
        const primary = _obstacles[primaryObstacleIndex];
        if (!primary) return [];

        const { minX, maxX, minZ, maxZ, cx, cz, hw, hz } = getBoxParams(primary);
        const m = detourMargin;

        // ── 第 1 级：2 段路径，经过包围盒面中点 ──
        const faceCenters = [
            { x: cx,         z: cz + hz + m },  // 前
            { x: cx,         z: cz - hz - m },  // 后
            { x: cx - hw - m, z: cz },          // 左
            { x: cx + hw + m, z: cz },          // 右
        ];
        for (const p of faceCenters) {
            if (!isPathBlocked(fromX, fromZ, p.x, p.z) && !isPathBlocked(p.x, p.z, toX, toZ)) {
                return [p];
            }
        }

        // ── 第 2 级：单个角点绕行（按总路程排序，最短优先）──
        const corners = [
            { x: minX - m, z: minZ - m },  // 0: 后左
            { x: maxX + m, z: minZ - m },  // 1: 后右
            { x: maxX + m, z: maxZ + m },  // 2: 前右
            { x: minX - m, z: maxZ + m },  // 3: 前左
        ];

        const sortedCorners = [...corners].sort((a, b) => {
            const da = dist(fromX, fromZ, a.x, a.z) + dist(a.x, a.z, toX, toZ);
            const db = dist(fromX, fromZ, b.x, b.z) + dist(b.x, b.z, toX, toZ);
            return da - db;
        });
        for (const c of sortedCorners) {
            if (!isPathBlocked(fromX, fromZ, c.x, c.z) && !isPathBlocked(c.x, c.z, toX, toZ)) {
                return [c];
            }
        }

        // ── 第 3 级：相邻角点对（先试单角，不行再用双角）──
        const adj = [[0, 1], [1, 2], [2, 3], [3, 0]];
        for (const [i, j] of adj) {
            const a = corners[i], b = corners[j];
            const first = dist(fromX, fromZ, a.x, a.z) <= dist(fromX, fromZ, b.x, b.z) ? a : b;
            const second = first === a ? b : a;

            if (!isPathBlocked(fromX, fromZ, first.x, first.z) &&
                !isPathBlocked(first.x, first.z, toX, toZ)) {
                return [first];
            }

            if (!isPathBlocked(fromX, fromZ, first.x, first.z) &&
                !isPathBlocked(first.x, first.z, second.x, second.z) &&
                !isPathBlocked(second.x, second.z, toX, toZ)) {
                return [first, second];
            }
        }

        // ── 第 4 级：对角（先试单角，不行再用双角）──
        const diag = [[0, 2], [1, 3]];
        for (const [i, j] of diag) {
            const a = corners[i], b = corners[j];
            const first = dist(fromX, fromZ, a.x, a.z) <= dist(fromX, fromZ, b.x, b.z) ? a : b;
            const second = first === a ? b : a;

            if (!isPathBlocked(fromX, fromZ, first.x, first.z) &&
                !isPathBlocked(first.x, first.z, toX, toZ)) {
                return [first];
            }

            if (!isPathBlocked(fromX, fromZ, first.x, first.z) &&
                !isPathBlocked(first.x, first.z, second.x, second.z) &&
                !isPathBlocked(second.x, second.z, toX, toZ)) {
                return [first, second];
            }
        }

        // ── 第 5 级（极端兜底）：返回最近的角点 ──
        corners.sort((a, b) => dist(a.x, a.z, fromX, fromZ) - dist(b.x, b.z, fromX, fromZ));
        return [corners[0]];
    }

    return {
        isPathBlocked,
        computeWaypoints,
    };
}
