import { Canvas } from '@react-three/fiber'
import { Rose } from './Rose'
import { Environment, OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import { Bloom, EffectComposer } from '@react-three/postprocessing'

export function RoseGlass() {
  return (
    <>
      <Canvas>
        <color attach='background' args={['#000']}></color>
        <Yo></Yo>
      </Canvas>
    </>
  )
}

function Yo() {
  return (
    <>
      <OrbitControls object-position={[0, 0.3, 0.2]} makeDefault target={[0, 0.3, -0.07]}></OrbitControls>
      <Suspense fallback={null}>
        <Rose></Rose>
      </Suspense>
      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.1} intensity={10} mipmapBlur></Bloom>
      </EffectComposer>
      <Environment files={`/hdr/greenwich_park_02_1k.hdr`}></Environment>
    </>
  )
}
