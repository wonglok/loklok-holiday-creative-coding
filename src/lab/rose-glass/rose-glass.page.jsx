import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { Rose3 } from './Rose3'

export function RoseGlassYo() {
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
      <OrbitControls object-position={[0, 0.5, 0.08]} makeDefault target={[0, 0.33, -0.07]}></OrbitControls>
      <Suspense fallback={null}>
        <Rose3></Rose3>
      </Suspense>
      <Environment files={`/hdr/greenwich_park_02_1k.hdr`}></Environment>
      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.1} intensity={10} mipmapBlur></Bloom>
      </EffectComposer>
    </>
  )
}
