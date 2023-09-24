import { Canvas } from '@react-three/fiber'
import { Rose } from './Rose'
import { Environment, OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'

export function RoseGlass() {
  return (
    <>
      <Canvas>
        <Yo></Yo>
      </Canvas>
    </>
  )
}

function Yo() {
  return (
    <>
      <OrbitControls object-position={[0, 0, 1]} makeDefault target={[0, 0, 0]}></OrbitControls>
      <Suspense fallback={null}>
        <Rose></Rose>
      </Suspense>
      <Environment background files={`/hdr/greenwich_park_02_1k.hdr`}></Environment>
    </>
  )
}
