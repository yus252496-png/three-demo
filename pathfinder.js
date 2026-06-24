/**
 * AABB 障碍物避让路径规划器
 *
 * 基于 AABB（轴对齐包围盒）的 2D 路径规划模块
 * 用于检测直线路径是否被障碍物挡住，并计算出绕行路线
 *
 * 外部用法：
 *   import { createAABBAvoidance } from './pathfinder.js';
 *   const pf = createAABBAvoidance([carMesh], { safetyMargin: 0.6, detourMargin: 1.0 });
 *   const blocked = pf.isPathBlocked(x1, z1, x2, z2);       // 检测是否被阻挡
 *   const pts = pf.computeWaypoints(x1, z1, x2, z2);        // 计算绕行路径点
 */

// 导入 Three.js 核心库，用于 Box3 和 Vector3 等几何计算
import * as THREE from 'three';

// =========================================
// 工具函数：计算 2D 距离
// =========================================
function dist(x1, z1, x2, z2) {
    // 返回两点在 XZ 平面上的直线距离（勾股定理）
    return Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
}

// =========================================
// 工具函数：获取 3D 物体在 XZ 平面的包围盒参数
// =========================================
function getBoxParams(obj) {
    // 更新物体及其子物体的世界矩阵，确保位置数据最新
    obj.updateWorldMatrix(true, true);
    // 计算物体的轴对齐包围盒（AABB）
    const box = new THREE.Box3().setFromObject(obj);
    // 返回包围盒的各项参数
    return {
        minX: box.min.x,  // 最小 X 坐标（左边界）
        maxX: box.max.x,  // 最大 X 坐标（右边界）
        minZ: box.min.z,  // 最小 Z 坐标（后边界）
        maxZ: box.max.z,  // 最大 Z 坐标（前边界）
        cx: (box.min.x + box.max.x) / 2,   // 中心点 X
        cz: (box.min.z + box.max.z) / 2,   // 中心点 Z
        hw: (box.max.x - box.min.x) / 2,   // 半宽（从中心到左右边界的距离）
        hz: (box.max.z - box.min.z) / 2,   // 半深（从中心到前后边界的距离）
    };
}

/**
 * 创建 AABB 避障路径规划器
 *
 * @param {THREE.Object3D[]} obstacles - 障碍物模型数组（比如汽车）
 * @param {Object} options - 配置参数
 * @param {number} options.safetyMargin - 碰撞检测的安全距离，包围盒向外扩多少（默认 0.6）
 * @param {number} options.detourMargin - 绕行点距包围盒边缘的外推距离（默认 1.0）
 * @param {number} options.sampleDensity - 路径采样密度，多少个单位采一个点（默认 0.3）
 * @param {number} options.minSamples - 最少采样点数，路径太短也至少要采这么多个点（默认 50）
 * @returns {{ isPathBlocked, computeWaypoints }} 返回两个方法
 */
