import { Box, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Sky } from './Sky/Sky'

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
      <PerspectiveCamera makeDefault fov={75} far={500} position={[0, 0, 1]}></PerspectiveCamera>
      <OrbitControls makeDefault></OrbitControls>
      <Sky></Sky>
    </>
  )
}
