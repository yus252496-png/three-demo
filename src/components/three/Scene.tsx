import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { SceneLights } from './SceneLights'
import { Ground } from './Ground'
import { Car } from './Car'
import { Soldier } from './Soldier'
import { Queen } from './Queen'
import { Batman } from './Batman'
import { GroundClickCatcher } from './GroundClickCatcher'
import { SceneController } from './SceneController'
import { useCallback } from 'react'
import { LoadingScreen } from '../business/LoadingScreen'
import { useLoadingStore, calcProgress, TOTAL_MODELS } from '../../store/loadingStore'

export function Scene() {
  const loaded = useLoadingStore((s) => s.loaded)
  const done = loaded >= TOTAL_MODELS

  const markOne = useCallback(() => useLoadingStore.getState().markOne(), [])

  return (
    <>
      <Canvas
        camera={{ position: [3, 3, 5], fov: 75, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <OrbitControls enableDamping dampingFactor={0.1} zoomToCursor />

        <SceneLights />
        <Ground />
        <Car onLoaded={markOne} />
        <Soldier onLoaded={markOne} />
        <Queen onLoaded={markOne} />
        <Batman onLoaded={markOne} />

        <GroundClickCatcher />
        <SceneController />
      </Canvas>

      {!done && <LoadingScreen progress={calcProgress(loaded)} />}
    </>
  )
}