export function createAABBAvoidance(obstacles, options = {}) {
    // 解构配置参数，没有传就用默认值
    const {
        safetyMargin = 0.6,
        detourMargin = 1.0,
        sampleDensity = 0.3,
        minSamples = 50,
    } = options;

    // 保留障碍物列表的引用，后续可以动态添加
    const _obstacles = obstacles;

    // =========================================
    // 检测直线路径是否被障碍物挡住
    // 原理：从起点到终点之间均匀采样多个点，检查是否有落在障碍物包围盒内的
    // =========================================
    function isPathBlocked(x1, z1, x2, z2) {
        // 遍历所有障碍物
        for (const obstacle of _obstacles) {
            // 更新障碍物的世界矩阵
            obstacle.updateWorldMatrix(true, true);
            // 计算障碍物的包围盒
            const box = new THREE.Box3().setFromObject(obstacle);
            // 把包围盒向外扩大 safetyMargin，作为碰撞检测的安全范围
            box.expandByScalar(safetyMargin);

            // 计算起点到终点的总距离
            const totalDist = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
            // 计算需要采样多少个点（至少 minSamples 个，总距离越长采样越多）
            const samples = Math.max(minSamples, Math.ceil(totalDist / sampleDensity));
            // 从 1 循环到 samples-1（避开起点的 0 和终点的最后一个点）
            for (let i = 1; i < samples; i++) {
                // t 是 0~1 之间的比例，表示在路径上的位置
                const t = i / samples;
                // 线性插值计算采样点的坐标
                const px = x1 + (x2 - x1) * t;
                const pz = z1 + (z2 - z1) * t;
                // 如果采样点落在了包围盒内，说明路径被挡住了
                if (box.containsPoint(new THREE.Vector3(px, 0.5, pz))) {
                    return true;
                }
            }
        }
        // 所有采样点都没落到包围盒内，路径畅通
        return false;
    }

    // =========================================
    // 生成绕行路径（5 级回退算法）
    //
    // 算法的思路：先尝试最简单的绕行方案，如果不行就逐步升级到更复杂的方案
    // 每一次算出来都检查两段路径是否都畅通（起点→绕行点 + 绕行点→终点）
    //
    // 返回值：
    //   []       → 直线可达，不需要绕行
    //   [p]      → 经过一个绕行点即可避开障碍物
    //   [p1, p2] → 需要经过两个绕行点
    //
    // 绕行点始终在障碍物包围盒 + detourMargin 之外
    // =========================================
    function computeWaypoints(fromX, fromZ, toX, toZ) {
        // 第 0 步：先检测直线是否已经畅通
        // 直线可达 → 返回空数组，表示不需要绕行
        if (!isPathBlocked(fromX, fromZ, toX, toZ)) {
            return [];
        }

        // 获取障碍物的包围盒参数
        // 这里用数组里的第一个障碍物（通常是汽车）来生成绕行点
        const primary = _obstacles[0];
        if (!primary) return [];

        // 获取包围盒的各项参数
        const { minX, maxX, minZ, maxZ, cx, cz, hw, hz } = getBoxParams(primary);
        // m 是绕行外推距离，绕行点离包围盒至少这么远
        const m = detourMargin;

        // ── 第 1 级：2 段路径，经过包围盒的四个面中点 ──
        // 取包围盒四个面的外侧中点作为候选绕行点
        const faceCenters = [
            { x: cx, z: cz + hz + m },  // 前方（Z 正方向）
            { x: cx, z: cz - hz - m },  // 后方（Z 负方向）
            { x: cx - hw - m, z: cz },          // 左方（X 负方向）
            { x: cx + hw + m, z: cz },          // 右方（X 正方向）
        ];
        // 遍历每个候选点，检测"起点→绕行点"和"绕行点→终点"两段是否都畅通
        for (const p of faceCenters) {
            // 两段都不被阻挡 → 方案可行
            if (!isPathBlocked(fromX, fromZ, p.x, p.z) && !isPathBlocked(p.x, p.z, toX, toZ)) {
                return [p];
            }
        }

        // ── 第 2 级：单个角点绕行 ──
        // 取包围盒的四个角（左下、右下、右上、左上）的外侧作为候选
        const corners = [
            { x: minX - m, z: minZ - m },  // 0: 后左角
            { x: maxX + m, z: minZ - m },  // 1: 后右角
            { x: maxX + m, z: maxZ + m },  // 2: 前右角
            { x: minX - m, z: maxZ + m },  // 3: 前左角
        ];

        // 按总路程（起点→角点 + 角点→终点）排序，最近的优先尝试
        const sortedCorners = [...corners].sort((a, b) => {
            const da = dist(fromX, fromZ, a.x, a.z) + dist(a.x, a.z, toX, toZ);
            const db = dist(fromX, fromZ, b.x, b.z) + dist(b.x, b.z, toX, toZ);
            return da - db;
        });
        // 遍历排序后的角点
        for (const c of sortedCorners) {
            if (!isPathBlocked(fromX, fromZ, c.x, c.z) && !isPathBlocked(c.x, c.z, toX, toZ)) {
                return [c];
            }
        }

        // ── 第 3 级：相邻角点对 ──
        // 如果单个角点不行，尝试两个相邻角点（从起点到角1到角2再到终点）
        const adj = [[0, 1], [1, 2], [2, 3], [3, 0]];
        for (const [i, j] of adj) {
            const a = corners[i], b = corners[j];
            // 选择离起点更近的那个角作为第一个绕行点
            const first = dist(fromX, fromZ, a.x, a.z) <= dist(fromX, fromZ, b.x, a.z) ? a : b;
            const second = first === a ? b : a;

            // 先试只用第一个角点
            if (!isPathBlocked(fromX, fromZ, first.x, first.z) &&
                !isPathBlocked(first.x, first.z, toX, toZ)) {
                return [first];
            }

            // 第一个不行，尝试两个角点组合
            if (!isPathBlocked(fromX, fromZ, first.x, first.z) &&
                !isPathBlocked(first.x, first.z, second.x, second.z) &&
                !isPathBlocked(second.x, second.z, toX, toZ)) {
                return [first, second];
            }
        }

        // ── 第 4 级：对角 ──
        // 如果相邻角不行，尝试对角线上的两个角
        const diag = [[0, 2], [1, 3]];
        for (const [i, j] of diag) {
            const a = corners[i], b = corners[j];
            const first = dist(fromX, fromZ, a.x, a.z) <= dist(fromX, fromZ, b.x, b.z) ? a : b;
            const second = first === a ? b : a;

            // 先试单角
            if (!isPathBlocked(fromX, fromZ, first.x, first.z) &&
                !isPathBlocked(first.x, first.z, toX, toZ)) {
                return [first];
            }

            // 再试双角
            if (!isPathBlocked(fromX, fromZ, first.x, first.z) &&
                !isPathBlocked(first.x, first.z, second.x, second.z) &&
                !isPathBlocked(second.x, second.z, toX, toZ)) {
                return [first, second];
            }
        }

        // ── 第 5 级（极端兜底）──
        // 以上所有方案都失败，直接从所有角点中选离起点最近的那个
        corners.sort((a, b) => dist(a.x, a.z, fromX, fromZ) - dist(b.x, b.z, fromX, fromZ));
        return [corners[0]];
    }

    // 返回两个核心方法供外部使用
    return {
        isPathBlocked,
        computeWaypoints,
    };
}
