import { Box, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Sky } from './Sky/Sky'
import { Bloom, EffectComposer, SSR, Vignette } from '@react-three/postprocessing'

export function FancyTouch() {
  return (
    <div className='h-full w-full'>
      <Canvas>
        <Content></Content>
      </Canvas>
    </div>
  )
}
function Content() {
  return (
    <>
      <PerspectiveCamera makeDefault fov={75} far={600} position={[0, 0, 0.1]}></PerspectiveCamera>
      <OrbitControls makeDefault></OrbitControls>
      <EffectComposer disableNormalPass multisampling={0}>
        <Bloom luminanceThreshold={0.1} intensity={1} mipmapBlur={false}></Bloom>
        <Vignette></Vignette>
      </EffectComposer>
      <Sky></Sky>
    </>
  )
}
