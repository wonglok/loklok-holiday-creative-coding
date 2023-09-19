import { Canvas, useLoader } from '@react-three/fiber'
import { GLTFLoader154 } from './Loader/Loader154'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei'

export function Transition() {
  return (
    <>
      <Canvas>
        <PerspectiveCamera makeDefault></PerspectiveCamera>
        <OrbitControls makeDefault object-position={[0, 3, 10]} target={[0, 3, 0]}></OrbitControls>
        <Content></Content>
        <directionalLight intensity={0.1} position={[3, 3, 3]}></directionalLight>
        <Environment files={'/hdr/shanghai.hdr'}></Environment>
      </Canvas>
    </>
  )
}

function Content() {
  let glb = useLoader(GLTFLoader154, `/transition/ball-scene.glb`, (loader) => {
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/')
    loader.setDRACOLoader(dracoLoader)
  })

  return (
    <>
      <group
        onClick={(ev) => {
          //
          console.log(ev.point)
          //
        }}
      >
        <primitive object={glb.scene}></primitive>
      </group>
    </>
  )
}
