/** 场景光照：环境光 + 平行光 */
export function SceneLights() {
  return (
    <>
      <ambientLight intensity={1} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
    </>
  )
}
