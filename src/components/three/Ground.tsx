/** 地面 + 辅助网格 */
export function Ground() {
  return (
    <>
      {/* 实体地面 */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.01} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#222233" roughness={0.8} metalness={0.1} />
      </mesh>
      {/* 辅助网格 */}
      <gridHelper args={[10, 20, '#6666aa', '#444466']} />
    </>
  )
}
