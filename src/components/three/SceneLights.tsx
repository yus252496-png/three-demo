/** 场景光照：半球光 + 主方向光阴影 + 辅光 */
export function SceneLights() {
  return (
    <>
      <hemisphereLight args={[0x606090, 0x202030, 0.6]} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.001}
      />
      <directionalLight position={[-3, 4, -3]} intensity={0.4} />
    </>
  )
}
